"""NDVI series cache — serves stored MODIS observations when they are fresh.

MODIS publishes a new 16-day composite roughly every 16 days (lagging real
time by ~40 days), so a series stored in the database stays valid for that
window. This keeps repeat intelligence calls fast while the data remains real.
"""

import datetime

from sqlalchemy.orm import Session

from app.models import SatelliteObservation
from app.services.satellite_service import satellite_service

MODIS_LAG_DAYS = 40  # newest composite available ≈ today − 40 days
SOURCE = "modis-terra-mod13q1"


def persist_ndvi_series(farm_id: int, series: list[dict], db: Session):
    """Store MODIS NDVI points, skipping dates already recorded."""
    if not series:
        return
    existing_dates = {
        row.date.date().isoformat()
        for row in db.query(SatelliteObservation)
        .filter(
            SatelliteObservation.farm_id == farm_id,
            SatelliteObservation.source == SOURCE,
        )
        .all()
    }
    for point in series:
        if point["date"] in existing_dates:
            continue
        db.add(SatelliteObservation(
            farm_id=farm_id,
            date=datetime.datetime.strptime(point["date"], "%Y-%m-%d"),
            ndvi=point["ndvi"],
            source=SOURCE,
        ))
    db.commit()


async def get_ndvi_series_cached(
    farm_id: int, lat: float, lon: float, months: int, db: Session
) -> list[dict]:
    """Return the NDVI series from the DB when fresh (< 16 days), else fetch from MODIS."""
    newest_possible = datetime.date.today() - datetime.timedelta(days=MODIS_LAG_DAYS)

    latest = (
        db.query(SatelliteObservation)
        .filter(
            SatelliteObservation.farm_id == farm_id,
            SatelliteObservation.source == SOURCE,
        )
        .order_by(SatelliteObservation.date.desc())
        .first()
    )

    if latest and (newest_possible - latest.date.date()).days < 16:
        # Cache hit — load the requested window from the database
        cutoff = newest_possible - datetime.timedelta(days=months * 30)
        rows = (
            db.query(SatelliteObservation)
            .filter(
                SatelliteObservation.farm_id == farm_id,
                SatelliteObservation.source == SOURCE,
                SatelliteObservation.date
                >= datetime.datetime.combine(cutoff, datetime.time.min),
            )
            .order_by(SatelliteObservation.date.asc())
            .all()
        )
        return [{"date": r.date.date().isoformat(), "ndvi": r.ndvi} for r in rows]

    # Cache miss — fetch fresh from MODIS and persist
    series = await satellite_service.get_ndvi_timeseries(lat, lon, months=months)
    persist_ndvi_series(farm_id, series, db)
    return series
