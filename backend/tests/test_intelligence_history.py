"""Tests for Farm Digital Twin Intelligence and Historical Telemetry endpoints."""

import datetime
import pytest
from unittest.mock import patch
from app.models import Farm, WeatherRecord, Crop


@pytest.fixture
def seeded_farm(db_session):
    """Seed a sample Punjab farm with crops and weather."""
    farm = Farm(
        id=101,
        user_id=1,
        name="Faisalabad Wheat Twin",
        district="Faisalabad",
        province="Punjab",
        latitude=31.4504,
        longitude=73.1350,
        area_acres=25.0,
    )
    crop = Crop(
        farm_id=101,
        crop_name="Wheat",
        variety="Faisalabad-2008",
        season="Rabi",
        growth_stage="Grain Filling",
        sowing_date=datetime.date(2025, 11, 20),
    )
    db_session.add(farm)
    db_session.add(crop)
    db_session.commit()
    return farm


def test_forecast_chart_endpoint(client, seeded_farm):
    """Test 7-day forecast chart data endpoint."""
    with patch("app.services.weather_service.weather_service.get_forecast_open_meteo") as mock_forecast:
        mock_forecast.return_value = {
            "daily": {
                "time": ["2026-03-01", "2026-03-02", "2026-03-03"],
                "temperature_2m_max": [26.0, 27.5, 28.0],
                "temperature_2m_min": [12.0, 13.0, 14.5],
                "precipitation_sum": [0.0, 2.5, 0.0],
                "et0_fao_evapotranspiration": [3.5, 4.0, 4.2],
            }
        }
        res = client.get(f"/api/v1/analytics/forecast-chart/{seeded_farm.id}?days=3")
        assert res.status_code == 200
        data = res.json()
        assert data["farm_id"] == seeded_farm.id
        assert len(data["forecast"]) == 3
        assert data["forecast"][0]["temp_max"] == 26.0


def test_farm_history_ledger_endpoint(client, seeded_farm, db_session):
    """Test retrieving chronological farm telemetry ledger."""
    weather = WeatherRecord(
        farm_id=seeded_farm.id,
        timestamp=datetime.datetime.now(),
        temperature_c=24.5,
        humidity_pct=52.0,
        rainfall_mm=0.0,
        wind_speed_kmh=10.0,
        source="Open-Meteo",
    )
    db_session.add(weather)
    db_session.commit()

    res = client.get(f"/api/v1/analytics/history/{seeded_farm.id}")
    assert res.status_code == 200
    ledger = res.json()
    assert ledger["farm"]["name"] == seeded_farm.name
    assert len(ledger["weather"]) >= 1
    assert ledger["weather"][0]["temperature_c"] == 24.5


def test_farm_intelligence_unified_endpoint(client, seeded_farm):
    """Test unified GET /api/v1/farms/{id}/intelligence endpoint."""
    with patch("app.services.weather_service.weather_service.get_current_weather_open_meteo") as mock_curr, \
         patch("app.services.weather_service.weather_service.get_forecast_open_meteo") as mock_fore, \
         patch("app.services.weather_service.weather_service.get_climate_anomaly") as mock_clim, \
         patch("app.services.weather_service.weather_service.get_air_quality") as mock_aq:

        mock_curr.return_value = {
            "current": {
                "temperature_2m": 25.0,
                "relative_humidity_2m": 50.0,
                "precipitation": 0.0,
                "wind_speed_10m": 12.0,
                "soil_moisture_0_to_7cm": 0.22,
                "soil_temperature_0_to_7cm": 21.0,
            }
        }
        mock_fore.return_value = {
            "daily": {
                "time": ["2026-03-01", "2026-03-02"],
                "temperature_2m_max": [27.0, 28.0],
                "temperature_2m_min": [13.0, 14.0],
                "precipitation_sum": [0.0, 0.0],
                "et0_fao_evapotranspiration": [4.0, 4.2],
            }
        }
        mock_clim.return_value = {
            "temperature_anomaly_c": 1.2,
            "humidity_anomaly_pct": -3.0,
            "interpretation": "Slightly warmer than normal",
        }
        mock_aq.return_value = {
            "us_aqi": 110,
            "pm2_5": 38.0,
            "pm10": 75.0,
            "category": "Moderate",
        }

        res = client.get(f"/api/v1/farms/{seeded_farm.id}/intelligence")
        assert res.status_code == 200
        data = res.json()
        assert data["farm"]["id"] == seeded_farm.id
        assert data["score"]["value"] > 0
        assert data["crop"]["name"] == "Wheat"
        assert "weather" in data
        assert "recommendation" in data
