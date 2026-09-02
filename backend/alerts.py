"""Alert Engine — detects risks from farm context and health scores.

Generates actionable alerts for:
- Irrigation / Water Stress
- Heat Stress
- Vegetation Decline
- Pest Risk
- Heavy Rain / Flood Risk
- Wind Damage
"""

from __future__ import annotations

from dataclasses import dataclass, field

from agricore import FarmContext, FarmHealthScore


@dataclass
class Alert:
    severity: str  # info / warning / critical
    category: str  # irrigation / heat / vegetation / pest / rain / wind
    title: str
    description: str
    evidence: list[str] = field(default_factory=list)
    recommendation: str = ""
    icon: str = ""


def detect_alerts(ctx: FarmContext, health: FarmHealthScore) -> list[Alert]:
    """Analyse farm context and health score, return active alerts."""
    alerts: list[Alert] = []

    # ── Water / Irrigation ─────────────────────────────────────────────────
    if health.water < 40:
        evidence = []
        if ctx.soil_moisture_m3m3 is not None:
            evidence.append(f"Soil moisture: {ctx.soil_moisture_m3m3:.3f} m³/m³")
        if ctx.rainfall_mm is not None:
            evidence.append(f"Recent rainfall: {ctx.rainfall_mm:.1f} mm")
        if ctx.et0_mm is not None:
            evidence.append(f"ET₀: {ctx.et0_mm:.1f} mm")
        alerts.append(Alert(
            severity="critical" if health.water < 25 else "warning",
            category="irrigation",
            title="Water Stress Detected",
            description=(
                "Soil moisture is below the safe range and no significant rainfall "
                "is expected. Crop water demand likely exceeds supply."
            ),
            evidence=evidence,
            recommendation="Consider irrigation within the next 24–48 hours. "
                           "Check field conditions to confirm moisture deficiency.",
            icon="💧",
        ))

    # ── Heat Stress ────────────────────────────────────────────────────────
    if ctx.temperature_c is not None and ctx.temperature_c > 38:
        crop_note = ""
        if ctx.crop_name:
            crop_note = f" for {ctx.crop_name}"
        alerts.append(Alert(
            severity="critical" if ctx.temperature_c > 42 else "warning",
            category="heat",
            title="Heat Stress Risk",
            description=(
                f"Temperature is {ctx.temperature_c:.1f}°C{crop_note}. "
                f"Extended heat can reduce yields and damage crops."
            ),
            evidence=[
                f"Temperature: {ctx.temperature_c:.1f}°C",
                f"Humidity: {ctx.humidity_pct}% " if ctx.humidity_pct else "",
            ],
            recommendation="Monitor crops for wilting. Consider shade nets or "
                           "increased irrigation during peak heat hours (11AM–4PM).",
            icon="🌡️",
        ))

    # ── Vegetation Decline ─────────────────────────────────────────────────
    if ctx.ndvi is not None and ctx.ndvi_change is not None and ctx.ndvi_change < -0.05:
        pct = abs(ctx.ndvi_change) * 100
        alerts.append(Alert(
            severity="critical" if ctx.ndvi_change < -0.15 else "warning",
            category="vegetation",
            title="Vegetation Stress Detected",
            description=(
                f"NDVI dropped by {pct:.0f}% compared to the previous observation. "
                f"Current NDVI: {ctx.ndvi:.2f}. This may indicate water stress, "
                f"nutrient deficiency, disease, or pest damage."
            ),
            evidence=[
                f"NDVI: {ctx.ndvi:.3f}",
                f"NDVI change: {ctx.ndvi_change:+.3f}",
            ],
            recommendation="Inspect the field for visible symptoms. Check soil moisture, "
                           "recent pest activity, and nutrient levels.",
            icon="🌱",
        ))
    elif health.vegetation < 40 and ctx.ndvi is not None:
        alerts.append(Alert(
            severity="warning",
            category="vegetation",
            title="Low Vegetation Index",
            description=f"NDVI is {ctx.ndvi:.2f}, below the healthy range. Crop may be under stress.",
            evidence=[f"NDVI: {ctx.ndvi:.3f}", f"Vegetation score: {health.vegetation}"],
            recommendation="Review irrigation schedule, nutrient status, and pest scouting data.",
            icon="🌱",
        ))

    # ── Pest Risk ──────────────────────────────────────────────────────────
    if health.pest_risk < 50:
        evidence = []
        if ctx.temperature_c and ctx.humidity_pct:
            evidence.append(f"Temperature: {ctx.temperature_c:.1f}°C, Humidity: {ctx.humidity_pct}%")
        if ctx.regional_pest_alert:
            evidence.append("Regional pest alert active")
        alerts.append(Alert(
            severity="warning",
            category="pest",
            title="Elevated Pest Risk",
            description=(
                "Warm and humid conditions favour pest development. "
                "Scout fields regularly and consult local advisory services."
            ),
            evidence=evidence,
            recommendation="Inspect leaves for signs of pest activity. "
                           "Consider biological or targeted chemical controls if thresholds are exceeded.",
            icon="🐛",
        ))

    # ── Heavy Rain / Flood ─────────────────────────────────────────────────
    if ctx.rainfall_mm is not None and ctx.rainfall_mm > 20:
        alerts.append(Alert(
            severity="critical" if ctx.rainfall_mm > 50 else "warning",
            category="rain",
            title="Heavy Rainfall Alert",
            description=(
                f"Significant rainfall recorded: {ctx.rainfall_mm:.1f} mm. "
                f"Risk of waterlogging and soil erosion."
            ),
            evidence=[f"Rainfall: {ctx.rainfall_mm:.1f} mm"],
            recommendation="Check drainage channels. Delay any planned spraying or "
                           "fertiliser application.",
            icon="🌧️",
        ))

    # ── Wind Damage ────────────────────────────────────────────────────────
    if ctx.wind_speed_kmh is not None and ctx.wind_speed_kmh > 35:
        alerts.append(Alert(
            severity="critical" if ctx.wind_speed_kmh > 55 else "warning",
            category="wind",
            title="High Wind Alert",
            description=(
                f"Wind speed is {ctx.wind_speed_kmh:.0f} km/h. "
                f"Risk of lodging in tall crops (wheat, maize, sugarcane)."
            ),
            evidence=[f"Wind: {ctx.wind_speed_kmh:.0f} km/h"],
            recommendation="Avoid spraying operations. Inspect crops for lodging after the wind event.",
            icon="💨",
        ))

    # ── Climate Anomaly (vs. NASA POWER historical baseline) ────────────────
    if ctx.temp_anomaly_c is not None and abs(ctx.temp_anomaly_c) >= 2.0:
        above = ctx.temp_anomaly_c > 0
        severity = "critical" if abs(ctx.temp_anomaly_c) >= 4.0 else "warning"
        direction = "above" if above else "below"
        evidence = [
            f"Current temperature: {ctx.temperature_c:.1f}°C" if ctx.temperature_c is not None else "",
            f"Historical baseline: {ctx.historical_mean_temp_c:.1f}°C",
            f"Anomaly: {ctx.temp_anomaly_c:+.1f}°C",
        ]
        if ctx.humidity_anomaly_pct is not None:
            evidence.append(f"Humidity anomaly: {ctx.humidity_anomaly_pct:+.1f}%")
        alerts.append(Alert(
            severity=severity,
            category="climate",
            title=(
                f"Temperature {abs(ctx.temp_anomaly_c):.1f}°C {direction} "
                f"Historical Baseline"
            ),
            description=(
                f"Current conditions are {abs(ctx.temp_anomaly_c):.1f}°C {direction} the same "
                f"period last year (NASA POWER MERRA-2 baseline: "
                f"{ctx.historical_mean_temp_c:.1f}°C). "
                + ("Above-normal heat raises crop water demand and pest pressure."
                   if above else
                   "Below-normal temperatures can slow crop development.")
            ),
            evidence=[e for e in evidence if e],
            recommendation=(
                "Factor the anomaly into irrigation planning and monitor crops more "
                "frequently while conditions remain abnormal."
            ),
            icon="🌡️",
        ))

    # ── All Clear ──────────────────────────────────────────────────────────
    if not alerts:
        alerts.append(Alert(
            severity="info",
            category="general",
            title="Farm Conditions Normal",
            description="No active alerts. All monitored indicators are within acceptable ranges.",
            evidence=[f"Health score: {health.overall}/100"],
            recommendation="Continue current practices and monitor regularly.",
            icon="✅",
        ))

    return alerts
