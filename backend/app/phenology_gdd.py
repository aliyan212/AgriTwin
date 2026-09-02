"""Growing Degree Days (GDD) & Thermal Phenology Calibration Engine.

Replaces static calendar days with accumulated heat units (GDD), calibrated
for Pakistani agro-climatic zones and crop cultivars (PARC / Punjab Agri Dept).
Accurately predicts phenological development, shifts FAO-56 Kc curves,
and alerts on terminal heat stress during grain/boll development.
"""

from __future__ import annotations

import datetime
from dataclasses import dataclass
from typing import Any

# Crop-specific cardinal temperatures (°C)
CROP_CARDINAL_TEMPS: dict[str, dict[str, float]] = {
    "wheat": {"t_base": 4.5, "t_upper": 32.0, "total_gdd": 1750.0},
    "rice (basmati)": {"t_base": 10.0, "t_upper": 35.0, "total_gdd": 1650.0},
    "rice": {"t_base": 10.0, "t_upper": 35.0, "total_gdd": 1600.0},
    "cotton": {"t_base": 15.5, "t_upper": 38.0, "total_gdd": 2400.0},
    "sugarcane": {"t_base": 12.0, "t_upper": 38.0, "total_gdd": 3200.0},
    "maize": {"t_base": 10.0, "t_upper": 34.0, "total_gdd": 1500.0},
}

# Thermal accumulation windows by phenological stage
CROP_THERMAL_STAGES: dict[str, list[dict[str, Any]]] = {
    "wheat": [
        {"stage": "Germination", "stage_ur": "اگاؤ", "gdd_start": 0, "gdd_end": 120, "kc": 0.45},
        {"stage": "Tillering", "stage_ur": "شاخیں نکلنا", "gdd_start": 120, "gdd_end": 450, "kc": 0.75},
        {"stage": "Jointing", "stage_ur": "گندم کا گانٹھیں بننا", "gdd_start": 450, "gdd_end": 750, "kc": 0.95},
        {"stage": "Booting", "stage_ur": "سٹا بننا (گوبھ)", "gdd_start": 750, "gdd_end": 1050, "kc": 1.15},
        {"stage": "Flowering", "stage_ur": "بور / پھول", "gdd_start": 1050, "gdd_end": 1300, "kc": 1.20},
        {"stage": "Grain Filling", "stage_ur": "دانہ بھرائی (دودھیا حالت)", "gdd_start": 1300, "gdd_end": 1650, "kc": 1.10},
        {"stage": "Maturity", "stage_ur": "پکائی و کٹائی", "gdd_start": 1650, "gdd_end": 2200, "kc": 0.40},
    ],
    "rice (basmati)": [
        {"stage": "Nursery", "stage_ur": "پنیری", "gdd_start": 0, "gdd_end": 280, "kc": 1.10},
        {"stage": "Transplanting", "stage_ur": "پود کاری / لائی", "gdd_start": 280, "gdd_end": 420, "kc": 1.15},
        {"stage": "Tillering", "stage_ur": "شاخیں نکلنا", "gdd_start": 420, "gdd_end": 750, "kc": 1.10},
        {"stage": "Panicle Initiation", "stage_ur": "سٹے کی ابتدا", "gdd_start": 750, "gdd_end": 1050, "kc": 1.20},
        {"stage": "Flowering", "stage_ur": "پھول / بور", "gdd_start": 1050, "gdd_end": 1280, "kc": 1.25},
        {"stage": "Grain Filling", "stage_ur": "دانہ بھرائی", "gdd_start": 1280, "gdd_end": 1550, "kc": 1.05},
        {"stage": "Maturity", "stage_ur": "پکائی", "gdd_start": 1550, "gdd_end": 1900, "kc": 0.50},
    ],
    "cotton": [
        {"stage": "Germination", "stage_ur": "اگاؤ", "gdd_start": 0, "gdd_end": 100, "kc": 0.45},
        {"stage": "Seedling", "stage_ur": "پود نکلنا", "gdd_start": 100, "gdd_end": 350, "kc": 0.50},
        {"stage": "Squaring", "stage_ur": "ڈوڈی بننا", "gdd_start": 350, "gdd_end": 850, "kc": 0.85},
        {"stage": "Flowering", "stage_ur": "پھول آنا", "gdd_start": 850, "gdd_end": 1400, "kc": 1.20},
        {"stage": "Boll Formation", "stage_ur": "ٹیڈے بننا", "gdd_start": 1400, "gdd_end": 1950, "kc": 1.25},
        {"stage": "Boll Opening", "stage_ur": "ٹیڈے کھلنا", "gdd_start": 1950, "gdd_end": 2600, "kc": 0.65},
    ],
}


def compute_daily_gdd(
    t_max: float,
    t_min: float,
    t_base: float = 4.5,
    t_upper: float = 32.0,
) -> float:
    """Compute single-day Growing Degree Days with upper and lower thresholds."""
    # Cap t_max at t_upper to prevent unrealistic biological accumulation
    eff_max = min(t_max, t_upper)
    eff_min = max(t_min, t_base)
    mean_temp = (eff_max + eff_min) / 2.0
    return max(0.0, round(mean_temp - t_base, 2))


@dataclass
class ThermalPhenologyReport:
    crop_name: str
    stage_name: str
    stage_name_ur: str
    accumulated_gdd: float
    stage_target_gdd: float
    stage_progress_pct: float
    total_crop_gdd: float
    crop_progress_pct: float
    current_kc: float
    heat_stress_alert: bool
    heat_stress_message_en: str
    heat_stress_message_ur: str


def evaluate_thermal_phenology(
    crop_name: str,
    sowing_date: datetime.date | datetime.datetime | None = None,
    current_tmax: float = 28.0,
    current_tmin: float = 16.0,
    historical_daily_temps: list[tuple[float, float]] | None = None,
    reference_dt: datetime.date | None = None,
) -> ThermalPhenologyReport:
    """Determine crop phenological stage and thermal progress from GDD."""
    clean_name = (crop_name or "Wheat").strip().lower()
    # Normalize crop key
    matched_key = "wheat"
    for k in CROP_CARDINAL_TEMPS:
        if k in clean_name:
            matched_key = k
            break

    cardinal = CROP_CARDINAL_TEMPS.get(matched_key, CROP_CARDINAL_TEMPS["wheat"])
    t_base = cardinal["t_base"]
    t_upper = cardinal["t_upper"]
    total_gdd = cardinal["total_gdd"]

    # Calculate accumulated GDD
    accumulated_gdd = 0.0
    today = reference_dt or datetime.date.today()

    if isinstance(sowing_date, datetime.datetime):
        sowing_d = sowing_date.date()
    elif isinstance(sowing_date, datetime.date):
        sowing_d = sowing_date
    else:
        # Default fallback: sown 60 days ago
        sowing_d = today - datetime.timedelta(days=60)

    days_since_sowing = max(1, (today - sowing_d).days)

    if historical_daily_temps and len(historical_daily_temps) > 0:
        for t_high, t_low in historical_daily_temps:
            accumulated_gdd += compute_daily_gdd(t_high, t_low, t_base, t_upper)
    else:
        # Typical Punjab daily GDD rate by season
        # Rabi (Wheat): winter ~8 GDD/day, spring ~14 GDD/day (avg ~11)
        # Kharif (Rice, Cotton): summer ~18 GDD/day
        avg_rate = 11.5 if matched_key == "wheat" else 17.5
        accumulated_gdd = round(days_since_sowing * avg_rate, 1)

    # Determine stage from CROP_THERMAL_STAGES
    stages = CROP_THERMAL_STAGES.get(matched_key, CROP_THERMAL_STAGES["wheat"])
    current_stage = stages[0]

    for st in stages:
        if accumulated_gdd >= st["gdd_start"]:
            current_stage = st
        else:
            break

    stage_span = max(1.0, current_stage["gdd_end"] - current_stage["gdd_start"])
    stage_progress = min(100.0, max(0.0, ((accumulated_gdd - current_stage["gdd_start"]) / stage_span) * 100.0))
    crop_progress = min(100.0, max(0.0, (accumulated_gdd / total_gdd) * 100.0))

    # Heat stress evaluation
    heat_stress = False
    msg_en = "Normal thermal conditions."
    msg_ur = "موسمی درجہ حرارت معمول دے مطابق ہے۔"

    # Terminal Heat Stress for Wheat during Grain Filling
    if matched_key == "wheat" and current_stage["stage"] in ["Grain Filling", "Flowering"]:
        if current_tmax >= 32.0:
            heat_stress = True
            msg_en = f"Terminal Heat Stress Warning: Max temp {current_tmax}°C exceeds 32°C threshold during Grain Filling. Early forced maturity risk."
            msg_ur = f"گرمی دا شدید خطرہ: دانہ بھرائی دوران درجہ حرارت {current_tmax}°C ہو گیا۔ دانہ سکڑن توں بچاؤ لئی ہلکا پانی لاؤ۔"

    # Extreme Heat for Cotton during Flowering
    if matched_key == "cotton" and current_stage["stage"] in ["Flowering", "Boll Formation"]:
        if current_tmax >= 40.0:
            heat_stress = True
            msg_en = f"High Temperature Alert: Max temp {current_tmax}°C can induce square and flower shedding in cotton."
            msg_ur = f"شدید لو تے گرمی دا الرٹ: {current_tmax}°C درجہ حرارت نال کپاس دا پھل تے ڈوڈیاں ڈگن دا خطرہ ہے۔"

    return ThermalPhenologyReport(
        crop_name=crop_name,
        stage_name=current_stage["stage"],
        stage_name_ur=current_stage["stage_ur"],
        accumulated_gdd=round(accumulated_gdd, 1),
        stage_target_gdd=float(current_stage["gdd_end"]),
        stage_progress_pct=round(stage_progress, 1),
        total_crop_gdd=total_gdd,
        crop_progress_pct=round(crop_progress, 1),
        current_kc=current_stage["kc"],
        heat_stress_alert=heat_stress,
        heat_stress_message_en=msg_en,
        heat_stress_message_ur=msg_ur,
    )
