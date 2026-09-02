"""Analytics router — health scoring, recommendations, and forecast data."""

import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Alert,
    Crop,
    Farm,
    HealthScoreSnapshot,
    Recommendation,
    SatelliteObservation,
    SoilObservation,
    WeatherRecord,
)
from app.schemas import RecommendationResponse, WarabandiAdviceResponse, WarabandiConfigUpdate
from app.services.weather_service import weather_service

# AgriCore imports (from data-engine directory, added to sys.path in main.py)
import agricore
import crop_knowledge
import warabandi_engine

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _get_farm_or_404(db: Session, farm_id: int) -> Farm:
    farm = db.query(Farm).get(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm.latitude is None or farm.longitude is None:
        raise HTTPException(status_code=400, detail="Farm has no coordinates set")
    return farm


def _build_farm_context(farm: Farm, weather_data: dict, db: Session) -> agricore.FarmContext:
    """Build a FarmContext from farm record + live weather + crop data."""
    current = weather_data.get("current", {})

    # Get the most recent crop
    latest_crop = (
        db.query(Crop)
        .filter(Crop.farm_id == farm.id)
        .order_by(Crop.id.desc())
        .first()
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
        et0_mm=None,  # not in current endpoint; would come from daily
        soil_moisture_m3m3=current.get("soil_moisture_0_to_7cm"),
        soil_temperature_c=current.get("soil_temperature_0_to_7cm"),
    )


# ── Health Score ──────────────────────────────────────────────────────────────
@router.get("/health/{farm_id}")
async def get_health_score(farm_id: int, db: Session = Depends(get_db)):
    """Compute a live health score for a farm using AgriCore."""
    farm = _get_farm_or_404(db, farm_id)

    # Fetch live weather to build context
    weather_data = await weather_service.get_current_weather_open_meteo(
        farm.latitude, farm.longitude
    )
    ctx = _build_farm_context(farm, weather_data, db)
    score = agricore.compute_health_score(ctx)

    return {
        "farm_id": farm_id,
        "health": {
            "overall": score.overall,
            "vegetation": score.vegetation,
            "water": score.water,
            "weather": score.weather,
            "pest_risk": score.pest_risk,
            "climate": score.climate,
        },
        "context": {
            "crop": ctx.crop_name,
            "growth_stage": ctx.growth_stage,
            "temperature_c": ctx.temperature_c,
            "humidity_pct": ctx.humidity_pct,
            "rainfall_mm": ctx.rainfall_mm,
            "soil_moisture_m3m3": ctx.soil_moisture_m3m3,
        },
    }


# ── AI Recommendation ─────────────────────────────────────────────────────────
@router.post("/recommendation/{farm_id}")
async def get_recommendation(farm_id: int, db: Session = Depends(get_db)):
    """Generate an AI recommendation for a farm using AgriCore + Gemini."""
    farm = _get_farm_or_404(db, farm_id)

    weather_data = await weather_service.get_current_weather_open_meteo(
        farm.latitude, farm.longitude
    )
    ctx = _build_farm_context(farm, weather_data, db)
    score = agricore.compute_health_score(ctx)
    rec = await agricore.generate_recommendation(ctx, score)

    # Persist to database
    db_rec = Recommendation(
        farm_id=farm_id,
        recommendation_text=rec.text,
        reason=rec.reasoning,
        confidence=rec.confidence,
        risk_level=rec.risk_level,
        category="general",
    )
    db.add(db_rec)
    db.commit()
    db.refresh(db_rec)

    return {
        "id": db_rec.id,
        "farm_id": farm_id,
        "recommendation": rec.text,
        "reasoning": rec.reasoning,
        "text_ur": rec.text_ur,
        "reasoning_ur": rec.reasoning_ur,
        "confidence": rec.confidence,
        "risk_level": rec.risk_level,
        "data_summary": rec.data_summary,
    }


@router.get("/recommendations/history/{farm_id}", response_model=list[RecommendationResponse])
def get_recommendation_history(farm_id: int, limit: int = 10, db: Session = Depends(get_db)):
    """Get past recommendations for a farm."""
    return (
        db.query(Recommendation)
        .filter(Recommendation.farm_id == farm_id)
        .order_by(Recommendation.created_at.desc())
        .limit(limit)
        .all()
    )


# ── 7-Day Forecast (chart-friendly) ──────────────────────────────────────────
@router.get("/forecast-chart/{farm_id}")
async def get_forecast_chart(farm_id: int, days: int = 7, db: Session = Depends(get_db)):
    """Return daily forecast data formatted for charting."""
    farm = _get_farm_or_404(db, farm_id)
    data = await weather_service.get_forecast_open_meteo(
        farm.latitude, farm.longitude, forecast_days=days
    )
    daily = data.get("daily", {})

    # Build chart-friendly array
    dates = daily.get("time", [])
    entries = []
    for i, date_str in enumerate(dates):
        entries.append({
            "date": date_str,
            "label": datetime.datetime.strptime(date_str, "%Y-%m-%d").strftime("%a %b %d"),
            "temp_max": _safe_index(daily.get("temperature_2m_max"), i),
            "temp_min": _safe_index(daily.get("temperature_2m_min"), i),
            "precipitation_mm": _safe_index(daily.get("precipitation_sum"), i),
            "et0_mm": _safe_index(daily.get("et0_fao_evapotranspiration"), i),
        })

    return {"farm_id": farm_id, "source": "open-meteo", "forecast": entries}


# ── Crop Knowledge ────────────────────────────────────────────────────────────
@router.get("/crops/knowledge")
def get_crop_knowledge():
    """Return the Pakistan crop knowledge base."""
    crops = []
    for entry in crop_knowledge.CROP_KNOWLEDGE_BASE:
        crops.append({
            "name": entry["crop"],
            "season": entry["season"],
            "sowing_window": entry["sowing_window"],
            "harvest_window": entry["harvest_window"],
            "optimal_temperature_c": entry["optimal_temperature_c"],
            "water_requirement_mm": entry["water_requirement_mm"],
            "growth_stages": entry["growth_stages"],
            "common_pests": entry["common_pests"],
        })
    return crops


# ── Farm History (digital twin timeline) ────────────────────────────────────
@router.get("/history/{farm_id}")
def get_farm_history(farm_id: int, db: Session = Depends(get_db)):
    """Historical record for a farm: score snapshots, weather observations,
    NDVI series, alerts and recommendations (most recent first for lists)."""
    farm = db.query(Farm).get(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    # Score snapshots — chronological, most recent 200
    scores = (
        db.query(HealthScoreSnapshot)
        .filter(HealthScoreSnapshot.farm_id == farm_id)
        .order_by(HealthScoreSnapshot.created_at.desc())
        .limit(200)
        .all()
    )[::-1]

    # Weather observations — chronological, most recent 500
    weather = (
        db.query(WeatherRecord)
        .filter(WeatherRecord.farm_id == farm_id)
        .order_by(WeatherRecord.timestamp.desc())
        .limit(500)
        .all()
    )[::-1]

    # NDVI observations — chronological, most recent 100
    ndvi = (
        db.query(SatelliteObservation)
        .filter(SatelliteObservation.farm_id == farm_id)
        .order_by(SatelliteObservation.date.desc())
        .limit(100)
        .all()
    )[::-1]

    # Alerts — newest first, most recent 50
    alerts = (
        db.query(Alert)
        .filter(Alert.farm_id == farm_id)
        .order_by(Alert.created_at.desc())
        .limit(50)
        .all()
    )

    # Recommendations — newest first, most recent 20
    recs = (
        db.query(Recommendation)
        .filter(Recommendation.farm_id == farm_id)
        .order_by(Recommendation.created_at.desc())
        .limit(20)
        .all()
    )

    return {
        "farm": {
            "id": farm.id,
            "name": farm.name,
            "district": farm.district,
            "province": farm.province,
        },
        "scores": [
            {
                "timestamp": s.created_at.isoformat() if s.created_at else None,
                "overall": s.overall,
                "vegetation": s.vegetation,
                "water": s.water,
                "weather": s.weather,
                "pest_risk": s.pest_risk,
                "climate": s.climate,
            }
            for s in scores
        ],
        "weather": [
            {
                "timestamp": w.timestamp.isoformat() if w.timestamp else None,
                "temperature_c": w.temperature_c,
                "humidity_pct": w.humidity_pct,
                "rainfall_mm": w.rainfall_mm,
                "wind_speed_kmh": w.wind_speed_kmh,
                "cloud_cover_pct": w.cloud_cover_pct,
            }
            for w in weather
        ],
        "ndvi": [
            {"date": n.date.date().isoformat() if n.date else None, "ndvi": n.ndvi}
            for n in ndvi
        ],
        "alerts": [
            {
                "id": a.id,
                "severity": a.severity,
                "category": a.category,
                "title": a.title,
                "description": a.description,
                "recommendation": a.recommendation,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in alerts
        ],
        "recommendations": [
            {
                "id": r.id,
                "text": r.recommendation_text,
                "reason": r.reason,
                "confidence": r.confidence,
                "risk_level": r.risk_level,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in recs
        ],
    }


# ── Helpers ───────────────────────────────────────────────────────────────────
def _safe_index(lst: list | None, idx: int):
    if lst and idx < len(lst):
        return lst[idx]
    return None


# ── Warabandi (Canal Water Turn) & Energy Cost Optimizer ──────────────────────
@router.get("/warabandi/{farm_id}", response_model=WarabandiAdviceResponse)
async def get_warabandi_advice(farm_id: int, db: Session = Depends(get_db)):
    """Evaluate Warabandi canal turn schedule and groundwater energy cost optimization."""
    farm = _get_farm_or_404(db, farm_id)

    # Active crop
    latest_crop = (
        db.query(Crop)
        .filter(Crop.farm_id == farm.id)
        .order_by(Crop.id.desc())
        .first()
    )
    crop_name = latest_crop.crop_name if latest_crop else "Wheat"
    growth_stage = latest_crop.growth_stage if latest_crop else "Grain Filling"

    rain_48h = 0.0
    et0_val = 4.0
    soil_moisture = 0.22

    try:
        weather_data = await weather_service.get_forecast_open_meteo(farm.latitude, farm.longitude, forecast_days=3)
        daily = weather_data.get("daily", {})
        rain_list = daily.get("precipitation_sum", [])
        rain_48h = sum(rain_list[:2]) if len(rain_list) >= 2 else (rain_list[0] if rain_list else 0.0)

        et0_list = daily.get("et0_fao_evapotranspiration", [])
        if et0_list:
            et0_val = et0_list[0]

        curr = weather_data.get("current", {})
        if curr.get("soil_moisture_0_to_7cm") is not None:
            soil_moisture = curr.get("soil_moisture_0_to_7cm")
    except Exception:
        # Fallback to local observation records
        latest_soil = (
            db.query(SoilObservation)
            .filter(SoilObservation.farm_id == farm.id)
            .order_by(SoilObservation.id.desc())
            .first()
        )
        if latest_soil and latest_soil.soil_moisture_m3m3 is not None:
            soil_moisture = latest_soil.soil_moisture_m3m3

    advice = warabandi_engine.evaluate_warabandi_irrigation(
        farm_id=farm.id,
        farm_name=farm.name,
        area_acres=farm.area_acres or 10.0,
        crop_name=crop_name,
        growth_stage=growth_stage,
        canal_name=farm.canal_name or "Lower Bari Doab Canal",
        canal_turn_day=farm.canal_turn_day or "Thursday",
        canal_turn_time=farm.canal_turn_time or "02:00",
        canal_turn_duration_hours=farm.canal_turn_duration_hours or 4.0,
        tubewell_power_source=farm.tubewell_power_source or "diesel",
        tubewell_hourly_cost_pkr=farm.tubewell_hourly_cost_pkr or 1400.0,
        current_soil_moisture=soil_moisture,
        et0_mm=et0_val,
        forecast_rain_48h_mm=rain_48h,
    )
    return advice


@router.put("/warabandi/{farm_id}/config", response_model=WarabandiAdviceResponse)
async def update_warabandi_config(
    farm_id: int, payload: WarabandiConfigUpdate, db: Session = Depends(get_db)
):
    """Update farm Warabandi schedule and tubewell fuel preferences."""
    farm = _get_farm_or_404(db, farm_id)

    if payload.canal_name is not None:
        farm.canal_name = payload.canal_name
    if payload.canal_turn_day is not None:
        farm.canal_turn_day = payload.canal_turn_day
    if payload.canal_turn_time is not None:
        farm.canal_turn_time = payload.canal_turn_time
    if payload.canal_turn_duration_hours is not None:
        farm.canal_turn_duration_hours = payload.canal_turn_duration_hours
    if payload.tubewell_power_source is not None:
        farm.tubewell_power_source = payload.tubewell_power_source
    if payload.tubewell_hourly_cost_pkr is not None:
        farm.tubewell_hourly_cost_pkr = payload.tubewell_hourly_cost_pkr

    db.add(farm)
    db.commit()
    db.refresh(farm)

    return await get_warabandi_advice(farm_id, db)

