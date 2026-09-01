# AgriTwin Database Architecture & Migration Guide

AgriTwin supports dual-mode database operations:
- **Local Development / Prototyping**: SQLite (`sqlite:///./agritwin.db`) — requires zero external daemon dependencies.
- **Production / Staging**: PostgreSQL with PostGIS extension (`postgresql+psycopg2://user:password@host:5432/agritwin`) — supports enterprise spatial indexing, GeoAlchemy2 operations, and high-concurrency transactions.

---

## 1. Database Configuration (`DATABASE_URL`)

The database connection is managed via `app.config.Settings` and driven by the `DATABASE_URL` environment variable in `.env`.

### Local SQLite (Default)
```env
DATABASE_URL=sqlite:///./agritwin.db
```
- Geometry coordinates and polygons are stored as standardized GeoJSON strings (`Text` column).
- Centroids (`latitude`, `longitude`) and area metrics are indexed for fast bounding-box lookups.

### Production PostgreSQL + PostGIS
```env
DATABASE_URL=postgresql+psycopg2://agritwin:your_secure_password@db.example.com:5432/agritwin
```
- For PostGIS, install `psycopg2-binary` and ensure the PostGIS extension is enabled:
  ```sql
  CREATE EXTENSION IF NOT EXISTS postgis;
  ```

---

## 2. Alembic Migrations

Schema migrations are tracked and versioned using Alembic in `backend/alembic/`.

### Run Migrations to Latest Schema (`head`)
```bash
PYTHONPATH=../data-engine alembic upgrade head
```

### Check Current Migration Status
```bash
PYTHONPATH=../data-engine alembic current
```

### Generate a New Migration Revision (Auto-detect model changes)
```bash
PYTHONPATH=../data-engine alembic revision --autogenerate -m "describe_changes"
```

### Roll Back Last Migration
```bash
PYTHONPATH=../data-engine alembic downgrade -1
```

---

## 3. Data Dictionary

| Table | Purpose |
|---|---|
| `users` | User accounts, credentials, and roles |
| `farms` | Field boundaries, GeoJSON geometry, district, coordinates, and area |
| `crops` | Crop cycles, phenology, and dynamic knowledge-based growth stages |
| `weather_records` | Open-Meteo hourly/daily observational telemetry |
| `satellite_observations` | MODIS / Sentinel-2 NDVI composites & time series |
| `soil_observations` | ERA5-Land volumetric soil moisture and temperature |
| `recommendations` | AgriCore AI diagnostic reasoning and actionable advisories |
| `alerts` | Real-time agronomic threshold violation alerts |
| `health_score_snapshots` | Historical snapshot records for ML health score forecasting |
