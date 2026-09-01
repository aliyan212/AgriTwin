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
    """Create tables on startup (dev convenience). Use Alembic for production."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AgriTwin AI — Pakistan-focused agriculture intelligence platform.",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
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
