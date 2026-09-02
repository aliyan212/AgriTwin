"""Tests for Warabandi Canal Water Turn & Tubewell Cost Optimization."""

import datetime
import pytest
from unittest.mock import patch
import warabandi_engine
from app.models import Farm, Crop


def test_warabandi_turn_countdown():
    """Test calculation of next upcoming canal turn."""
    # Fixed reference date: Wednesday 10:00 AM
    ref_dt = datetime.datetime(2026, 3, 4, 10, 0, 0)

    # Next Thursday 02:00 AM is 16 hours ahead
    next_dt, hours_until, days_until = warabandi_engine.compute_next_turn(
        "Thursday", "02:00", reference_dt=ref_dt
    )
    assert next_dt.weekday() == 3  # Thursday
    assert hours_until == 16.0
    assert days_until == 0


def test_warabandi_rain_hold_and_diesel_savings():
    """Test that incoming rain triggers tubewell hold and estimates PKR fuel savings."""
    ref_dt = datetime.datetime(2026, 3, 4, 10, 0, 0)
    result = warabandi_engine.evaluate_warabandi_irrigation(
        farm_id=1,
        farm_name="Sahiwal Basmati Twin",
        area_acres=12.0,
        crop_name="Rice (Basmati)",
        growth_stage="Tillering",
        canal_name="Lower Bari Doab Canal",
        canal_turn_day="Sunday",
        canal_turn_time="04:00",
        canal_turn_duration_hours=4.0,
        tubewell_power_source="diesel",
        tubewell_hourly_cost_pkr=1500.0,
        current_soil_moisture=0.24,
        forecast_rain_48h_mm=14.5,  # 14.5 mm rain expected
        reference_dt=ref_dt,
    )

    # Tubewell hold should be recommended
    assert result["hold_tubewell_recommended"] is True
    assert result["potential_savings_pkr"] > 2000.0
    assert "بارش" in result["action_ur"] or "ٹوب ویل" in result["action_ur"]
    assert "ڈیزل" in result["reasoning_ur"] or "روپے" in result["reasoning_ur"]


def test_warabandi_endpoint_flow(client, db_session):
    """Test Warabandi advice retrieval and schedule update endpoints."""
    farm = Farm(
        id=202,
        user_id=1,
        name="Khanewal Cotton Twin",
        district="Khanewal",
        province="Punjab",
        latitude=30.3000,
        longitude=71.9333,
        area_acres=20.0,
        canal_name="Haveli Canal",
        canal_turn_day="Friday",
        canal_turn_time="03:00",
        canal_turn_duration_hours=5.0,
        tubewell_power_source="diesel",
        tubewell_hourly_cost_pkr=1600.0,
    )
    crop = Crop(
        farm_id=202,
        crop_name="Cotton",
        season="Kharif",
        growth_stage="Boll Formation",
        sowing_date=datetime.date(2025, 5, 10),
    )
    db_session.add(farm)
    db_session.add(crop)
    db_session.commit()

    with patch("app.services.weather_service.weather_service.get_forecast_open_meteo") as mock_forecast:
        mock_forecast.return_value = {
            "daily": {
                "precipitation_sum": [12.0, 0.0, 0.0],
                "et0_fao_evapotranspiration": [4.5, 4.8, 5.0],
            },
            "current": {
                "soil_moisture_0_to_7cm": 0.20,
            },
        }

        # 1. Fetch Warabandi advice
        res = client.get(f"/api/v1/analytics/warabandi/{farm.id}")
        assert res.status_code == 200
        data = res.json()
        assert data["farm_id"] == farm.id
        assert data["canal_name"] == "Haveli Canal"
        assert data["hold_tubewell_recommended"] is True
        assert data["potential_savings_pkr"] > 0

        # 2. Update Warabandi schedule
        update_payload = {
            "canal_turn_day": "Tuesday",
            "canal_turn_time": "06:00",
            "tubewell_power_source": "solar",
            "tubewell_hourly_cost_pkr": 0.0,
        }
        put_res = client.put(f"/api/v1/analytics/warabandi/{farm.id}/config", json=update_payload)
        assert put_res.status_code == 200
        updated = put_res.json()
        assert updated["canal_turn_day"] == "Tuesday"
        assert updated["tubewell_power_source"] == "solar"

