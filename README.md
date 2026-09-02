# 🌾 AgriTwin AI — Agricultural Digital Twin Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2+-black.svg?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Precision Agriculture & Digital Twin Intelligence for Pakistan's Agricultural Heartlands**  
> Real-time agrometeorology, orbital MODIS satellite NDVI tracking, 30-year NASA POWER climatology baselines, machine learning health forecasts, and authentic **Punjabi / English** AI agronomy guidance.

---

## 📸 Key Capabilities

- **🛰️ Satellite Vegetation Monitoring**: Tracks 12-month MODIS Terra (MOD13Q1) NDVI time-series with historical canopy threshold comparisons.
- **🌦️ Live Agrometeorology & Soil Physics**: Real-time 2m temperature, relative humidity, precipitation rate, soil moisture ($0\text{–}7\text{ cm}$), surface soil temperature, and FAO-56 Reference Evapotranspiration ($\text{ET}_0$).
- **🌫️ Punjab Smog & AQI Defense**: Integrated real-time $\text{PM}_{2.5}$ and $\text{PM}_{10}$ air quality indices (Open-Meteo / Copernicus CAMS) with crop hazard indicators.
- **📊 30-Year Climate Anomalies**: Grounded against NASA POWER MERRA-2 30-year historical baselines to flag thermal and moisture deviations.
- **🌱 Phenology Growth Tracking**: Auto-derives crop growth stages and days after sowing (DAS) based on Punjab Agriculture Department knowledge tables for Wheat, Rice, Cotton, Sugarcane, and Maize.
- **🤖 Bilingual AI Agronomy Copilot**: Powered by Gemini 2.0 Flash (with rule-based fallback) delivering actionable field advice in **English** and authentic **Punjabi (Shahmukhi)**.
- **📈 7-Day ML Health Forecasting**: Per-farm Random Forest regression models trained on local field observations with $R^2$ fit scores and feature importance.
- **🗺️ Interactive Web GIS Map**: Vector boundary polygon drawing, auto-calculated acreage & centroid, and reverse geocoded Punjab district detection.
- **🎨 Glassmorphic Dark / Light Mode**: Polished responsive interface with smooth lazy-loaded transitions and RTL typography (Noto Nastaliq Urdu).

---

## 🏗️ Architecture & Tech Stack

```
AgriTwin/
├── backend/               # FastAPI Application
│   ├── alembic/           # Alembic database migrations
│   ├── app/
│   │   ├── routers/       # API route controllers (farms, intelligence, analytics, weather, satellite)
│   │   ├── services/      # External integrations (Open-Meteo, NASA POWER, MODIS, ML)
│   │   ├── models.py      # SQLAlchemy ORM models
│   │   └── schemas.py     # Pydantic request/response schemas
├── data-engine/           # AgriCore Agronomy Engine
│   ├── agricore.py        # 5-dimension health scoring & Gemini copilot
│   ├── crop_knowledge.py  # Phenology tables & days-after-sowing calculators
│   └── weather.py         # Agro-climatic formulas (ET₀, soil indices)
├── frontend/              # Next.js 14 (App Router)
│   ├── src/
│   │   ├── app/           # Next.js pages (Dashboard, Farms Hub, Farm Detail, History, Auth)
│   │   ├── components/    # Reusable Glassmorphism UI widgets & Leaflet map
│   │   └── lib/           # Translations (EN/PA) & API client
└── docker-compose.yml     # PostgreSQL 16 + PostGIS local container
```

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and `npm`
- (Optional) Docker & Docker Compose for PostgreSQL/PostGIS

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Run database migrations (SQLite or PostgreSQL)
alembic upgrade head

# Start the FastAPI server
PYTHONPATH=../data-engine uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The interactive OpenAPI docs will be available at: **[http://localhost:8000/docs](http://localhost:8000/docs)**.

---

### 2. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start Next.js development server
npm run dev
```

Open your browser at: **[http://localhost:3000](http://localhost:3000)**.

---

### 3. (Optional) Run with Docker Compose (PostGIS)

For PostgreSQL with spatial PostGIS support:

```bash
docker compose up -d
```

Update `DATABASE_URL` in `backend/.env`:
```env
DATABASE_URL="postgresql://agritwin:agritwin_dev@localhost:5432/agritwin"
```

Then run `alembic upgrade head`.

---

## 🧪 Testing & Quality Assurance

AgriTwin features an automated test suite across both the Python analytics backend and Next.js frontend:

```bash
# 1. Run Backend Pytest Suite (Health, Auth, Farm CRUD, AgriCore scoring & phenology)
cd backend
PYTHONPATH=../data-engine:app .venv312/bin/pytest tests/ -v

# 2. Run Frontend Localization & Dictionary Parity Tests
cd ../frontend
npm test
```

### GitHub Actions CI
Every commit and pull request to `main` automatically runs our GitHub Actions workflow ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) testing both backend and frontend suites.

---

## 📡 Data Sources & Provenance

| Feed | Provider | Coverage | Metric |
|---|---|---|---|
| **Meteorology** | [Open-Meteo](https://open-meteo.com) | Real-time & 7-Day Forecast | Temp, Humidity, Rain, Wind, $\text{ET}_0$ |
| **Soil Physics** | Open-Meteo ECMWF / IFS | Topsoil Layer | Soil moisture ($0\text{–}7\text{ cm}$), Soil temperature |
| **Air Quality** | Copernicus CAMS / Open-Meteo | Punjab Grid | $\text{PM}_{2.5}$, $\text{PM}_{10}$ Smog indices |
| **Orbital Imagery** | NASA MODIS Terra (MOD13Q1) | 16-Day Composite | 250m NDVI & EVI vegetation indices |
| **Climate Normal** | NASA POWER (MERRA-2) | 30-Year Historical | Baseline thermal & precipitation deviation |
| **Agronomy Rules** | Punjab Agriculture Dept | Provincial Crop Calendars | Sowing windows, DAS phenology, pest risks |

---

## 🌐 Localization

AgriTwin AI features a native **Punjabi (پنجابی / Shahmukhi)** engine tailored for Punjab's farming community:
- Automatic translation of all UI components, badges, charts, tooltips, and modal dialogues.
- Localized crop terminology: *گندم (کنک), کپاس (پھٹی), دھان (چاول), کماد (گنا), مکئی (چھلی)*.
- Authentic phenological stages: *اگاؤ, شگوفے, گنڈھ بننا, گوپھ, بور, دانہ بھرائی, پکائی, کٹائی*.
- Instant language toggle (`EN` | `پنجابی`) with persistent local storage and RTL typography support.

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

