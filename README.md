# AgriTwin — Agricultural Digital Twin Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.3+-black.svg?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Precision Agriculture & Digital Twin Platform for Pakistan's Agricultural Heartlands**  
> Integrates satellite observations, real-time agrometeorology, Saxton-Rawls soil hydraulics, canal rotational rights (Warabandi), and thermal crop phenology into a bilingual Punjabi/English decision-support platform for farmers and agricultural extension officers.

---

## Platform Interface

![AgriTwin Mission Control Dashboard](docs/images/mission_control_dashboard.png)
*AgriTwin Mission Control: Interactive GIS parcel boundary mapping in Gujrat Division, live Punjab node telemetry beacon, and 5-dimension Field Health Index.*

---

## System Modules & Capabilities

### 1. Warabandi Canal Irrigation Optimizer
- Models weekly canal rotational schedules across Punjab's canal commands (Lower Bari Doab, Upper Chenab, Sidhnai, Fordwah, Dera Ghazi Khan, etc.).
- Computes real-time countdowns to each parcel's next scheduled canal turn.
- Integrates 7-day rainfall forecasts: advises farmers when to delay diesel tubewell pumping, helping avoid redundant water applications and saving fuel expenditures (Rs. 1,400–2,200/hour).

### 2. Soil Physics & Hydraulics Engine
- Implements Saxton-Rawls pedotransfer equations to determine soil hydraulic properties from sand, silt, and clay fractions.
- Calculates key moisture metrics:
  - Saturated Moisture Content
  - Field Capacity (33 kPa)
  - Permanent Wilting Point (1500 kPa)
  - Plant Available Water Capacity (AWC)
  - Saturated Hydraulic Conductivity (Ks, mm/hr)
- Maps soil profiles to USDA texture classifications and authentic local Punjabi classifications (میرا, چکنی مٹی, ریتلی).
- Retrieves gridded global soil data from ISRIC SoilGrids 2.0 with regional fallback profiles for central and southern Punjab.

### 3. GDD Thermal Phenology & Stress Alerting
- Calibrates heat accumulation using crop-specific base temperatures: 4.4°C for Wheat, 15.6°C for Cotton, 10.0°C for Rice and Maize, and 18.0°C for Sugarcane.
- Tracks physiological maturity based on accumulated thermal units independently of calendar days.
- Issues Terminal Heat Stress alerts when ambient temperatures exceed 34°C during reproductive and grain-filling stages.
- Automatically recalculates growth stages as time advances since sowing.

### 4. Satellite Vegetation & Weather Telemetry
- Ingests 12-month time-series observations from NASA MODIS Terra (MOD13Q1) 250m composite imagery for NDVI canopy health trends.
- Streams real-time agrometeorological parameters via Open-Meteo: temperature, relative humidity, precipitation, wind speed, and FAO-56 Reference Evapotranspiration (ET0).
- Tracks airborne particulate matter (PM2.5 and PM10) from Copernicus CAMS / Open-Meteo to assess seasonal Punjab smog impact on crop photosynthesis.

### 5. Dual Operational Personas
- **Farmer Mode**: Provides individual parcel management, live countdown to the farm's canal turn, diesel tubewell savings calculator, crop registration, and full edit/delete privileges.
- **Extension Officer Mode**: Designed for regional surveillance (Directorate General of Agriculture Extension Punjab), providing multi-district monitoring across Okara, Faisalabad, and Multan with field deletion restricted for audit compliance.

### 6. Security & Session Architecture
- **Mandatory Login-on-Start**: Unauthenticated visitors are automatically routed to the login page; the public About page remains open for exploration.
- **No Sensitive Tokens in Browser Storage**: Eliminates XSS token theft risks by avoiding localStorage for JWT tokens and user records; sessions are managed through secure cookies (`SameSite=Lax`, `Path=/`) and an in-memory application context.
- **Backend HttpOnly Cookies**: Supports dual authentication via `HttpOnly` session cookies (`agri_session`) or Bearer tokens.
- **Role-Based Access Control**: Ensures farm resources are strictly bound to authenticated user accounts and restricts administrative/audit operations by role.

### 7. Native Punjabi & English Localization
- Complete interface translation in authentic Punjabi (Shahmukhi / پنجابی) and English.
- Localized crop terminology: کنک (Wheat), چاول (Rice), پھٹی (Cotton), گنا (Sugarcane), چھلی (Maize).
- Authentic phenological stages: اگاؤ (Emergence), شگوفے (Tillering), گنڈھ بننا (Jointing), گوپھ (Booting), بور (Flowering), دانہ بھرائی (Grain Filling), پکائی (Maturity).
- Instant language toggle (`ENG` | `پنجابی`) with persistent user preference and RTL layout styling.

---

## Architecture & Project Structure

```
AgriTwin/
├── backend/                  # FastAPI REST API (Python 3.12)
│   ├── app/
│   │   ├── main.py           # Application entrypoint, CORS, lifespan demo seeding
│   │   ├── database.py       # SQLAlchemy engine & session management
│   │   ├── models.py         # Database models (User, Farm, Crop, etc.)
│   │   ├── schemas/          # Pydantic validation schemas
│   │   └── routers/          # Route handlers (auth, farms, analytics, intelligence, weather)
│   ├── tests/                # Automated pytest suite (20 tests)
│   └── requirements.txt      # Python dependencies
├── data-engine/              # Scientific & Agronomic Modeling Engines
│   ├── agricore.py           # 5-dimension health scoring & agronomy rules
│   ├── warabandi_engine.py   # Canal schedule solver & diesel savings estimator
│   ├── soil_engine.py        # Saxton-Rawls hydraulics & ISRIC SoilGrids
│   ├── gdd_engine.py         # Growing Degree Day phenology & heat stress
│   └── crop_knowledge.py     # Crop calendars, base temperatures, and DAS tables
├── frontend/                 # Next.js 16 Web Application (App Router)
│   ├── src/
│   │   ├── app/              # Routes: / (Dashboard), /login, /about, /farms, /farms/[id]
│   │   ├── components/       # UI components (HeaderNav, Footer, AuthProvider, AuthGuard, FarmMap)
│   │   └── lib/              # API client, Punjabi translations, types, and unit tests
│   └── package.json          # Frontend dependencies & test scripts
└── README.md
```

---

## Local Development Setup

### Prerequisites
- Python 3.11 or 3.12
- Node.js 18+ and `npm`

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend tests to verify environment
PYTHONPATH=../data-engine:app:backend pytest tests/ -v

# Start FastAPI server
PYTHONPATH=../data-engine uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive API documentation will be available at: **[http://localhost:8000/docs](http://localhost:8000/docs)**.

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run TypeScript check and unit tests
npx tsc --noEmit && npm test

# Start Next.js development server
npm run dev
```

Open your browser at: **[http://localhost:3000](http://localhost:3000)**.

---

## Testing & Quality Assurance

AgriTwin includes automated test suites covering backend agronomic formulas and frontend localization parity:

```bash
# 1. Run Backend Pytest Suite (20 tests)
# Validates health checks, cookie auth, farm CRUD, Warabandi, soil physics, and phenology
cd backend
PYTHONPATH=../data-engine:app:backend pytest tests/ -v

# 2. Run Frontend Test Suite
# Validates English-to-Punjabi translation key parity and crop name/stage localization
cd frontend
npm test

# 3. Test Production Build
npm run build
```

---

## External Data Feeds & Attribution

| Feed | Provider | Coverage | Parameters |
|---|---|---|---|
| **Meteorology** | [Open-Meteo](https://open-meteo.com) | Real-time & 7-Day Forecast | Temperature, Humidity, Rain, Wind, ET0 |
| **Soil Physics** | Open-Meteo / ECMWF IFS | Topsoil Layer | Soil moisture (0–7 cm), Soil temperature |
| **Air Quality** | Copernicus CAMS / Open-Meteo | Punjab Grid | PM2.5, PM10 Smog indices |
| **Orbital Imagery** | NASA MODIS Terra (MOD13Q1) | 16-Day Composite | 250m NDVI & EVI vegetation indices |
| **Soil Texture** | [ISRIC SoilGrids 2.0](https://soilgrids.org) | 250m Global Grid | Sand, Silt, Clay fractions, Organic matter |
| **Climate Normals** | NASA POWER (MERRA-2) | 30-Year Historical | Baseline temperature & precipitation deviations |

---

## License

This project is open-source under the [MIT License](LICENSE).
