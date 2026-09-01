"""Satellite data router — MODIS NDVI time series + Sentinel Hub proxy."""

import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Farm, SatelliteObservation
from app.schemas import SatelliteObservationResponse
from app.services.ndvi_cache import get_ndvi_series_cached
from app.services.satellite_service import satellite_service

router = APIRouter(prefix="/satellite", tags=["satellite"])

MODIS_SOURCE = "MODIS Terra (MOD13Q1, 250m)"


@router.get("/ndvi-series/{farm_id}")
async def get_ndvi_series(
    farm_id: int,
    months: int = Query(default=12, ge=1, le=24, description="Months of history"),
    db: Session = Depends(get_db),
):
    """Fetch a real NDVI time series from NASA MODIS (free, no auth) via the cache."""
    farm = db.query(Farm).get(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm.latitude is None or farm.longitude is None:
        raise HTTPException(status_code=400, detail="Farm has no coordinates set")

    series = await get_ndvi_series_cached(
        farm.id, farm.latitude, farm.longitude, months=months, db=db
    )

    ndvi = series[-1]["ndvi"] if series else None
    ndvi_change = (
        round(series[-1]["ndvi"] - series[-2]["ndvi"], 4) if len(series) >= 2 else None
    )

    return {
        "farm_id": farm_id,
        "source": MODIS_SOURCE,
        "ndvi": ndvi,
        "ndvi_change": ndvi_change,
        "series": series,
    }


@router.get("/ndvi/{farm_id}")
async def get_ndvi(
    farm_id: int,
    days_back: int = Query(default=30, description="Number of days to look back"),
    db: Session = Depends(get_db),
):
    """Fetch NDVI statistics for a farm polygon from Sentinel Hub."""
    farm = db.query(Farm).get(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if not farm.geometry_geojson:
        raise HTTPException(status_code=400, detail="Farm has no polygon geometry set")

    geometry = json.loads(farm.geometry_geojson)
    date_to = datetime.datetime.utcnow().strftime("%Y-%m-%dT00:00:00Z")
    date_from = (datetime.datetime.utcnow() - datetime.timedelta(days=days_back)).strftime(
        "%Y-%m-%dT00:00:00Z"
    )

    data = await satellite_service.get_ndvi_stats(geometry, date_from, date_to)
    return {"farm_id": farm_id, "source": "sentinel-2", "data": data}


@router.get("/observations/{farm_id}", response_model=list[SatelliteObservationResponse])
def get_stored_observations(farm_id: int, db: Session = Depends(get_db)):
    """Get previously stored satellite observations for a farm."""
    return (
        db.query(SatelliteObservation)
        .filter(SatelliteObservation.farm_id == farm_id)
        .order_by(SatelliteObservation.date.desc())
        .limit(50)
        .all()
    )
