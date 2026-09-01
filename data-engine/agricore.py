"""AgriCore — the central decision engine for AgriTwin AI.

Combines weather, satellite, soil, and crop data into a unified farm
health score and generates AI-powered recommendations.
"""

from __future__ import annotations

import asyncio
import json
import os
from dataclasses import dataclass, field

from dotenv import load_dotenv

from crop_knowledge import get_crop_info

load_dotenv()


# ── Data structures ───────────────────────────────────────────────────────────
@dataclass
class FarmContext:
    """Aggregated data context for a single farm."""

    farm_id: int
    crop_name: str | None = None
    growth_stage: str | None = None
    sowing_date: str | None = None

    # Weather
    temperature_c: float | None = None
    humidity_pct: float | None = None
    rainfall_mm: float | None = None
    rain_probability_pct: float | None = None
    wind_speed_kmh: float | None = None
    et0_mm: float | None = None

    # Satellite
    ndvi: float | None = None
    ndvi_change: float | None = None

    # Soil
    soil_moisture_m3m3: float | None = None
    soil_temperature_c: float | None = None

    # Climate anomaly (from NASA POWER historical baseline)
    temp_anomaly_c: float | None = None
    humidity_anomaly_pct: float | None = None
    historical_mean_temp_c: float | None = None

    # Alerts
    regional_pest_alert: bool = False

    # Extra
    extra: dict = field(default_factory=dict)


@dataclass
class FarmHealthScore:
    overall: int = 0
    vegetation: int = 0
    water: int = 0
    weather: int = 0
    pest_risk: int = 0
    climate: int = 0


@dataclass
class Recommendation:
    text: str
    reasoning: str
    confidence: float
    risk_level: str  # low / moderate / high / critical
    data_summary: dict


# ── Scoring engine ────────────────────────────────────────────────────────────
def compute_health_score(ctx: FarmContext) -> FarmHealthScore:
    """Compute a 0–100 health score for each dimension."""
    score = FarmHealthScore()

    # ── Vegetation (NDVI-based) ───────────────────────────────────────────────
    if ctx.ndvi is not None:
        crop_info = get_crop_info(ctx.crop_name) if ctx.crop_name else None
        low, high = (crop_info["ndvi_healthy_range"] if crop_info else (0.4, 0.85))
        if ctx.ndvi >= low:
            score.vegetation = min(100, int(ctx.ndvi / high * 100))
        else:
            score.vegetation = max(0, int(ctx.ndvi / low * 60))
        # Penalize for declining NDVI
        if ctx.ndvi_change is not None and ctx.ndvi_change < -0.05:
            score.vegetation = max(0, score.vegetation - 15)
    else:
        score.vegetation = 50  # no data → neutral

    # ── Water (soil moisture + ET0 + rainfall) ────────────────────────────────
    water_score = 70  # baseline
    if ctx.soil_moisture_m3m3 is not None:
        if ctx.soil_moisture_m3m3 < 0.15:
            water_score -= 30
        elif ctx.soil_moisture_m3m3 < 0.25:
            water_score -= 15
        elif ctx.soil_moisture_m3m3 > 0.45:
            water_score -= 10  # waterlogging risk
    if ctx.et0_mm is not None and ctx.et0_mm > 6:
        water_score -= 15
    if ctx.rainfall_mm is not None and ctx.rainfall_mm < 1 and ctx.et0_mm and ctx.et0_mm > 4:
        water_score -= 10
    score.water = max(0, min(100, water_score))

    # ── Weather (temperature + extreme events) ────────────────────────────────
    weather_score = 80
    if ctx.temperature_c is not None:
        crop_info = get_crop_info(ctx.crop_name) if ctx.crop_name else None
        if crop_info:
            opt = crop_info["optimal_temperature_c"]
            if ctx.temperature_c > opt["critical_high"]:
                weather_score -= 30
            elif ctx.temperature_c > opt["max"]:
                weather_score -= 15
            elif ctx.temperature_c < opt["min"]:
                weather_score -= 15
    if ctx.wind_speed_kmh is not None and ctx.wind_speed_kmh > 40:
        weather_score -= 20
    score.weather = max(0, min(100, weather_score))

    # ── Pest risk ─────────────────────────────────────────────────────────────
    pest_score = 80
    if ctx.regional_pest_alert:
        pest_score -= 30
    # Warm + humid conditions increase pest risk
    if ctx.temperature_c and ctx.humidity_pct:
        if ctx.temperature_c > 28 and ctx.humidity_pct > 70:
            pest_score -= 15
    score.pest_risk = max(0, min(100, pest_score))

    # ── Climate (historical trend deviation from NASA POWER) ──────────────────
    climate_score = 75  # baseline
    if ctx.temp_anomaly_c is not None:
        anomaly = ctx.temp_anomaly_c
        if abs(anomaly) <= 1.0:
            climate_score = 95  # near normal
        elif abs(anomaly) <= 2.0:
            climate_score = 80  # mild deviation
        elif abs(anomaly) <= 3.5:
            climate_score = 60  # moderate deviation
        elif abs(anomaly) <= 5.0:
            climate_score = 40  # significant deviation
        else:
            climate_score = 20  # extreme anomaly
        # Extra penalty for extreme heat anomaly
        if anomaly > 4.0:
            climate_score -= 10
    score.climate = max(0, min(100, climate_score))

    # ── Overall ───────────────────────────────────────────────────────────────
    weights = {"vegetation": 0.25, "water": 0.25, "weather": 0.20, "pest_risk": 0.15, "climate": 0.15}
    score.overall = int(
        score.vegetation * weights["vegetation"]
        + score.water * weights["water"]
        + score.weather * weights["weather"]
        + score.pest_risk * weights["pest_risk"]
        + score.climate * weights["climate"]
    )

    return score


# ── AI recommendation engine ──────────────────────────────────────────────────
SYSTEM_PROMPT = """You are AgriTwin AI, an agricultural decision-support assistant
for farmers in Punjab, Pakistan. You analyze real farm data — weather, satellite
imagery (NDVI), soil moisture, crop stage, and regional pest alerts — and provide
actionable recommendations.

RULES:
1. Never invent measurements. Only use the data provided.
2. If data is insufficient, explicitly state that.
3. Always provide: recommendation, reasoning, confidence (0–1), risk_level, and
   any uncertainties.
4. Recommendations must be actionable (e.g. "Consider irrigation within 24–48 hours").
5. Use simple language understandable by a farmer.
6. When grounding data from the farm's own recorded history is provided, cite its
   concrete numbers (dates, scores, °C, mm, forecasts) so the advice is
   verifiable and farm-specific.
"""


async def generate_recommendation(
    ctx: FarmContext, health: FarmHealthScore, grounding: str | None = None
) -> Recommendation:
    """Use Gemini (google-genai SDK) to generate a data-grounded recommendation.

    `grounding` carries the farm's own recorded history (past observations,
    alerts, previous advice, and the local ML score forecast) so the
    recommendation is authentic and farm-specific.

    Falls back to the rule-based engine when no API key is configured or the
    SDK is unavailable.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return _rule_based_recommendation(ctx, health)

    try:
        from google import genai
        from google.genai import types as genai_types
    except ImportError:
        return _rule_based_recommendation(ctx, health)

    client = genai.Client(api_key=api_key)
    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    grounding_block = ""
    if grounding:
        grounding_block = (
            "Grounding Data (this farm's own recorded history, recent alerts, "
            "previous advice, and a locally-trained ML forecast — use it to make "
            "the advice specific and authentic; cite concrete numbers when relevant):\n"
            f"{grounding}\n\n"
        )

    prompt = f"""Analyze the following farm data and provide a recommendation.

Farm Context:
- Crop: {ctx.crop_name or 'Unknown'}
- Growth Stage: {ctx.growth_stage or 'Unknown'}
- Temperature: {ctx.temperature_c}°C
- Humidity: {ctx.humidity_pct}%
- Rainfall (recent): {ctx.rainfall_mm} mm
- Rain Probability (next 48h): {ctx.rain_probability_pct}%
- Soil Moisture: {ctx.soil_moisture_m3m3} m³/m³
- NDVI: {ctx.ndvi} (change: {ctx.ndvi_change})
- ET0: {ctx.et0_mm} mm
- Wind: {ctx.wind_speed_kmh} km/h
- Regional Pest Alert: {ctx.regional_pest_alert}
- Temperature Anomaly vs. Historical Baseline: {ctx.temp_anomaly_c if ctx.temp_anomaly_c is not None else 'N/A'}°C
- Historical Mean Temperature (same month last year, NASA POWER): {ctx.historical_mean_temp_c if ctx.historical_mean_temp_c is not None else 'N/A'}°C
- Humidity Anomaly vs. Historical: {ctx.humidity_anomaly_pct if ctx.humidity_anomaly_pct is not None else 'N/A'}%

{grounding_block}Farm Health Score: {health.overall}/100
- Vegetation: {health.vegetation}
- Water: {health.water}
- Weather: {health.weather}
- Pest Risk: {health.pest_risk}
- Climate: {health.climate}

Respond in this exact JSON format:
{{
  "recommendation": "<actionable recommendation>",
  "reasoning": "<explain why based on the data>",
  "confidence": <0.0 to 1.0>,
  "risk_level": "<low|moderate|high|critical>"
}}
"""
    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=model,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3,
            ),
        )
    except Exception:
        # Any Gemini failure (quota, network, invalid key) → rule-based fallback
        return _rule_based_recommendation(ctx, health)

    try:
        result = json.loads(response.text)
    except (json.JSONDecodeError, TypeError):
        result = {
            "recommendation": response.text,
            "reasoning": "AI response could not be parsed as JSON.",
            "confidence": 0.5,
            "risk_level": "moderate",
        }

    return Recommendation(
        text=result.get("recommendation", ""),
        reasoning=result.get("reasoning", ""),
        confidence=result.get("confidence", 0.5),
        risk_level=result.get("risk_level", "moderate"),
        data_summary=_build_data_summary(ctx, health),
    )


def _rule_based_recommendation(ctx: FarmContext, health: FarmHealthScore) -> Recommendation:
    """Simple rule-based fallback when Gemini is not available."""
    alerts = []

    if health.water < 50:
        alerts.append(
            "Water stress detected: soil moisture is low and no significant rainfall expected. "
            "Consider irrigation within the next 24–48 hours."
        )
    if health.weather < 50:
        alerts.append(
            "Weather alert: extreme temperature or wind conditions detected. "
            "Monitor crops closely and consider protective measures."
        )
    if health.pest_risk < 50:
        alerts.append(
            "Pest risk elevated: warm and humid conditions favor pest development. "
            "Consider scouting your fields and consulting local pest advisory services."
        )
    if health.vegetation < 50:
        alerts.append(
            "Vegetation stress: NDVI indicates declining crop health. "
            "Investigate possible causes such as water stress, nutrient deficiency, or disease."
        )
    if ctx.temp_anomaly_c is not None and abs(ctx.temp_anomaly_c) >= 2.0:
        direction = "above" if ctx.temp_anomaly_c > 0 else "below"
        alerts.append(
            f"Climate anomaly: current temperature is {abs(ctx.temp_anomaly_c):.1f}°C {direction} "
            f"the historical baseline ({ctx.historical_mean_temp_c:.1f}°C for the same month "
            f"last year, NASA POWER). Adjust irrigation and crop monitoring accordingly."
        )

    if not alerts:
        alerts.append(
            "Your farm is in good condition. Continue current practices and monitor regularly."
        )

    risk = "critical" if health.overall < 30 else "high" if health.overall < 50 else "moderate" if health.overall < 70 else "low"
    confidence = 0.6 if health.overall < 50 else 0.75

    return Recommendation(
        text=" | ".join(alerts),
        reasoning=(
            f"Based on health score {health.overall}/100, live Open-Meteo observations, "
            f"MODIS NDVI, and the NASA POWER historical baseline."
        ),
        confidence=confidence,
        risk_level=risk,
        data_summary=_build_data_summary(ctx, health),
    )


def _build_data_summary(ctx: FarmContext, health: FarmHealthScore) -> dict:
    return {
        "crop": ctx.crop_name,
        "growth_stage": ctx.growth_stage,
        "temperature_c": ctx.temperature_c,
        "humidity_pct": ctx.humidity_pct,
        "rainfall_mm": ctx.rainfall_mm,
        "soil_moisture_m3m3": ctx.soil_moisture_m3m3,
        "ndvi": ctx.ndvi,
        "ndvi_change": ctx.ndvi_change,
        "et0_mm": ctx.et0_mm,
        "regional_pest_alert": ctx.regional_pest_alert,
        "temp_anomaly_c": ctx.temp_anomaly_c,
        "historical_mean_temp_c": ctx.historical_mean_temp_c,
        "health_score": health.overall,
    }
