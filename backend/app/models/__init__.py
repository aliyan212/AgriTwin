"""SQLAlchemy ORM models for AgriTwin AI."""

import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="farmer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())

    farms = relationship("Farm", back_populates="owner", cascade="all, delete-orphan")


class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(200), nullable=False)
    # GeoJSON polygon stored as text for SQLite; use Geometry(POLYGON) with PostGIS
    geometry_geojson = Column(Text, nullable=True)
    area_acres = Column(Float, nullable=True)
    district = Column(String(100), nullable=True)
    province = Column(String(100), default="Punjab")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    # Warabandi (Canal Water Turn) & Tubewell Configuration
    canal_name = Column(String(120), nullable=True, default="Lower Bari Doab Canal")
    canal_turn_day = Column(String(20), nullable=True, default="Thursday")
    canal_turn_time = Column(String(10), nullable=True, default="02:00")
    canal_turn_duration_hours = Column(Float, default=4.0)
    tubewell_power_source = Column(String(30), default="diesel")
    tubewell_hourly_cost_pkr = Column(Float, default=1400.0)
    created_at = Column(DateTime, default=func.now())

    owner = relationship("User", back_populates="farms")
    crops = relationship("Crop", back_populates="farm", cascade="all, delete-orphan")
    weather_records = relationship("WeatherRecord", back_populates="farm", cascade="all, delete-orphan")
    satellite_observations = relationship(
        "SatelliteObservation", back_populates="farm", cascade="all, delete-orphan"
    )
    soil_observations = relationship("SoilObservation", back_populates="farm", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="farm", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="farm", cascade="all, delete-orphan")
    score_snapshots = relationship(
        "HealthScoreSnapshot", back_populates="farm", cascade="all, delete-orphan"
    )


class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    crop_name = Column(String(100), nullable=False)
    variety = Column(String(100), nullable=True)
    sowing_date = Column(DateTime, nullable=True)
    expected_harvest_date = Column(DateTime, nullable=True)
    growth_stage = Column(String(50), nullable=True)
    season = Column(String(20), nullable=True)  # Rabi / Kharif

    farm = relationship("Farm", back_populates="crops")


class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    temperature_c = Column(Float, nullable=True)
    humidity_pct = Column(Float, nullable=True)
    rainfall_mm = Column(Float, nullable=True)
    wind_speed_kmh = Column(Float, nullable=True)
    et0_mm = Column(Float, nullable=True)
    cloud_cover_pct = Column(Float, nullable=True)
    source = Column(String(50), default="open-meteo")

    farm = relationship("Farm", back_populates="weather_records")


class SatelliteObservation(Base):
    __tablename__ = "satellite_observations"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    ndvi = Column(Float, nullable=True)
    evi = Column(Float, nullable=True)
    cloud_cover_pct = Column(Float, nullable=True)
    source = Column(String(50), default="sentinel-2")
    image_url = Column(Text, nullable=True)

    farm = relationship("Farm", back_populates="satellite_observations")


class SoilObservation(Base):
    __tablename__ = "soil_observations"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    soil_moisture_m3m3 = Column(Float, nullable=True)
    soil_temperature_c = Column(Float, nullable=True)
    depth_cm = Column(Integer, nullable=True)
    source = Column(String(50), default="era5-land")

    farm = relationship("Farm", back_populates="soil_observations")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    recommendation_text = Column(Text, nullable=False)
    reason = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    risk_level = Column(String(20), nullable=True)  # low / moderate / high / critical
    category = Column(String(50), nullable=True)  # irrigation, pest, weather, crop
    created_at = Column(DateTime, default=func.now())

    farm = relationship("Farm", back_populates="recommendations")


class HealthScoreSnapshot(Base):
    """Point-in-time health score — persisted per intelligence call for trend charts."""

    __tablename__ = "health_score_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    overall = Column(Integer, nullable=False)
    vegetation = Column(Integer, nullable=True)
    water = Column(Integer, nullable=True)
    weather = Column(Integer, nullable=True)
    pest_risk = Column(Integer, nullable=True)
    climate = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=func.now())

    farm = relationship("Farm", back_populates="score_snapshots")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    severity = Column(String(20), nullable=False)  # info / warning / critical
    category = Column(String(50), nullable=False)  # irrigation / heat / vegetation / pest / rain / wind
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)  # JSON-encoded list
    recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())

    farm = relationship("Farm", back_populates="alerts")
