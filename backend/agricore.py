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
    text_ur: str | None = None
    reasoning_ur: str | None = None


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
            water_score -= 35
        elif ctx.soil_moisture_m3m3 < 0.25:
            water_score -= 15
        elif ctx.soil_moisture_m3m3 > 0.45:
            water_score -= 20  # waterlogging risk

    if ctx.rainfall_mm is not None and ctx.rainfall_mm > 20:
        water_score = min(100, water_score + 15)

    if ctx.et0_mm is not None and ctx.et0_mm > 6.0:
        water_score = max(0, water_score - 15)  # high atmospheric water demand

    score.water = max(0, min(100, water_score))

    # ── Weather (temperature + humidity + wind extremes) ──────────────────────
    weather_score = 80
    if ctx.temperature_c is not None:
        if ctx.temperature_c > 42:
            weather_score -= 40  # extreme heat stress
        elif ctx.temperature_c > 38:
            weather_score -= 20
        elif ctx.temperature_c < 4:
            weather_score -= 30  # frost risk

    if ctx.wind_speed_kmh is not None and ctx.wind_speed_kmh > 45:
        weather_score -= 25  # lodging risk / spray drift

    if ctx.humidity_pct is not None and ctx.humidity_pct > 85:
        weather_score -= 10  # fungal disease risk

    score.weather = max(0, min(100, weather_score))

    # ── Pest Risk (temp + humidity interaction) ───────────────────────────────
    pest_score = 80
    if ctx.temperature_c and ctx.humidity_pct:
        # Warm + humid = pest-friendly (e.g., whitefly, aphids, bollworm in Punjab)
        if 26 <= ctx.temperature_c <= 35 and ctx.humidity_pct > 65:
            pest_score -= 35
        elif 22 <= ctx.temperature_c <= 38 and ctx.humidity_pct > 55:
            pest_score -= 20

    if ctx.regional_pest_alert:
        pest_score -= 25

    score.pest_risk = max(0, min(100, pest_score))

    # ── Climate Anomaly (departure from historical baseline) ───────────────────
    climate_score = 80
    if ctx.temp_anomaly_c is not None:
        anomaly = abs(ctx.temp_anomaly_c)
        if anomaly >= 5.0:
            climate_score -= 45
        elif anomaly >= 3.0:
            climate_score -= 25
        elif anomaly >= 1.5:
            climate_score -= 10

    if ctx.humidity_anomaly_pct is not None:
        h_anomaly = abs(ctx.humidity_anomaly_pct)
        if h_anomaly >= 25.0:
            climate_score -= 25
        elif h_anomaly >= 15.0:
            climate_score -= 10

    score.climate = max(0, min(100, climate_score))

    # ── Overall composite (weighted average) ──────────────────────────────────
    weights = {
        "vegetation": 0.25,
        "water": 0.25,
        "weather": 0.20,
        "pest_risk": 0.15,
        "climate": 0.15,
    }
    score.overall = int(
        score.vegetation * weights["vegetation"]
        + score.water * weights["water"]
        + score.weather * weights["weather"]
        + score.pest_risk * weights["pest_risk"]
        + score.climate * weights["climate"]
    )
    return score


# ── AI Recommendation Engine (Gemini) ─────────────────────────────────────────
async def generate_recommendation(
    ctx: FarmContext,
    health: FarmHealthScore,
    grounding: str | None = None,
) -> Recommendation:
    """Generate agronomic recommendations via Gemini (bilingual English + Punjabi-flavored Urdu), or fallback to rule-based."""
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

    prompt = f"""You are AgriTwin AI, an expert precision agronomy advisor for farmers in Punjab, Pakistan.
Analyze the following farm telemetry and provide concise, actionable recommendations in BOTH English AND simple, friendly Pakistani Urdu (using colloquial Punjab farming terminology understandable by local farmers, e.g. آبپاشی/پانی, کھاد/یوریا, سنڈی/تیلہ, گندم/دھان/کپاس/کماد).

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
  "recommendation": "<concise actionable recommendation in English>",
  "reasoning": "<concise explanation why based on telemetry in English>",
  "recommendation_ur": "<آسان اور عام فہم اردو / پنجابی زرعی زبان میں کسان کے لیے ٹھوس عملی مشورہ>",
  "reasoning_ur": "<موسم، نمی اور فصل کے مطابق آسان اردو میں وجہ>",
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
            "recommendation_ur": response.text,
            "reasoning_ur": "اے آئی جواب مکمل طور پر موصول نہیں ہوا۔",
            "confidence": 0.5,
            "risk_level": "moderate",
        }

    return Recommendation(
        text=result.get("recommendation", ""),
        reasoning=result.get("reasoning", ""),
        text_ur=result.get("recommendation_ur") or None,
        reasoning_ur=result.get("reasoning_ur") or None,
        confidence=result.get("confidence", 0.5),
        risk_level=result.get("risk_level", "moderate"),
        data_summary=_build_data_summary(ctx, health),
    )


def _rule_based_recommendation(ctx: FarmContext, health: FarmHealthScore) -> Recommendation:
    """Simple rule-based fallback with authentic Punjab farmer Urdu translations."""
    alerts = []
    alerts_ur = []

    if health.water < 50:
        alerts.append(
            "Water stress detected: soil moisture is low and no significant rainfall expected. "
            "Consider irrigation within the next 24–48 hours."
        )
        alerts_ur.append(
            "زمین وچ نمی دی کمی ہے تے بارش دا امکان نہیں۔ اگلے 24 توں 48 گھنٹیاں دے اندر فصل نوں پانی (آبپاشی) لاؤ۔"
        )
    if health.weather < 50:
        alerts.append(
            "Weather alert: extreme temperature or wind conditions detected. "
            "Monitor crops closely and consider protective measures."
        )
        alerts_ur.append(
            "موسمی الرٹ: تیز ہوا یا غیر معمولی گرمی دی وجہ توں فصل تے دباؤ اے۔ کھیت دی مسلسل نگرانی رکھو۔"
        )
    if health.pest_risk < 50:
        alerts.append(
            "Pest risk elevated: warm and humid conditions favor pest development. "
            "Consider scouting your fields and consulting local pest advisory services."
        )
        alerts_ur.append(
            "کیڑیاں (تیلہ / سنڈی) دا خطرہ: گرم تے نم موسم کیڑیاں لئی سازگار ہے۔ فورا اپنے کھیتاں دا معائنہ کرو۔"
        )
    if health.vegetation < 50:
        alerts.append(
            "Vegetation stress: NDVI indicates declining crop health. "
            "Investigate possible causes such as water stress, nutrient deficiency, or disease."
        )
        alerts_ur.append(
            "فصل دی ہریالی وچ کمی: سیٹلائٹ امیجری توں پودیاں دی صحت کمزور نظر آ رہی اے۔ کھاد تے پانی دی صورتحال چیک کرو۔"
        )
    if ctx.temp_anomaly_c is not None and abs(ctx.temp_anomaly_c) >= 2.0:
        direction = "above" if ctx.temp_anomaly_c > 0 else "below"
        direction_ur = "زیادہ" if ctx.temp_anomaly_c > 0 else "گھٹ"
        alerts.append(
            f"Climate anomaly: current temperature is {abs(ctx.temp_anomaly_c):.1f}°C {direction} "
            f"the historical baseline ({ctx.historical_mean_temp_c:.1f}°C for the same month "
            f"last year, NASA POWER). Adjust irrigation and crop monitoring accordingly."
        )
        alerts_ur.append(
            f"موسمی تبدیلی: موجودہ درجہ حرارت پچھلے سال دے مقابلے وچ {abs(ctx.temp_anomaly_c):.1f}°C {direction_ur} اے۔ آبپاشی دا خاص دھیان رکھو۔"
        )

    if not alerts:
        alerts.append(
            "Your farm is in good condition. Continue current practices and monitor regularly."
        )
        alerts_ur.append(
            "ماشاءاللہ تہاڈی فصل دی مجموعی حالت بہترین ہے۔ موجودہ نگہداشت جاری رکھو۔"
        )

    risk = "critical" if health.overall < 30 else "high" if health.overall < 50 else "moderate" if health.overall < 70 else "low"
    confidence = 0.6 if health.overall < 50 else 0.75

    return Recommendation(
        text=" | ".join(alerts),
        reasoning=(
            f"Based on health score {health.overall}/100, live Open-Meteo observations, "
            f"MODIS NDVI, and the NASA POWER historical baseline."
        ),
        text_ur=" | ".join(alerts_ur),
        reasoning_ur=f"صحت اسکور {health.overall}/100، اوپن میٹیو لائیو ڈیٹا، سیٹلائٹ این ڈی وی آئی تے ناسا پاور موسمی ریکارڈ دی بنیاد پر۔",
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
