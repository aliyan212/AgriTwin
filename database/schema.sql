-- AgriTwin AI — PostgreSQL + PostGIS Schema (Production)
-- For local development, SQLite is used via SQLAlchemy ORM auto-creation.
-- This file is the production-ready schema with PostGIS geometry support.

CREATE EXTENSION IF NOT EXISTS postgis;

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(120) NOT NULL,
    phone       VARCHAR(20)  UNIQUE,
    email       VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  DEFAULT 'farmer',
    is_active   BOOLEAN      DEFAULT TRUE,
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Farms ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS farms (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER     REFERENCES users(id) ON DELETE CASCADE,
    name         VARCHAR(200) NOT NULL,
    geometry     GEOMETRY(POLYGON, 4326),
    area_acres   DOUBLE PRECISION,
    district     VARCHAR(100),
    province     VARCHAR(100) DEFAULT 'Punjab',
    latitude     DOUBLE PRECISION,
    longitude    DOUBLE PRECISION,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_farms_user ON farms(user_id);
CREATE INDEX IF NOT EXISTS idx_farms_geom ON farms USING GIST (geometry);

-- ── Crops ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crops (
    id                    SERIAL PRIMARY KEY,
    farm_id               INTEGER REFERENCES farms(id) ON DELETE CASCADE,
    crop_name             VARCHAR(100) NOT NULL,
    variety               VARCHAR(100),
    sowing_date           TIMESTAMPTZ,
    expected_harvest_date TIMESTAMPTZ,
    growth_stage          VARCHAR(50),
    season                VARCHAR(20)  -- Rabi / Kharif
);
CREATE INDEX IF NOT EXISTS idx_crops_farm ON crops(farm_id);

-- ── Weather Records ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weather_records (
    id             SERIAL PRIMARY KEY,
    farm_id        INTEGER REFERENCES farms(id) ON DELETE CASCADE,
    "timestamp"    TIMESTAMPTZ NOT NULL,
    temperature_c  DOUBLE PRECISION,
    humidity_pct   DOUBLE PRECISION,
    rainfall_mm    DOUBLE PRECISION,
    wind_speed_kmh DOUBLE PRECISION,
    et0_mm         DOUBLE PRECISION,
    cloud_cover_pct DOUBLE PRECISION,
    source         VARCHAR(50) DEFAULT 'open-meteo'
);
CREATE INDEX IF NOT EXISTS idx_weather_farm_ts ON weather_records(farm_id, "timestamp" DESC);

-- ── Satellite Observations ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS satellite_observations (
    id              SERIAL PRIMARY KEY,
    farm_id         INTEGER REFERENCES farms(id) ON DELETE CASCADE,
    date            TIMESTAMPTZ NOT NULL,
    ndvi            DOUBLE PRECISION,
    evi             DOUBLE PRECISION,
    cloud_cover_pct DOUBLE PRECISION,
    source          VARCHAR(50) DEFAULT 'sentinel-2',
    image_url       TEXT
);
CREATE INDEX IF NOT EXISTS idx_sat_farm_date ON satellite_observations(farm_id, date DESC);

-- ── Soil Observations ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS soil_observations (
    id                    SERIAL PRIMARY KEY,
    farm_id               INTEGER REFERENCES farms(id) ON DELETE CASCADE,
    date                  TIMESTAMPTZ NOT NULL,
    soil_moisture_m3m3    DOUBLE PRECISION,
    soil_temperature_c    DOUBLE PRECISION,
    depth_cm              INTEGER,
    source                VARCHAR(50) DEFAULT 'era5-land'
);
CREATE INDEX IF NOT EXISTS idx_soil_farm_date ON soil_observations(farm_id, date DESC);

-- ── Recommendations ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recommendations (
    id                  SERIAL PRIMARY KEY,
    farm_id             INTEGER REFERENCES farms(id) ON DELETE CASCADE,
    recommendation_text TEXT NOT NULL,
    reason              TEXT,
    confidence          DOUBLE PRECISION,
    risk_level          VARCHAR(20),
    category            VARCHAR(50),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rec_farm_date ON recommendations(farm_id, created_at DESC);
