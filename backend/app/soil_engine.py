"""ISRIC SoilGrids 2.0 Integration & Saxton-Rawls Pedotransfer Soil Physics Engine.

Fetches 250m resolution physical soil fractions (sand, silt, clay, organic carbon)
from the ISRIC SoilGrids REST API, runs Saxton-Rawls (2006) pedotransfer equations
to compute Field Capacity, Wilting Point, and Available Water Capacity (AWC),
and determines USDA and Punjab localized soil classifications.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any
import httpx

# ISRIC SoilGrids 2.0 REST Endpoint
SOILGRIDS_API_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"

# Local in-memory cache for coordinates rounded to 3 decimals (~100m)
_SOIL_CACHE: dict[str, dict[str, Any]] = {}


@dataclass
class SoilHydraulicProperties:
    """Soil physical and hydraulic constants computed via Saxton-Rawls (2006)."""
    clay_pct: float
    sand_pct: float
    silt_pct: float
    organic_matter_pct: float
    field_capacity_m3m3: float  # theta_33 (Field Capacity)
    wilting_point_m3m3: float   # theta_1500 (Permanent Wilting Point)
    saturation_m3m3: float      # theta_S (Porosity/Saturation)
    available_water_capacity_mm_m: float  # AWC in mm water per meter soil depth
    available_water_capacity_in_ft: float # AWC in inches water per foot depth
    ksat_mm_hr: float           # Saturated hydraulic conductivity
    usda_texture: str           # USDA textural classification
    punjabi_texture: str        # Localized Punjab farmer classification
    data_source: str            # 'isric_soilgrids_250m' or 'punjab_alluvium_fallback'


def classify_usda_texture(sand: float, silt: float, clay: float) -> tuple[str, str]:
    """Classify sand/silt/clay fractions into USDA and Punjabi soil types."""
    # Sand + Silt + Clay should sum to ~100%
    if clay >= 40:
        if sand >= 45:
            return "Sandy Clay", "ریتلی چکنی"
        elif silt >= 40:
            return "Silty Clay", "سلٹی چکنی"
        else:
            return "Clay", "سخت چکنی (ڈاب)"
    elif clay >= 27:
        if sand >= 45:
            return "Sandy Clay Loam", "ریتلی چکنی میرا"
        elif sand <= 20:
            return "Silty Clay Loam", "سلٹی چکنی میرا"
        else:
            return "Clay Loam", "چکنی میرا (پکی میرا)"
    elif clay >= 15 or (clay >= 7 and sand <= 52 and silt >= 28):
        if sand >= 52:
            return "Sandy Loam", "ریتلی میرا"
        elif silt >= 50:
            return "Silt Loam", "سلٹی میرا (بھل والی)"
        elif silt >= 28 and sand <= 50:
            return "Loam", "میرا (زرخیز میرا)"
        else:
            return "Sandy Loam", "ریتلی میرا"
    else:
        if silt >= 80:
            return "Silt", "خالص سلٹ (بھل)"
        elif sand >= 85:
            return "Sand", "ریت (ریتلی)"
        elif sand >= 70:
            return "Loamy Sand", "ہلکی ریتلی میرا"
        else:
            return "Sandy Loam", "ریتلی میرا"


def compute_saxton_rawls_hydraulics(
    sand_pct: float,
    clay_pct: float,
    organic_matter_pct: float = 1.2,
) -> dict[str, float]:
    """Calculate soil hydraulic properties using Saxton and Rawls (2006) equations.

    Reference:
    Saxton, K.E. and Rawls, W.J. (2006). Soil Water Characteristic Estimates
    by Texture and Organic Matter for Hydrologic Solutions.
    Soil Science Society of America Journal, 70(5), 1569-1578.
    """
    S = sand_pct / 100.0
    C = clay_pct / 100.0
    OM = organic_matter_pct

    # 1. Permanent Wilting Point (1500 kPa / 15 bar)
    theta_1500t = (
        -0.024 * S
        + 0.487 * C
        + 0.006 * OM
        + 0.005 * (S * OM)
        - 0.013 * (C * OM)
        + 0.068 * (S * C)
        + 0.031
    )
    theta_1500 = theta_1500t + (0.14 * theta_1500t - 0.02)
    wilting_point = max(0.04, min(0.40, theta_1500))

    # 2. Field Capacity (33 kPa / 0.33 bar)
    theta_33t = (
        -0.251 * S
        + 0.195 * C
        + 0.011 * OM
        + 0.006 * (S * OM)
        - 0.027 * (C * OM)
        + 0.452 * (S * C)
        + 0.299
    )
    theta_33 = theta_33t + (1.283 * (theta_33t ** 2) - 0.374 * theta_33t - 0.015)
    field_capacity = max(wilting_point + 0.04, min(0.55, theta_33))

    # 3. Saturation (0 kPa)
    theta_S_33t = (
        0.278 * S
        + 0.034 * C
        + 0.022 * OM
        - 0.018 * (S * OM)
        - 0.027 * (C * OM)
        - 0.584 * (S * C)
        + 0.078
    )
    theta_S_33 = theta_S_33t + (0.636 * theta_S_33t - 0.107)
    saturation = field_capacity + theta_S_33 - 0.097 * S + 0.043
    saturation = max(field_capacity + 0.05, min(0.65, saturation))

    # 4. Available Water Capacity (AWC)
    awc_m3m3 = field_capacity - wilting_point
    awc_mm_m = awc_m3m3 * 1000.0  # mm of water per meter of soil
    awc_in_ft = awc_m3m3 * 12.0   # inches of water per foot of soil

    # 5. Saturated Hydraulic Conductivity (Ksat, mm/hr)
    lambda_param = 1.0 / (
        math.log(1500.0) - math.log(33.0)
    ) * (math.log(field_capacity) - math.log(wilting_point))
    lambda_param = max(0.05, min(0.60, lambda_param))
    ksat = 1930.0 * ((saturation - field_capacity) ** (3.0 - lambda_param))
    ksat = max(0.1, min(250.0, ksat))

    return {
        "field_capacity": round(field_capacity, 4),
        "wilting_point": round(wilting_point, 4),
        "saturation": round(saturation, 4),
        "awc_mm_m": round(awc_mm_m, 1),
        "awc_in_ft": round(awc_in_ft, 2),
        "ksat_mm_hr": round(ksat, 2),
    }


async def fetch_isric_soilgrids(lat: float, lon: float) -> dict[str, float] | None:
    """Query ISRIC SoilGrids 2.0 REST API for topsoil layer (0-30cm)."""
    cache_key = f"{round(lat, 3)}_{round(lon, 3)}"
    if cache_key in _SOIL_CACHE:
        return _SOIL_CACHE[cache_key]

    params = {
        "lat": lat,
        "lon": lon,
        "property": ["clay", "sand", "silt", "soc"],
        "depth": ["0-5cm", "5-15cm", "15-30cm"],
        "value": "mean",
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(SOILGRIDS_API_URL, params=params)
            if resp.status_code != 200:
                return None
            data = resp.json()

        properties = data.get("properties", {}).get("layers", [])
        extracted: dict[str, float] = {}

        for layer in properties:
            name = layer.get("name")
            depths = layer.get("depths", [])
            vals = []
            for d in depths:
                mean_val = d.get("values", {}).get("mean")
                if mean_val is not None:
                    vals.append(mean_val)
            if vals:
                # Average across 0-30cm root zone
                extracted[name] = sum(vals) / len(vals)

        if "clay" in extracted and "sand" in extracted and "silt" in extracted:
            # SoilGrids units: clay/sand/silt are g/kg (divide by 10 to get %)
            clay_pct = extracted["clay"] / 10.0
            sand_pct = extracted["sand"] / 10.0
            silt_pct = extracted["silt"] / 10.0
            
            # soc is dg/kg (divide by 100 to get organic carbon %, then * 1.724 for OM)
            soc_dgkg = extracted.get("soc", 100.0)
            soc_pct = soc_dgkg / 100.0
            om_pct = max(0.4, min(3.5, soc_pct * 1.724))

            # Normalize to 100%
            total = clay_pct + sand_pct + silt_pct
            if total > 0:
                clay_pct = (clay_pct / total) * 100.0
                sand_pct = (sand_pct / total) * 100.0
                silt_pct = (silt_pct / total) * 100.0

            result = {
                "clay_pct": round(clay_pct, 1),
                "sand_pct": round(sand_pct, 1),
                "silt_pct": round(silt_pct, 1),
                "organic_matter_pct": round(om_pct, 2),
            }
            _SOIL_CACHE[cache_key] = result
            return result

        return None
    except Exception:
        return None


def get_punjab_alluvium_fallback(lat: float, lon: float) -> dict[str, float]:
    """Typical Punjab Indus Basin alluvium texture by regional doab/district."""
    # Southern Punjab (Bahawalpur, RYK, Thal): sandier
    if lat < 30.0 or (70.8 <= lon <= 71.8 and 30.8 <= lat <= 32.2):
        return {
            "sand_pct": 58.0,
            "silt_pct": 28.0,
            "clay_pct": 14.0,
            "organic_matter_pct": 0.85,
        }
    # Upper Punjab (Gujranwala, Sialkot, Narowal): higher clay
    elif lat > 32.0:
        return {
            "sand_pct": 28.0,
            "silt_pct": 44.0,
            "clay_pct": 28.0,
            "organic_matter_pct": 1.40,
        }
    # Central Bari/Rechna Doab (Faisalabad, Sahiwal, Okara, Multan): fertile silt loam
    else:
        return {
            "sand_pct": 36.0,
            "silt_pct": 46.0,
            "clay_pct": 18.0,
            "organic_matter_pct": 1.15,
        }


async def evaluate_soil_physics(
    lat: float | None = None,
    lon: float | None = None,
) -> SoilHydraulicProperties:
    """Fetch or infer soil texture and calculate Saxton-Rawls soil hydraulics."""
    data = None
    source = "isric_soilgrids_250m"

    if lat is not None and lon is not None:
        data = await fetch_isric_soilgrids(lat, lon)

    if not data:
        source = "punjab_alluvium_fallback"
        data = get_punjab_alluvium_fallback(lat or 30.8, lon or 73.4)

    sand = data["sand_pct"]
    silt = data["silt_pct"]
    clay = data["clay_pct"]
    om = data["organic_matter_pct"]

    hydraulics = compute_saxton_rawls_hydraulics(sand, clay, om)
    usda_name, punjabi_name = classify_usda_texture(sand, silt, clay)

    return SoilHydraulicProperties(
        clay_pct=clay,
        sand_pct=sand,
        silt_pct=silt,
        organic_matter_pct=om,
        field_capacity_m3m3=hydraulics["field_capacity"],
        wilting_point_m3m3=hydraulics["wilting_point"],
        saturation_m3m3=hydraulics["saturation"],
        available_water_capacity_mm_m=hydraulics["awc_mm_m"],
        available_water_capacity_in_ft=hydraulics["awc_in_ft"],
        ksat_mm_hr=hydraulics["ksat_mm_hr"],
        usda_texture=usda_name,
        punjabi_texture=punjabi_name,
        data_source=source,
    )
