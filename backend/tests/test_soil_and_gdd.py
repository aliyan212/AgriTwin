"""Tests for ISRIC SoilGrids 2.0 Soil Physics and GDD Thermal Phenology."""

import datetime
import pytest
import soil_engine
import phenology_gdd
from app.models import Farm, Crop


def test_saxton_rawls_hydraulics_computation():
    """Verify Saxton-Rawls equations for typical Punjab silt loam."""
    # Faisalabad typical alluvium: 36% sand, 46% silt, 18% clay, 1.2% OM
    props = soil_engine.compute_saxton_rawls_hydraulics(sand_pct=36.0, clay_pct=18.0, organic_matter_pct=1.2)
    
    # Field capacity should be around 0.26 - 0.32
    assert 0.25 <= props["field_capacity"] <= 0.35
    # Wilting point should be around 0.10 - 0.15
    assert 0.08 <= props["wilting_point"] <= 0.16
    # AWC should be positive and reasonable for silt loam
    assert props["awc_mm_m"] > 100.0
    assert props["saturation"] > props["field_capacity"]


def test_usda_and_punjabi_texture_classification():
    """Verify USDA textural triangle and localized Punjabi farmer names."""
    usda, punjabi = soil_engine.classify_usda_texture(sand=36.0, silt=46.0, clay=18.0)
    assert usda == "Loam"
    assert "میرا" in punjabi

    usda_clay, punjabi_clay = soil_engine.classify_usda_texture(sand=20.0, silt=30.0, clay=50.0)
    assert usda_clay == "Clay"
    assert "چکنی" in punjabi_clay

    usda_sand, punjabi_sand = soil_engine.classify_usda_texture(sand=88.0, silt=8.0, clay=4.0)
    assert usda_sand == "Sand"
    assert "ریت" in punjabi_sand


@pytest.mark.asyncio
async def test_soil_engine_fallback_and_evaluation():
    """Test full evaluate_soil_physics with Punjab coordinates."""
    # Sahiwal coords: 30.66, 73.10
    props = await soil_engine.evaluate_soil_physics(30.66, 73.10)
    assert props.field_capacity_m3m3 > props.wilting_point_m3m3
    assert props.available_water_capacity_mm_m > 0
    assert props.usda_texture != ""
    assert props.punjabi_texture != ""


def test_gdd_daily_accumulation():
    """Verify single-day GDD calculation for Wheat (base 4.5°C)."""
    # Max 26°C, Min 12°C: mean = 19°C. GDD = 19 - 4.5 = 14.5
    gdd = phenology_gdd.compute_daily_gdd(t_max=26.0, t_min=12.0, t_base=4.5, t_upper=32.0)
    assert gdd == 14.5

    # Cool day below base: Max 4°C, Min 0°C -> 0 GDD
    cold_gdd = phenology_gdd.compute_daily_gdd(t_max=4.0, t_min=0.0, t_base=4.5)
    assert cold_gdd == 0.0


def test_phenology_thermal_stage_tracking():
    """Verify biological stage determination and heat stress alert."""
    today = datetime.date(2026, 3, 10)
    # Sown 90 days ago (around mid-December)
    sowing_date = today - datetime.timedelta(days=90)
    
    report = phenology_gdd.evaluate_thermal_phenology(
        crop_name="Wheat",
        sowing_date=sowing_date,
        current_tmax=34.0,  # 34°C triggers terminal heat stress during reproductive stages
        current_tmin=18.0,
        reference_dt=today,
    )

    assert report.crop_name == "Wheat"
    assert report.accumulated_gdd > 800.0
    assert report.current_kc >= 0.90
    assert report.stage_progress_pct >= 0.0


def test_analytics_soil_and_gdd_endpoints(client, db_session):
    """Test /analytics/soil-physics/{id} and /analytics/phenology-gdd/{id} endpoints."""
    farm = Farm(
        id=301,
        user_id=1,
        name="Okara Soil Twin",
        district="Okara",
        province="Punjab",
        latitude=30.81,
        longitude=73.45,
        area_acres=15.0,
    )
    db_session.add(farm)
    db_session.commit()

    crop = Crop(
        farm_id=farm.id,
        crop_name="Wheat",
        variety="Faisalabad-2008",
        sowing_date=datetime.datetime.now() - datetime.timedelta(days=70),
    )
    db_session.add(crop)
    db_session.commit()

    # 1. Soil Physics endpoint
    res_soil = client.get(f"/api/v1/analytics/soil-physics/{farm.id}")
    assert res_soil.status_code == 200
    soil_data = res_soil.json()
    assert soil_data["farm_id"] == farm.id
    assert soil_data["field_capacity_m3m3"] > soil_data["wilting_point_m3m3"]
    assert "punjabi_texture" in soil_data

    # 2. Phenology GDD endpoint
    res_gdd = client.get(f"/api/v1/analytics/phenology-gdd/{farm.id}")
    assert res_gdd.status_code == 200
    gdd_data = res_gdd.json()
    assert gdd_data["farm_id"] == farm.id
    assert gdd_data["crop_name"] == "Wheat"
    assert gdd_data["accumulated_gdd"] > 0
    assert "stage_name_ur" in gdd_data
