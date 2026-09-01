"""Weather data router — proxy to Open-Meteo and NASA POWER."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import SessionLocal, get_db
from app.models import Farm, WeatherRecord
from app.schemas import WeatherRecordResponse
from app.services.weather_service import weather_service

router = APIRouter(prefix="/weather", tags=["weather"])


def _get_farm_or_404(db, farm_id: int) -> Farm:
    farm = db.query(Farm).get(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm.latitude is None or farm.longitude is None:
        raise HTTPException(status_code=400, detail="Farm has no coordinates set")
    return farm


@router.get("/forecast/{farm_id}")
async def get_weather_forecast(farm_id: int, days: int = 7, db: Session = Depends(get_db)):
    """Fetch live weather forecast for a farm from Open-Meteo."""
    farm = _get_farm_or_404(db, farm_id)
    data = await weather_service.get_forecast_open_meteo(farm.latitude, farm.longitude, forecast_days=days)
    return {"farm_id": farm_id, "source": "open-meteo", "data": data}


@router.get("/current/{farm_id}")
async def get_current_weather(farm_id: int, db: Session = Depends(get_db)):
    """Fetch current weather conditions for a farm."""
    farm = _get_farm_or_404(db, farm_id)
    data = await weather_service.get_current_weather_open_meteo(farm.latitude, farm.longitude)
    return {"farm_id": farm_id, "source": "open-meteo", "data": data}


@router.get("/historical/{farm_id}")
async def get_historical_weather(
    farm_id: int,
    start: str = Query(..., description="Start date YYYYMMDD"),
    end: str = Query(..., description="End date YYYYMMDD"),
    db: Session = Depends(get_db),
):
    """Fetch historical climate data from NASA POWER."""
    farm = _get_farm_or_404(db, farm_id)
    data = await weather_service.get_historical_nasa_power(
        farm.latitude, farm.longitude, start, end
    )
    return {"farm_id": farm_id, "source": "nasa-power", "data": data}


@router.get("/records/{farm_id}", response_model=list[WeatherRecordResponse])
def get_stored_weather(farm_id: int, db: Session = Depends(get_db)):
    """Get previously stored weather records for a farm."""
    return (
        db.query(WeatherRecord)
        .filter(WeatherRecord.farm_id == farm_id)
        .order_by(WeatherRecord.timestamp.desc())
        .limit(100)
        .all()
    )
