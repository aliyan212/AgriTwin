"""AgriTwin AI — FastAPI application entry point."""

import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add data-engine to sys.path so we can import AgriCore
_data_engine = Path(__file__).resolve().parent.parent.parent / "data-engine"
if str(_data_engine) not in sys.path:
    sys.path.insert(0, str(_data_engine))

from app.config import settings
from app.database import Base, engine
from app.routers import analytics, auth, farms, intelligence, satellite, weather


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables on startup and seed initial demo farms if database is empty."""
    import datetime
    from app.database import SessionLocal
    from app.models import Crop, Farm, User

    Base.metadata.create_all(bind=engine)

    # Seed demo users on a fresh production/local database (password: password123)
    pwd_hash = "$2b$12$1kLIODq1P4Z1OwrkeE1QmOVaJg.aGb.Zq5lN41rbldfYN6UcSovNS"
    db = SessionLocal()
    try:
        farmer = db.query(User).filter(User.email == "farmer@agritwin.pk").first()
        if not farmer:
            farmer = User(
                name="Ahmad Khan (Punjab Farmer)",
                email="farmer@agritwin.pk",
                phone="03001234567",
                hashed_password=pwd_hash,
                role="farmer",
            )
            db.add(farmer)
            db.commit()
            db.refresh(farmer)

        officer = db.query(User).filter(User.email == "officer@agritwin.pk").first()
        if not officer:
            officer = User(
                name="Dr. Tariq Mahmood (Agri Officer)",
                email="officer@agritwin.pk",
                phone="03019876543",
                hashed_password=pwd_hash,
                role="extension_officer",
            )
            db.add(officer)
            db.commit()
            db.refresh(officer)

        if db.query(Farm).count() == 0:
            farm1 = Farm(
                user_id=farmer.id,
                name="Okara Green Fields (چک 45 دیپالپور)",
                district="Okara",
                province="Punjab",
                latitude=30.81,
                longitude=73.45,
                area_acres=12.5,
                canal_name="Lower Bari Doab Canal (LBDC)",
                canal_turn_day="Thursday",
                canal_turn_time="02:00",
                canal_turn_duration_hours=4.5,
                tubewell_power_source="diesel",
                tubewell_hourly_cost_pkr=1400.0,
            )
            farm2 = Farm(
                user_id=demo_user.id,
                name="Faisalabad Rechna Twin (سمندری روڈ)",
                district="Faisalabad",
                province="Punjab",
                latitude=31.41,
                longitude=73.07,
                area_acres=20.0,
                canal_name="Lower Chenab Canal (LCC)",
                canal_turn_day="Monday",
                canal_turn_time="04:30",
                canal_turn_duration_hours=6.0,
                tubewell_power_source="grid",
                tubewell_hourly_cost_pkr=650.0,
            )
            db.add_all([farm1, farm2])
            db.commit()
            db.refresh(farm1)
            db.refresh(farm2)

            crop1 = Crop(
                farm_id=farm1.id,
                crop_name="Wheat",
                variety="Faisalabad-2008",
                sowing_date=datetime.datetime.now() - datetime.timedelta(days=75),
                season="Rabi",
                growth_stage="Grain Filling",
            )
            crop2 = Crop(
                farm_id=farm2.id,
                crop_name="Rice (Basmati)",
                variety="Super Basmati",
                sowing_date=datetime.datetime.now() - datetime.timedelta(days=60),
                season="Kharif",
                growth_stage="Panicle Initiation",
            )
            db.add_all([crop1, crop2])
            db.commit()
    except Exception as e:
        print(f"Startup demo seed note: {e}")
    finally:
        db.close()

    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AgriTwin AI — Pakistan-focused agriculture intelligence platform.",
    lifespan=lifespan,
)

# ── CORS: Allows local dev, Render, and any Vercel deployment URL ─────────────
cors_origins = [o for o in settings.CORS_ORIGINS if o != "*"]
if not cors_origins:
    cors_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|.*\.vercel\.app|.*\.onrender\.com|.*\.hf\.space|.*\.koyeb\.app)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(intelligence.router, prefix=settings.API_PREFIX)  # before farms (specific routes)
app.include_router(farms.router, prefix=settings.API_PREFIX)
app.include_router(weather.router, prefix=settings.API_PREFIX)
app.include_router(satellite.router, prefix=settings.API_PREFIX)
app.include_router(analytics.router, prefix=settings.API_PREFIX)

# Health check also exposed under the API prefix (frontend calls /api/v1/health)
health_router = APIRouter()


@health_router.get("/health")
def health_check_prefixed():
    return {"status": "ok"}


app.include_router(health_router, prefix=settings.API_PREFIX)


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}
