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
from app.models import Alert, Crop, Farm, Recommendation as RecModel, WeatherRecord
from app.services.ndvi_cache import get_ndvi_series_cached
from app.services.weather_service import weather_service

import agricore
import alerts as alert_engine

router = APIRouter(prefix="/farms", tags=["intelligence"])

MODIS_SOURCE = "MODIS Terra (MOD13Q1, 250m)"


def _get_farm_or_404(db: Session, farm_id: int) -> Farm:
    farm = db.query(Farm).get(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm.latitude is None or farm.longitude is None:
        raise HTTPException(status_code=400, detail="Farm has no coordinates set")
    return farm


def _build_farm_context(
    farm: Farm,
    current_weather: dict,
    daily_forecast: dict | None,
    climate_anomaly: dict | None,
    ndvi_series: list[dict],
    db: Session,
) -> agricore.FarmContext:
    """Build a FarmContext from live weather, climate baseline, NDVI and crop data."""
    current = current_weather.get("current", {})

    # Most recent crop
    latest_crop = (
        db.query(Crop).filter(Crop.farm_id == farm.id).order_by(Crop.id.desc()).first()
    )

    # Get ET₀ from daily forecast if available
    et0 = None
    if daily_forecast:
        et0_list = daily_forecast.get("et0_fao_evapotranspiration")
        if et0_list:
            et0 = et0_list[0]  # today's ET₀

    # Latest NDVI + change vs. the previous 16-day composite
    ndvi = ndvi_series[-1]["ndvi"] if ndvi_series else None
    ndvi_change = (
        round(ndvi_series[-1]["ndvi"] - ndvi_series[-2]["ndvi"], 4)
        if len(ndvi_series) >= 2
        else None
    )

    return agricore.FarmContext(
        farm_id=farm.id,
        crop_name=latest_crop.crop_name if latest_crop else None,
        growth_stage=latest_crop.growth_stage if latest_crop else None,
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
    """Save detected alerts to the database."""
    for a in alert_list:
        db_alert = Alert(
            farm_id=farm_id,
            severity=a.severity,
            category=a.category,
            title=a.title,
            description=a.description,
            evidence=json.dumps(a.evidence),
            recommendation=a.recommendation,
        )
        db.add(db_alert)
    db.commit()


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

    # NASA POWER climate anomaly (needs current temp/humidity → after weather)
    climate_anomaly = await weather_service.get_climate_anomaly(
        farm.latitude, farm.longitude,
        current_temp=current.get("temperature_2m"),
        current_humidity=current.get("relative_humidity_2m"),
    )

    # Persist observations
    _persist_weather_observation(farm, current, db)

    # Build context
    ctx = _build_farm_context(farm, current_data, daily, climate_anomaly, ndvi_series, db)

    # Health score
    score = agricore.compute_health_score(ctx)

    # Alerts
    active_alerts = alert_engine.detect_alerts(ctx, score)
    _persist_alerts(farm_id, active_alerts, db)

    # Recommendation (Gemini when configured, rule-based fallback otherwise)
    rec = await agricore.generate_recommendation(ctx, score)
    _persist_recommendation(farm_id, rec, db)

    # Most recent crop
    latest_crop = (
        db.query(Crop).filter(Crop.farm_id == farm.id).order_by(Crop.id.desc()).first()
    )

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
            "growth_stage": latest_crop.growth_stage if latest_crop else None,
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
            "source": "Open-Meteo",
            "observed_at": now.isoformat(),
        },
        "forecast": forecast_summary,
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
            "confidence": rec.confidence,
            "risk_level": rec.risk_level,
        },
        "provenance": {
            "weather_source": "Open-Meteo",
            "weather_retrieved_at": now.isoformat(),
            "satellite_source": MODIS_SOURCE if ctx.ndvi is not None else "Not available",
            "climate_source": "NASA POWER (MERRA-2)" if climate_anomaly else "Not available",
            "score_engine": "AgriCore v0.1",
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
