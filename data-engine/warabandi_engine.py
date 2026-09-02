"""Warabandi (Canal Water Turn) & Groundwater Tubewell Energy Cost Optimizer.

Computes exact timing for the weekly Indus Basin rotational canal water rights,
evaluates crop water deficits using FAO-56 Kc, and optimizes diesel/grid tubewell
pumping against upcoming rainfall forecasts.
"""

from __future__ import annotations

import datetime
from dataclasses import dataclass
from typing import Any


DAY_NAME_TO_INT = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
}

PUNJABI_DAYS = {
    0: "پیر",
    1: "منگل",
    2: "بدھ",
    3: "جمعرات",
    4: "جمعہ",
    5: "ہفتہ",
    6: "اتوار",
}

DEFAULT_KC_BY_STAGE: dict[str, float] = {
    "germination": 0.45,
    "nursery": 1.10,
    "seedling": 0.50,
    "tillering": 0.75,
    "transplanting": 1.15,
    "jointing": 0.95,
    "booting": 1.15,
    "squaring": 0.85,
    "flowering": 1.20,
    "boll formation": 1.25,
    "boll opening": 0.65,
    "grain filling": 1.10,
    "milk stage": 1.05,
    "dough stage": 0.80,
    "maturity": 0.40,
    "grand growth": 1.15,
    "tasseling": 1.20,
    "silking": 1.20,
}


def get_crop_kc(stage_name: str | None) -> float:
    """Return FAO-56 crop coefficient Kc based on phenological stage."""
    if not stage_name:
        return 0.85
    key = stage_name.lower().strip()
    for stage_key, kc in DEFAULT_KC_BY_STAGE.items():
        if stage_key in key or key in stage_key:
            return kc
    return 0.85


def compute_next_turn(
    turn_day_name: str | None,
    turn_time_str: str | None,
    reference_dt: datetime.datetime | None = None,
) -> tuple[datetime.datetime, float, int]:
    """Calculate the next upcoming canal turn datetime and hours remaining."""
    now = reference_dt or datetime.datetime.now()
    target_day_str = (turn_day_name or "Thursday").lower().strip()
    target_weekday = DAY_NAME_TO_INT.get(target_day_str, 3)

    hour, minute = 2, 0
    if turn_time_str:
        try:
            parts = turn_time_str.split(":")
            hour = int(parts[0])
            minute = int(parts[1]) if len(parts) > 1 else 0
        except Exception:
            hour, minute = 2, 0

    # Calculate days forward to the target weekday
    days_ahead = (target_weekday - now.weekday()) % 7
    target_dt = now.replace(hour=hour, minute=minute, second=0, microsecond=0) + datetime.timedelta(days=days_ahead)

    # If the turn already passed earlier today, advance to next week
    if target_dt <= now:
        target_dt += datetime.timedelta(days=7)

    delta = target_dt - now
    hours_until = delta.total_seconds() / 3600.0
    days_until = delta.days

    return target_dt, round(hours_until, 1), days_until


def evaluate_warabandi_irrigation(
    farm_id: int,
    farm_name: str,
    area_acres: float = 10.0,
    crop_name: str = "Wheat",
    growth_stage: str = "Grain Filling",
    canal_name: str = "Lower Bari Doab Canal",
    canal_turn_day: str = "Thursday",
    canal_turn_time: str = "02:00",
    canal_turn_duration_hours: float = 4.0,
    tubewell_power_source: str = "diesel",
    tubewell_hourly_cost_pkr: float = 1400.0,
    current_soil_moisture: float = 0.22,  # m3/m3
    et0_mm: float = 4.0,                 # mm/day
    forecast_rain_48h_mm: float = 0.0,
    reference_dt: datetime.datetime | None = None,
) -> dict[str, Any]:
    """Evaluate crop water balance, upcoming canal turn, and diesel cost savings."""
    next_turn_dt, hours_until, days_until = compute_next_turn(
        canal_turn_day, canal_turn_time, reference_dt
    )

    # Calculate crop evapotranspiration demand
    kc = get_crop_kc(growth_stage)
    daily_etc_mm = et0_mm * kc
    seven_day_demand_mm = daily_etc_mm * 7.0

    # Convert mm to acre-inches (1 inch = 25.4 mm)
    # Adjust for soil moisture depletion (wilting point approx 0.12, field capacity 0.35)
    moisture_deficit_factor = max(0.4, min(1.6, (0.32 - current_soil_moisture) / 0.15))
    water_demand_inches = round((seven_day_demand_mm / 25.4) * moisture_deficit_factor, 1)
    water_demand_inches = max(1.0, min(5.0, water_demand_inches))

    # Water volume in cubic meters (1 acre-inch ≈ 102.8 m3)
    water_demand_m3 = round(water_demand_inches * area_acres * 102.8, 0)

    # 48-hour rainfall trigger & tubewell savings
    hold_tubewell = False
    potential_savings_pkr = 0.0

    # Decision Matrix:
    # Scenario A: Significant rain expected in next 48h
    if forecast_rain_48h_mm >= 8.0:
        hold_tubewell = True
        avoided_pumping_hours = min(6.0, max(2.5, area_acres * 0.35))
        potential_savings_pkr = round(avoided_pumping_hours * tubewell_hourly_cost_pkr, 0)

        action_en = "Hold Tubewell Pumping — Rain Inbound"
        action_ur = "ٹوب ویل بند رکھو — بارش دی پیشگوئی"
        reasoning_en = (
            f"{forecast_rain_48h_mm} mm rainfall forecasted in next 48 hours. "
            f"Holding tubewell pumping will save approx Rs. {potential_savings_pkr:,.0f} in {tubewell_power_source} costs."
        )
        reasoning_ur = (
            f"اگلے 48 گھنٹیاں وچ {forecast_rain_48h_mm} ملی میٹر بارش دی امید ہے۔ "
            f"ٹوب ویل نہ چلاؤ تے تقریباً {potential_savings_pkr:,.0f} روپے دی ڈیزل/بجلی بچت کرو۔"
        )

    # Scenario B: Canal turn is imminent (within 24 hours)
    elif hours_until <= 24.0:
        hold_tubewell = True
        avoided_pumping_hours = min(canal_turn_duration_hours, area_acres * 0.3)
        potential_savings_pkr = round(avoided_pumping_hours * tubewell_hourly_cost_pkr, 0)

        action_en = "Prepare Watercourses for Canal Turn"
        action_ur = "نہری واری لئی کھال تے موگھا صاف کرو"
        reasoning_en = (
            f"Your Warabandi turn starts in {hours_until:.0f} hours ({next_turn_dt.strftime('%A %I:%M %p')}). "
            f"Divert canal water to fulfill {water_demand_inches} inches for {crop_name} ({growth_stage}); zero tubewell fuel cost."
        )
        weekday_punjabi = PUNJABI_DAYS.get(next_turn_dt.weekday(), "جمعرات")
        reasoning_ur = (
            f"تہاڈی نہری واری {hours_until:.0f} گھنٹے بعد ({weekday_punjabi} {next_turn_dt.strftime('%I:%M %p')}) شروع ہووے گی۔ "
            f"کھال صاف رکھو تے {crop_name} لئی {water_demand_inches} انچ نہری پانی لاؤ؛ ڈیزل دی بچت ہووے گی۔"
        )

    # Scenario C: Severe moisture stress and next turn is > 3 days away
    elif current_soil_moisture < 0.15 and days_until >= 3:
        action_en = "Supplemental Tubewell Irrigation Recommended"
        action_ur = "ہنگامی ٹوب ویل آبپاشی دی لوڑ"
        reasoning_en = (
            f"Topsoil moisture is critically low ({current_soil_moisture * 100:.0f}%) and canal turn is {days_until} days away. "
            f"Run tubewell for 2-3 hours to protect {crop_name} during {growth_stage} stress."
        )
        reasoning_ur = (
            f"زمین وچ نمی گھٹ کے {current_soil_moisture * 100:.0f} فیصد رہ گئی ہے تے نہری واری وچ ہجے {days_until} دن باقی نیں۔ "
            f"فصل نوں سوکا توں بچان لئی 2 توں 3 گھنٹے ٹوب ویل چلاؤ۔"
        )

    # Scenario D: Normal buffer period
    else:
        action_en = "Adequate Moisture — Monitor Soil Buffer"
        action_ur = "زمین دی نمی مناسب ہے — واری دا انتظار کرو"
        reasoning_en = (
            f"Current soil moisture ({current_soil_moisture * 100:.0f}%) is sufficient. "
            f"Next canal turn in {days_until} days ({next_turn_dt.strftime('%A %I:%M %p')})."
        )
        weekday_punjabi = PUNJABI_DAYS.get(next_turn_dt.weekday(), "جمعرات")
        reasoning_ur = (
            f"زمین وچ نمی ({current_soil_moisture * 100:.0f}%) تسلی بخش ہے۔ "
            f"اگلی نہری واری {days_until} دن بعد ({weekday_punjabi} {next_turn_dt.strftime('%I:%M %p')}) لئی پانی محفوظ رکھو۔"
        )

    weekday_punjabi = PUNJABI_DAYS.get(next_turn_dt.weekday(), "جمعرات")
    time_str = next_turn_dt.strftime("%I:%M %p")

    return {
        "farm_id": farm_id,
        "farm_name": farm_name,
        "canal_name": canal_name or "Lower Bari Doab Canal",
        "canal_turn_day": canal_turn_day or "Thursday",
        "canal_turn_time": canal_turn_time or "02:00",
        "canal_turn_duration_hours": canal_turn_duration_hours or 4.0,
        "hours_until_turn": hours_until,
        "days_until_turn": days_until,
        "next_turn_formatted": f"{next_turn_dt.strftime('%A, %b %d at %I:%M %p')}",
        "next_turn_formatted_ur": f"{weekday_punjabi}، {next_turn_dt.strftime('%d %b')} بوقت {time_str}",
        "water_demand_inches": water_demand_inches,
        "water_demand_m3": water_demand_m3,
        "current_soil_moisture_pct": round(current_soil_moisture * 100, 1),
        "upcoming_rain_48h_mm": round(forecast_rain_48h_mm, 1),
        "hold_tubewell_recommended": hold_tubewell,
        "potential_savings_pkr": potential_savings_pkr,
        "tubewell_power_source": tubewell_power_source or "diesel",
        "action_en": action_en,
        "action_ur": action_ur,
        "reasoning_en": reasoning_en,
        "reasoning_ur": reasoning_ur,
    }

