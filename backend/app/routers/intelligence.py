"""Intelligence router — unified farm intelligence endpoint (Phase 14 spec).

GET /farms/{farm_id}/intelligence returns:
  farm, crop, weather, satellite, soil, climate, score, alerts, recommendations

Real data sources:
  - Open-Meteo    → current weather + 7-day forecast
  - NASA POWER    → historical climate baseline (anomaly detection)
  - MODIS Terra   → NDVI time series (ORNL DAAC, no auth required)
"""

import asyncio
import datetime
import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Alert,
    Crop,
    Farm,
    HealthScoreSnapshot,
    Recommendation as RecModel,
    WeatherRecord,
)
from app.services.ml_engine import load_or_train, predict_forecast
from app.services.ndvi_cache import get_ndvi_series_cached
from app.services.weather_service import weather_service

import agricore
import alerts as alert_engine
import crop_knowledge

router = APIRouter(prefix="/farms", tags=["intelligence"])

MODIS_SOURCE = "MODIS Terra (MOD13Q1, 250m)"


def _get_farm_or_404(db: Session, farm_id: int) -> Farm:
    farm = db.query(Farm).get(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm.latitude is None or farm.longitude is None:
        raise HTTPException(status_code=400, detail="Farm has no coordinates set")
    return farm


def _build_context(
    farm: Farm,
    latest_crop: Crop | None,
    current: dict,
    forecast: dict,
    ndvi_series: list[dict],
    climate_anomaly: dict | None,
) -> agricore.FarmContext:
    et0 = None
    if "daily" in forecast and "et0_fao_evapotranspiration" in forecast["daily"]:
        et0_list = forecast["daily"]["et0_fao_evapotranspiration"]
        if et0_list:
            et0 = et0_list[0]  # today's ET₀

    # Latest NDVI + change vs. the previous 16-day composite
    ndvi = ndvi_series[-1]["ndvi"] if ndvi_series else None
    ndvi_change = (
        round(ndvi_series[-1]["ndvi"] - ndvi_series[-2]["ndvi"], 4)
        if len(ndvi_series) >= 2
        else None
    )

    current_growth_stage = None
    if latest_crop:
        if latest_crop.sowing_date:
            derived = crop_knowledge.derive_growth_stage(latest_crop.crop_name, latest_crop.sowing_date)
            current_growth_stage = derived["stage"]
        else:
            current_growth_stage = latest_crop.growth_stage

    return agricore.FarmContext(
        farm_id=farm.id,
        crop_name=latest_crop.crop_name if latest_crop else None,
        growth_stage=current_growth_stage,
        sowing_date=str(latest_crop.sowing_date) if latest_crop and latest_crop.sowing_date else None,
        temperature_c=current.get("temperature_2m"),
        humidity_pct=current.get("relative_humidity_2m"),
        rainfall_mm=current.get("precipitation"),
        wind_speed_kmh=current.get("wind_speed_10m"),
        et0_mm=et0,
        soil_moisture_m3m3=current.get("soil_moisture_0_to_7cm"),
        soil_temperature_c=current.get("soil_temperature_0_to_7cm"),
        ndvi=ndvi,
        ndvi_change=ndvi_change,
        temp_anomaly_c=(climate_anomaly or {}).get("temp_anomaly_c"),
        humidity_anomaly_pct=(climate_anomaly or {}).get("humidity_anomaly_pct"),
        historical_mean_temp_c=(climate_anomaly or {}).get("historical_mean_temp_c"),
    )


def _persist_weather_observation(farm: Farm, current: dict, db: Session):
    """Save the current weather observation to the database."""
    now = datetime.datetime.utcnow()
    record = WeatherRecord(
        farm_id=farm.id,
        timestamp=now,
        temperature_c=current.get("temperature_2m"),
        humidity_pct=current.get("relative_humidity_2m"),
        rainfall_mm=current.get("precipitation"),
        wind_speed_kmh=current.get("wind_speed_10m"),
        cloud_cover_pct=current.get("cloud_cover"),
        source="open-meteo",
    )
    db.add(record)
    db.commit()


def _persist_recommendation(farm_id: int, rec, db: Session):
    """Save the generated recommendation to the database."""
    db.add(RecModel(
        farm_id=farm_id,
        recommendation_text=rec.text,
        reason=rec.reasoning,
        confidence=rec.confidence,
        risk_level=rec.risk_level,
    ))
    db.commit()


def _persist_alerts(farm_id: int, alert_list, db: Session):
    """Save detected alerts, skipping duplicates raised within the last 24 hours."""
    if not alert_list:
        return
    since = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
    recent = {
        (a.category, a.severity, a.title)
        for a in db.query(Alert)
        .filter(Alert.farm_id == farm_id, Alert.created_at >= since)
        .all()
    }
    added = False
    for a in alert_list:
        key = (a.category, a.severity, a.title)
        if key in recent:
            continue
        db.add(Alert(
            farm_id=farm_id,
            severity=a.severity,
            category=a.category,
            title=a.title,
            description=a.description,
            evidence=json.dumps(a.evidence),
            recommendation=a.recommendation,
        ))
        recent.add(key)
        added = True
    if added:
        db.commit()


def _persist_score_snapshot(farm_id: int, score, db: Session):
    """Save a health-score snapshot (at most one per hour unless the score changes)."""
    latest = (
        db.query(HealthScoreSnapshot)
        .filter(HealthScoreSnapshot.farm_id == farm_id)
        .order_by(HealthScoreSnapshot.created_at.desc())
        .first()
    )
    if latest:
        fresh = (datetime.datetime.utcnow() - latest.created_at).total_seconds() < 3600
        if fresh and latest.overall == score.overall:
            return
    db.add(HealthScoreSnapshot(
        farm_id=farm_id,
        overall=score.overall,
        vegetation=score.vegetation,
        water=score.water,
        weather=score.weather,
        pest_risk=score.pest_risk,
        climate=score.climate,
    ))
    db.commit()


def _build_grounding(
    db: Session,
    farm_id: int,
    score,
    ndvi_series: list[dict],
    score_forecast: list[dict],
    ml_meta: dict | None,
    air_quality: dict | None,
) -> str | None:
    """Compact summary of this farm's own recorded history to ground the AI —
    past observations, alerts, previous advice, ML forecast, air quality."""
    now = datetime.datetime.utcnow()
    since = now - datetime.timedelta(days=7)
    lines = []

    obs = (
        db.query(WeatherRecord)
        .filter(WeatherRecord.farm_id == farm_id, WeatherRecord.timestamp >= since)
        .all()
    )
    if obs:
        temps = [o.temperature_c for o in obs if o.temperature_c is not None]
        rains = [o.rainfall_mm for o in obs if o.rainfall_mm is not None]
        parts = [f"{len(obs)} observations recorded in the last 7 days"]
        if temps:
            parts.append(
                f"avg temp {sum(temps) / len(temps):.1f}°C (min {min(temps):.1f}, max {max(temps):.1f})"
            )
        if rains:
            parts.append(f"total rain {sum(rains):.1f} mm")
        lines.append("LOCAL FARM HISTORY: " + "; ".join(parts))

    if len(ndvi_series) >= 2:
        first, last = ndvi_series[0], ndvi_series[-1]
        lines.append(
            f"NDVI 12-MONTH TREND (MODIS): latest {last['ndvi']:.3f}, "
            f"12 months ago {first['ndvi']:.3f} (change {last['ndvi'] - first['ndvi']:+.3f})"
        )

    recent_alerts = (
        db.query(Alert)
        .filter(Alert.farm_id == farm_id)
        .order_by(Alert.created_at.desc())
        .limit(3)
        .all()
    )
    if recent_alerts:
        lines.append(
            "RECENT ALERTS RAISED FOR THIS FARM: "
            + "; ".join(f"[{a.severity}] {a.title}" for a in recent_alerts)
        )

    last_rec = (
        db.query(RecModel)
        .filter(RecModel.farm_id == farm_id)
        .order_by(RecModel.created_at.desc())
        .first()
    )
    if last_rec:
        age_days = (now - last_rec.created_at).days if last_rec.created_at else 0
        lines.append(
            f"PREVIOUS ADVICE ({age_days} day(s) ago, current score {score.overall}/100): "
            f"{last_rec.recommendation_text[:160]}"
        )

    if score_forecast and ml_meta:
        trend = ", ".join(f"{f['date']}: {f['predicted_score']}" for f in score_forecast)
        lines.append(
            f"7-DAY ML SCORE FORECAST (random forest trained on {ml_meta['samples']} local "
            f"observations, {ml_meta['trained_on']}, fit R² {ml_meta['fit_r2']}): {trend}"
        )

    if air_quality:
        lines.append(
            f"REAL-TIME AIR QUALITY: PM2.5 {air_quality.get('pm2_5')} µg/m³, "
            f"PM10 {air_quality.get('pm10')} µg/m³ (Open-Meteo / CAMS)"
        )

    return "\n".join(lines) if lines else None


def _public_ml_meta(meta: dict | None) -> dict | None:
    """Whitelist of model metadata safe/interesting for the API response."""
    if not meta:
        return None
    return {
        "trained_at": meta.get("trained_at"),
        "samples": meta.get("samples"),
        "observed_samples": meta.get("observed_samples"),
        "trained_on": meta.get("trained_on"),
        "fit_r2": meta.get("fit_r2"),
        "feature_importances": meta.get("feature_importances"),
    }


# ── Intelligence Endpoint ────────────────────────────────────────────────────
@router.get("/{farm_id}/intelligence")
async def get_farm_intelligence(farm_id: int, db: Session = Depends(get_db)):
    """
    Unified intelligence endpoint — returns everything for one farm.

    Response shape:
    {
      farm, crop, weather, satellite, soil, climate,
      score, alerts, recommendations, provenance
    }
    """
    farm = _get_farm_or_404(db, farm_id)

    # Fetch live data in parallel: weather (current + forecast) and MODIS NDVI (cached)
    current_data, forecast_data, ndvi_series = await asyncio.gather(
        weather_service.get_current_weather_open_meteo(farm.latitude, farm.longitude),
        weather_service.get_forecast_open_meteo(farm.latitude, farm.longitude, forecast_days=7),
        get_ndvi_series_cached(farm.id, farm.latitude, farm.longitude, months=12, db=db),
    )

    current = current_data.get("current", {})
    daily = forecast_data.get("daily", {})

    # NASA POWER climate anomaly + real-time air quality (after weather, in parallel)
    climate_anomaly, air_quality = await asyncio.gather(
        weather_service.get_climate_anomaly(
            farm.latitude, farm.longitude,
            current_temp=current.get("temperature_2m"),
            current_humidity=current.get("relative_humidity_2m"),
        ),
        weather_service.get_air_quality(farm.latitude, farm.longitude),
    )

    # Persist observations
    _persist_weather_observation(farm, current, db)

    # Most recent crop
    latest_crop = (
        db.query(Crop).filter(Crop.farm_id == farm.id).order_by(Crop.id.desc()).first()
    )

    # Build context
    ctx = _build_context(farm, latest_crop, current, forecast_data, ndvi_series, climate_anomaly)

    # Health score
    score = agricore.compute_health_score(ctx)
    _persist_score_snapshot(farm_id, score, db)

    # Local ML model — trained on this farm's accumulated observations
    model, ml_meta = load_or_train(db, farm_id, climate_anomaly)
    score_forecast = predict_forecast(model, ml_meta, daily)

    # Ground the AI recommendation in the farm's own history + ML forecast
    grounding = _build_grounding(db, farm_id, score, ndvi_series, score_forecast, ml_meta, air_quality)

    # Alerts
    active_alerts = alert_engine.detect_alerts(ctx, score)
    _persist_alerts(farm_id, active_alerts, db)

    # Recommendation (Gemini when configured, rule-based fallback otherwise)
    rec = await agricore.generate_recommendation(ctx, score, grounding=grounding)
    _persist_recommendation(farm_id, rec, db)

    # Forecast summary
    forecast_dates = daily.get("time", [])
    forecast_summary = []
    for i, d in enumerate(forecast_dates):
        forecast_summary.append({
            "date": d,
            "temp_max": _si(daily.get("temperature_2m_max"), i),
            "temp_min": _si(daily.get("temperature_2m_min"), i),
            "rain_mm": _si(daily.get("precipitation_sum"), i),
            "et0_mm": _si(daily.get("et0_fao_evapotranspiration"), i),
        })

    now = datetime.datetime.utcnow()

    return {
        "farm": {
            "id": farm.id,
            "name": farm.name,
            "district": farm.district,
            "province": farm.province,
            "area_acres": farm.area_acres,
            "latitude": farm.latitude,
            "longitude": farm.longitude,
            "geometry": farm.geometry_geojson,
        },
        "crop": {
            "name": latest_crop.crop_name if latest_crop else None,
            "season": latest_crop.season if latest_crop else None,
            "growth_stage": ctx.growth_stage,
            "sowing_date": str(latest_crop.sowing_date) if latest_crop and latest_crop.sowing_date else None,
        } if latest_crop else None,
        "weather": {
            "temperature_c": ctx.temperature_c,
            "humidity_pct": ctx.humidity_pct,
            "rainfall_mm": ctx.rainfall_mm,
            "wind_speed_kmh": ctx.wind_speed_kmh,
            "soil_moisture_m3m3": ctx.soil_moisture_m3m3,
            "soil_temperature_c": ctx.soil_temperature_c,
            "et0_mm": ctx.et0_mm,
            "air_quality": air_quality,
            "source": "Open-Meteo",
            "observed_at": now.isoformat(),
        },
        "forecast": forecast_summary,
        "score_forecast": score_forecast,
        "ml": _public_ml_meta(ml_meta),
        "satellite": {
            "ndvi": ctx.ndvi,
            "ndvi_change": ctx.ndvi_change,
            "source": MODIS_SOURCE if ctx.ndvi is not None else None,
            "series": ndvi_series,
        },
        "climate": {
            "baseline_period": climate_anomaly.get("baseline_period"),
            "baseline_source": climate_anomaly.get("baseline_source"),
            "historical_mean_temp_c": climate_anomaly.get("historical_mean_temp_c"),
            "temp_anomaly_c": climate_anomaly.get("temp_anomaly_c"),
            "historical_mean_humidity_pct": climate_anomaly.get("historical_mean_humidity_pct"),
            "humidity_anomaly_pct": climate_anomaly.get("humidity_anomaly_pct"),
            "historical_total_precip_mm": climate_anomaly.get("historical_total_precip_mm"),
        } if climate_anomaly else None,
        "soil": {
            "moisture_m3m3": ctx.soil_moisture_m3m3,
            "temperature_c": ctx.soil_temperature_c,
            "source": "Open-Meteo",
        },
        "score": {
            "value": score.overall,
            "status": _score_status(score.overall),
            "breakdown": {
                "vegetation": score.vegetation,
                "water": score.water,
                "weather": score.weather,
                "pest_risk": score.pest_risk,
                "climate": score.climate,
            },
        },
        "alerts": [
            {
                "severity": a.severity,
                "category": a.category,
                "title": a.title,
                "description": a.description,
                "evidence": a.evidence,
                "recommendation": a.recommendation,
                "icon": a.icon,
            }
            for a in active_alerts
        ],
        "recommendation": {
            "text": rec.text,
            "reasoning": rec.reasoning,
            "text_ur": rec.text_ur,
            "reasoning_ur": rec.reasoning_ur,
            "confidence": rec.confidence,
            "risk_level": rec.risk_level,
        },
        "provenance": {
            "weather_source": "Open-Meteo",
            "weather_retrieved_at": now.isoformat(),
            "satellite_source": MODIS_SOURCE if ctx.ndvi is not None else "Not available",
            "climate_source": "NASA POWER (MERRA-2)" if climate_anomaly else "Not available",
            "score_engine": "AgriCore v0.1 + local ML (random forest)" if ml_meta else "AgriCore v0.1",
            "crop_knowledge": "Punjab Agriculture Department",
        },
    }


def _score_status(score: int) -> str:
    if score >= 86:
        return "excellent"
    if score >= 71:
        return "good"
    if score >= 51:
        return "moderate"
    if score >= 31:
        return "poor"
    return "critical"


def _si(lst: list | None, idx: int):
    if lst and idx < len(lst):
        return lst[idx]
    return None
