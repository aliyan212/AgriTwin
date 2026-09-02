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
