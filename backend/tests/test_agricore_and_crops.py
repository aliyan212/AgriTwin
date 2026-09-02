"""Tests for AgriCore agronomy scoring, phenology derivation, and Punjabi recommendations."""

import datetime
import pytest
import agricore
import crop_knowledge
from agricore import FarmContext, FarmHealthScore


def test_phenology_auto_derivation():
    """Test days-after-sowing phenology stage derivation across Punjab crops."""
    today = datetime.date(2026, 3, 1)

    # Wheat Stages test
    wheat_germ = crop_knowledge.derive_growth_stage("Wheat", today - datetime.timedelta(days=5), reference_date=today)
    assert wheat_germ["stage"] == "Germination"

    wheat_tiller = crop_knowledge.derive_growth_stage("Wheat", today - datetime.timedelta(days=30), reference_date=today)
    assert wheat_tiller["stage"] == "Tillering"

    wheat_joint = crop_knowledge.derive_growth_stage("Wheat", today - datetime.timedelta(days=60), reference_date=today)
    assert wheat_joint["stage"] == "Jointing"

    wheat_boot = crop_knowledge.derive_growth_stage("Wheat", today - datetime.timedelta(days=80), reference_date=today)
    assert wheat_boot["stage"] == "Booting"

    wheat_flower = crop_knowledge.derive_growth_stage("Wheat", today - datetime.timedelta(days=100), reference_date=today)
    assert wheat_flower["stage"] == "Flowering"

    wheat_grain = crop_knowledge.derive_growth_stage("Wheat", today - datetime.timedelta(days=125), reference_date=today)
    assert wheat_grain["stage"] == "Grain Filling"

    wheat_mature = crop_knowledge.derive_growth_stage("Wheat", today - datetime.timedelta(days=150), reference_date=today)
    assert wheat_mature["stage"] == "Maturity"

    # Cotton Stages test
    cotton_seedling = crop_knowledge.derive_growth_stage("Cotton", today - datetime.timedelta(days=15), reference_date=today)
    assert cotton_seedling["stage"] == "Seedling"

    cotton_square = crop_knowledge.derive_growth_stage("Cotton", today - datetime.timedelta(days=45), reference_date=today)
    assert cotton_square["stage"] == "Squaring"

    # Rice Stages test
    rice_nursery = crop_knowledge.derive_growth_stage("Rice (Basmati)", today - datetime.timedelta(days=10), reference_date=today)
    assert rice_nursery["stage"] == "Nursery"


def test_agricore_health_score_computation():
    """Test 5-dimensional health scoring under favorable and stressed conditions."""
    # 1. Favorable telemetry context
    good_ctx = FarmContext(
        farm_id=1,
        crop_name="Wheat",
        growth_stage="Tillering",
        temperature_c=20.0,
        humidity_pct=60.0,
        rainfall_mm=0.0,
        wind_speed_kmh=12.0,
        soil_moisture_m3m3=0.30,
        soil_temperature_c=18.0,
        ndvi=0.65,
    )
    score = agricore.compute_health_score(good_ctx)
    assert 0 <= score.overall <= 100
    assert score.overall >= 60  # healthy conditions
    assert score.water >= 70
    assert score.weather >= 70

    # 2. Severe drought / heat stress context
    stressed_ctx = FarmContext(
        farm_id=1,
        crop_name="Wheat",
        growth_stage="Grain Filling",
        temperature_c=44.0,       # extreme heat (>42 C)
        humidity_pct=15.0,        # dry air
        rainfall_mm=0.0,
        wind_speed_kmh=52.0,      # high wind (>45 km/h)
        soil_moisture_m3m3=0.06,  # drought (<0.15)
        ndvi=0.25,                # stressed canopy
    )
    stressed_score = agricore.compute_health_score(stressed_ctx)
    assert stressed_score.overall < score.overall
    assert stressed_score.water < 50
    assert stressed_score.weather < 50


@pytest.mark.asyncio
async def test_bilingual_punjabi_recommendation():
    """Test that generated recommendations include both English and Punjabi outputs."""
    ctx = FarmContext(
        farm_id=1,
        crop_name="Wheat",
        growth_stage="Booting",
        temperature_c=36.0,
        humidity_pct=25.0,
        soil_moisture_m3m3=0.12,
        wind_speed_kmh=18.0,
    )
    score = agricore.compute_health_score(ctx)
    rec = await agricore.generate_recommendation(ctx, score)

    # Validate English recommendation
    assert rec.text != ""
    assert rec.reasoning != ""

    # Validate Punjabi / Shahmukhi localized recommendation
    assert rec.text_ur is not None
    assert len(rec.text_ur) > 10
    assert rec.reasoning_ur is not None
    assert len(rec.reasoning_ur) > 5

    # Check risk level and confidence bounds
    assert rec.risk_level in ["low", "moderate", "high", "critical"]
    assert 0.0 <= rec.confidence <= 1.0
