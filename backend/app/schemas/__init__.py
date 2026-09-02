"""Pydantic schemas for request/response validation."""

import datetime

from pydantic import BaseModel, Field


# ── User ──────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str = Field(..., max_length=120)
    email: str
    phone: str | None = None
    password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None
    role: str
    is_active: bool
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ── Farm ──────────────────────────────────────────────────────────────────────
class FarmCreate(BaseModel):
    name: str = Field(..., max_length=200)
    geometry_geojson: str | None = None
    area_acres: float | None = None
    district: str | None = None
    province: str = "Punjab"
    latitude: float | None = None
    longitude: float | None = None
    canal_name: str | None = "Lower Bari Doab Canal"
    canal_turn_day: str | None = "Thursday"
    canal_turn_time: str | None = "02:00"
    canal_turn_duration_hours: float | None = 4.0
    tubewell_power_source: str | None = "diesel"
    tubewell_hourly_cost_pkr: float | None = 1400.0


class FarmResponse(BaseModel):
    id: int
    name: str
    geometry_geojson: str | None
    area_acres: float | None
    district: str | None
    province: str
    latitude: float | None
    longitude: float | None
    canal_name: str | None
    canal_turn_day: str | None
    canal_turn_time: str | None
    canal_turn_duration_hours: float | None
    tubewell_power_source: str | None
    tubewell_hourly_cost_pkr: float | None
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class WarabandiConfigUpdate(BaseModel):
    canal_name: str | None = None
    canal_turn_day: str | None = None
    canal_turn_time: str | None = None
    canal_turn_duration_hours: float | None = None
    tubewell_power_source: str | None = None
    tubewell_hourly_cost_pkr: float | None = None


class WarabandiAdviceResponse(BaseModel):
    farm_id: int
    farm_name: str
    canal_name: str
    canal_turn_day: str
    canal_turn_time: str
    canal_turn_duration_hours: float
    hours_until_turn: float
    days_until_turn: int
    next_turn_formatted: str
    next_turn_formatted_ur: str
    water_demand_inches: float
    water_demand_m3: float
    current_soil_moisture_pct: float
    upcoming_rain_48h_mm: float
    hold_tubewell_recommended: bool
    potential_savings_pkr: float
    tubewell_power_source: str
    action_en: str
    action_ur: str
    reasoning_en: str
    reasoning_ur: str


class SoilPhysicsResponse(BaseModel):
    farm_id: int
    clay_pct: float
    sand_pct: float
    silt_pct: float
    organic_matter_pct: float
    field_capacity_m3m3: float
    wilting_point_m3m3: float
    saturation_m3m3: float
    available_water_capacity_mm_m: float
    available_water_capacity_in_ft: float
    ksat_mm_hr: float
    usda_texture: str
    punjabi_texture: str
    data_source: str


class CropPhenologyGDDResponse(BaseModel):
    farm_id: int
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


# ── Crop ──────────────────────────────────────────────────────────────────────
class CropCreate(BaseModel):
    crop_name: str
    variety: str | None = None
    sowing_date: datetime.datetime | None = None
    expected_harvest_date: datetime.datetime | None = None
    growth_stage: str | None = None
    season: str | None = None


class CropResponse(BaseModel):
    id: int
    farm_id: int
    crop_name: str
    variety: str | None
    sowing_date: datetime.datetime | None
    expected_harvest_date: datetime.datetime | None
    growth_stage: str | None
    season: str | None

    model_config = {"from_attributes": True}


# ── Weather ───────────────────────────────────────────────────────────────────
class WeatherRecordResponse(BaseModel):
    id: int
    farm_id: int
    timestamp: datetime.datetime
    temperature_c: float | None
    humidity_pct: float | None
    rainfall_mm: float | None
    wind_speed_kmh: float | None
    et0_mm: float | None
    cloud_cover_pct: float | None
    source: str

    model_config = {"from_attributes": True}


# ── Satellite ─────────────────────────────────────────────────────────────────
class SatelliteObservationResponse(BaseModel):
    id: int
    farm_id: int
    date: datetime.datetime
    ndvi: float | None
    evi: float | None
    cloud_cover_pct: float | None
    source: str
    image_url: str | None

    model_config = {"from_attributes": True}


# ── Soil ──────────────────────────────────────────────────────────────────────
class SoilObservationResponse(BaseModel):
    id: int
    farm_id: int
    date: datetime.datetime
    soil_moisture_m3m3: float | None
    soil_temperature_c: float | None
    depth_cm: int | None
    source: str

    model_config = {"from_attributes": True}


# ── Recommendation ────────────────────────────────────────────────────────────
class RecommendationResponse(BaseModel):
    id: int
    farm_id: int
    recommendation_text: str
    reason: str | None
    confidence: float | None
    risk_level: str | None
    category: str | None
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


# ── Farm Health ───────────────────────────────────────────────────────────────
class FarmHealthScore(BaseModel):
    overall: int
    vegetation: int
    water: int
    weather: int
    pest_risk: int
    climate: int


# ── AI Recommendation ────────────────────────────────────────────────────────
class AIRecommendationRequest(BaseModel):
    farm_id: int
    question: str | None = None


class AIRecommendationResponse(BaseModel):
    recommendation: str
    reasoning: str
    confidence: float
    risk_level: str
    data_summary: dict
