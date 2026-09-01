"""Local ML engine — trains a per-farm health-score model on accumulated observations.

Every intelligence call records weather observations and score snapshots for the
farm. This engine turns that local history into a scikit-learn model:

  Features : temperature, humidity, rainfall, wind, calendar month
  Labels   : real score snapshots where available, AgriCore rule-engine labels
             (bootstrapped) otherwise — so training works from day one and
             improves as real snapshots accumulate.

The model powers a 7-day score forecast (fed with the Open-Meteo daily
forecast) and is retrained automatically when new snapshots arrive.
"""

import datetime
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score
from sqlalchemy.orm import Session

import agricore
from app.models import Crop, HealthScoreSnapshot, SatelliteObservation, WeatherRecord

MODEL_DIR = Path(__file__).resolve().parent.parent.parent / "ml_models"
MODEL_DIR.mkdir(exist_ok=True)

FEATURES = ["temperature_c", "humidity_pct", "rainfall_mm", "wind_speed_kmh", "month"]

MIN_OBSERVATIONS = 4        # minimum local weather rows to train at all
RETRAIN_SNAPSHOT_GAP = 5    # retrain after this many new real snapshots
RETRAIN_AGE_HOURS = 24
AUGMENT_UNTIL = 60          # jitter-augment small training sets up to this size
AUGMENT_FACTOR = 4
JITTER = 0.08


def _model_path(farm_id: int) -> Path:
    return MODEL_DIR / f"farm_{farm_id}.joblib"


def _si(lst, idx):
    if lst and idx < len(lst):
        return lst[idx]
    return None


# ── Training data ─────────────────────────────────────────────────────────────
def _nearest_ndvi(ndvi_series: list[tuple], ts) -> float | None:
    """NDVI of the satellite composite closest to (and not after) the timestamp."""
    best = None
    for obs_date, ndvi in ndvi_series:
        if ndvi is None or obs_date is None:
            continue
        if obs_date <= ts and (best is None or obs_date > best[0]):
            best = (obs_date, ndvi)
    if best:
        return best[1]
    return ndvi_series[0][1] if ndvi_series else None


def _training_rows(db: Session, farm_id: int, climate_anomaly: dict | None):
    """Build (X, y, sources) from the farm's own recorded observations."""
    weather = (
        db.query(WeatherRecord)
        .filter(WeatherRecord.farm_id == farm_id)
        .order_by(WeatherRecord.timestamp.asc())
        .all()
    )
    if len(weather) < MIN_OBSERVATIONS:
        return None

    snapshots = (
        db.query(HealthScoreSnapshot)
        .filter(HealthScoreSnapshot.farm_id == farm_id)
        .order_by(HealthScoreSnapshot.created_at.asc())
        .all()
    )
    ndvi_series = [
        (obs.date, obs.ndvi)
        for obs in db.query(SatelliteObservation)
        .filter(SatelliteObservation.farm_id == farm_id, SatelliteObservation.ndvi.isnot(None))
        .order_by(SatelliteObservation.date.asc())
        .all()
    ]
    crop = (
        db.query(Crop).filter(Crop.farm_id == farm_id).order_by(Crop.id.desc()).first()
    )

    # Map each snapshot to the weather record closest in time (±15 min) —
    # both are written by the same intelligence call, seconds apart.
    real_labels: dict[int, int] = {}
    for snap in snapshots:
        if snap.created_at is None:
            continue
        best_idx, best_gap = None, None
        for i, w in enumerate(weather):
            if w.timestamp is None:
                continue
            gap = abs((snap.created_at - w.timestamp).total_seconds())
            if gap <= 900 and (best_gap is None or gap < best_gap):
                best_idx, best_gap = i, gap
        if best_idx is not None:
            real_labels[best_idx] = snap.overall

    anomaly = climate_anomaly or {}
    X, y, sources = [], [], []
    for i, w in enumerate(weather):
        if w.timestamp is None:
            continue
        if i in real_labels:
            label, source = real_labels[i], "observed"
        else:
            # Bootstrap label: AgriCore rules applied to this recorded
            # observation (uses the live climate-anomaly regime).
            ctx = agricore.FarmContext(
                farm_id=farm_id,
                crop_name=crop.crop_name if crop else None,
                temperature_c=w.temperature_c,
                humidity_pct=w.humidity_pct,
                rainfall_mm=w.rainfall_mm,
                wind_speed_kmh=w.wind_speed_kmh,
                ndvi=_nearest_ndvi(ndvi_series, w.timestamp),
                temp_anomaly_c=anomaly.get("temp_anomaly_c"),
                humidity_anomaly_pct=anomaly.get("humidity_anomaly_pct"),
                historical_mean_temp_c=anomaly.get("historical_mean_temp_c"),
            )
            label, source = agricore.compute_health_score(ctx).overall, "bootstrap"
        X.append([w.temperature_c, w.humidity_pct, w.rainfall_mm, w.wind_speed_kmh, w.timestamp.month])
        y.append(label)
        sources.append(source)

    if len(y) < MIN_OBSERVATIONS:
        return None
    return X, y, sources


def _column_means(arr: np.ndarray) -> list[float]:
    means = []
    for j in range(arr.shape[1]):
        col = arr[:, j]
        valid = col[~np.isnan(col)]
        means.append(float(valid.mean()) if valid.size else 0.0)
    return means


def _augment(X: np.ndarray, y: np.ndarray):
    """Deterministic jitter augmentation so tiny local datasets still train usefully."""
    if len(X) >= AUGMENT_UNTIL:
        return X, y
    rng = np.random.default_rng(42)
    rows, labels = [X], [y]
    for _ in range(AUGMENT_FACTOR):
        jitter = 1.0 + rng.uniform(-JITTER, JITTER, size=X.shape)
        rows.append(X * jitter)
        labels.append(np.clip(y + rng.uniform(-2.5, 2.5, size=y.shape), 0, 100))
    return np.vstack(rows), np.concatenate(labels)


# ── Train / load / predict ────────────────────────────────────────────────────
def train_farm_model(db: Session, farm_id: int, climate_anomaly: dict | None = None):
    """Train a random-forest health-score model on this farm's local history."""
    rows = _training_rows(db, farm_id, climate_anomaly)
    if rows is None:
        return None, None
    X, y, sources = rows

    arr = np.array([[np.nan if v is None else v for v in row] for row in X], dtype=float)
    means = _column_means(arr)
    arr = np.where(np.isnan(arr), np.array(means), arr)

    Xa, ya = _augment(arr, np.array(y, dtype=float))
    model = RandomForestRegressor(
        n_estimators=150, max_depth=8, min_samples_leaf=2, random_state=42
    )
    model.fit(Xa, ya)
    fit_r2 = r2_score(ya, model.predict(Xa))

    observed = sources.count("observed")
    trained_on = (
        "observed" if observed == len(sources)
        else "bootstrapped" if observed == 0
        else "mixed"
    )
    meta = {
        "trained_at": datetime.datetime.utcnow().isoformat(),
        "samples": len(y),
        "observed_samples": observed,
        "trained_on": trained_on,
        "fit_r2": round(float(fit_r2), 3),
        "feature_importances": {
            name: round(float(imp), 3)
            for name, imp in zip(FEATURES, model.feature_importances_)
        },
        "feature_means": [round(m, 3) for m in means],
        "snapshots_at_training": (
            db.query(HealthScoreSnapshot)
            .filter(HealthScoreSnapshot.farm_id == farm_id)
            .count()
        ),
    }
    joblib.dump({"model": model, "meta": meta}, _model_path(farm_id))
    return model, meta


def load_or_train(db: Session, farm_id: int, climate_anomaly: dict | None = None):
    """Return (model, meta), retraining when the model is missing or stale."""
    path = _model_path(farm_id)
    if path.exists():
        try:
            blob = joblib.load(path)
            meta = blob.get("meta") or {}
            model = blob.get("model")
            trained_at = datetime.datetime.fromisoformat(meta["trained_at"])
            age_hours = (datetime.datetime.utcnow() - trained_at).total_seconds() / 3600
            n_snapshots = (
                db.query(HealthScoreSnapshot)
                .filter(HealthScoreSnapshot.farm_id == farm_id)
                .count()
            )
            gap = n_snapshots - meta.get("snapshots_at_training", 0)
            if model is not None and age_hours < RETRAIN_AGE_HOURS and gap < RETRAIN_SNAPSHOT_GAP:
                return model, meta
        except Exception:
            pass
    try:
        return train_farm_model(db, farm_id, climate_anomaly)
    except Exception:
        return None, None


def predict_forecast(model, meta: dict | None, daily: dict) -> list[dict]:
    """Predict a health score for each Open-Meteo forecast day."""
    if model is None or not daily:
        return []
    means = (meta or {}).get("feature_means") or [0.0] * len(FEATURES)
    out = []
    for i, date_str in enumerate(daily.get("time", [])):
        try:
            month = datetime.datetime.strptime(date_str, "%Y-%m-%d").month
        except (ValueError, TypeError):
            month = datetime.datetime.utcnow().month
        tmax = _si(daily.get("temperature_2m_max"), i)
        tmin = _si(daily.get("temperature_2m_min"), i)
        if tmax is not None and tmin is not None:
            temp = (tmax + tmin) / 2
        else:
            temp = tmax if tmax is not None else tmin
        hum = _si(daily.get("relative_humidity_2m_mean"), i)
        rain = _si(daily.get("precipitation_sum"), i)
        wind = _si(daily.get("wind_speed_10m_max"), i)
        feats = [temp, hum, rain, wind, month]
        row = [means[j] if v is None else v for j, v in enumerate(feats)]
        pred = float(model.predict(np.array([row], dtype=float))[0])
        out.append({
            "date": date_str,
            "predicted_score": int(round(max(0.0, min(100.0, pred)))),
        })
    return out
