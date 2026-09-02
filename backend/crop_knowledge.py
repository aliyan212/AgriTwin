"""Pakistan Crop Knowledge Base — Punjab-focused crop data for AgriTwin."""

# Crop calendar data sourced from Punjab Agriculture Department
# https://agripunjab.gov.pk

CROP_KNOWLEDGE_BASE: list[dict] = [
    {
        "crop": "Wheat",
        "province": "Punjab",
        "season": "Rabi",
        "sowing_window": "October 15 – December 15",
        "harvest_window": "April – May",
        "optimal_temperature_c": {"min": 10, "max": 25, "critical_high": 35},
        "water_requirement_mm": 450,
        "growth_stages": [
            {"stage": "Germination", "days_after_sowing": "0–10", "water_sensitivity": "moderate"},
            {"stage": "Tillering", "days_after_sowing": "20–45", "water_sensitivity": "high"},
            {"stage": "Jointing", "days_after_sowing": "55–70", "water_sensitivity": "high"},
            {"stage": "Booting", "days_after_sowing": "75–90", "water_sensitivity": "critical"},
            {"stage": "Flowering", "days_after_sowing": "95–110", "water_sensitivity": "critical"},
            {"stage": "Grain Filling", "days_after_sowing": "115–140", "water_sensitivity": "moderate"},
            {"stage": "Maturity", "days_after_sowing": "145–160", "water_sensitivity": "low"},
        ],
        "common_pests": ["Aphids", "Army worm", "Termites", "Rust"],
        "ndvi_healthy_range": (0.5, 0.9),
    },
    {
        "crop": "Rice (Basmati)",
        "province": "Punjab",
        "season": "Kharif",
        "sowing_window": "June 1 – July 15",
        "harvest_window": "October – November",
        "optimal_temperature_c": {"min": 20, "max": 35, "critical_high": 40},
        "water_requirement_mm": 1200,
        "growth_stages": [
            {"stage": "Nursery", "days_after_sowing": "0–30", "water_sensitivity": "high"},
            {"stage": "Transplanting", "days_after_sowing": "25–35", "water_sensitivity": "critical"},
            {"stage": "Tillering", "days_after_sowing": "35–60", "water_sensitivity": "high"},
            {"stage": "Panicle Initiation", "days_after_sowing": "60–80", "water_sensitivity": "critical"},
            {"stage": "Flowering", "days_after_sowing": "80–100", "water_sensitivity": "critical"},
            {"stage": "Grain Filling", "days_after_sowing": "100–130", "water_sensitivity": "high"},
            {"stage": "Maturity", "days_after_sowing": "130–150", "water_sensitivity": "low"},
        ],
        "common_pests": ["Stem borer", "Leaf folder", "Blast", "Bacterial leaf blight"],
        "ndvi_healthy_range": (0.6, 0.9),
    },
    {
        "crop": "Cotton",
        "province": "Punjab",
        "season": "Kharif",
        "sowing_window": "April 15 – June 30",
        "harvest_window": "September – December",
        "optimal_temperature_c": {"min": 21, "max": 35, "critical_high": 42},
        "water_requirement_mm": 700,
        "growth_stages": [
            {"stage": "Germination", "days_after_sowing": "0–10", "water_sensitivity": "moderate"},
            {"stage": "Seedling", "days_after_sowing": "10–30", "water_sensitivity": "moderate"},
            {"stage": "Squaring", "days_after_sowing": "40–60", "water_sensitivity": "high"},
            {"stage": "Flowering", "days_after_sowing": "60–100", "water_sensitivity": "critical"},
            {"stage": "Boll Formation", "days_after_sowing": "100–140", "water_sensitivity": "high"},
            {"stage": "Boll Opening", "days_after_sowing": "140–180", "water_sensitivity": "low"},
        ],
        "common_pests": ["Bollworm", "Whitefly", "Jassid", "Pink bollworm", "CLCV"],
        "ndvi_healthy_range": (0.5, 0.85),
    },
    {
        "crop": "Sugarcane",
        "province": "Punjab",
        "season": "Kharif (annual)",
        "sowing_window": "February – March (spring) / September – October (autumn)",
        "harvest_window": "November – March (12–18 months)",
        "optimal_temperature_c": {"min": 20, "max": 35, "critical_high": 42},
        "water_requirement_mm": 1500,
        "growth_stages": [
            {"stage": "Germination", "days_after_sowing": "0–30", "water_sensitivity": "moderate"},
            {"stage": "Tillering", "days_after_sowing": "30–90", "water_sensitivity": "high"},
            {"stage": "Grand Growth", "days_after_sowing": "90–240", "water_sensitivity": "critical"},
            {"stage": "Maturation", "days_after_sowing": "240–360", "water_sensitivity": "low"},
        ],
        "common_pests": ["Top borer", "Early shoot borer", "Pyralid borer", "Red rot"],
        "ndvi_healthy_range": (0.6, 0.9),
    },
    {
        "crop": "Maize",
        "province": "Punjab",
        "season": "Kharif / Spring",
        "sowing_window": "February – March (spring) / July – August (Kharif)",
        "harvest_window": "May – June (spring) / October – November (Kharif)",
        "optimal_temperature_c": {"min": 18, "max": 32, "critical_high": 38},
        "water_requirement_mm": 500,
        "growth_stages": [
            {"stage": "Germination", "days_after_sowing": "0–10", "water_sensitivity": "moderate"},
            {"stage": "Vegetative", "days_after_sowing": "15–50", "water_sensitivity": "high"},
            {"stage": "Tasseling", "days_after_sowing": "50–65", "water_sensitivity": "critical"},
            {"stage": "Silking", "days_after_sowing": "65–75", "water_sensitivity": "critical"},
            {"stage": "Grain Filling", "days_after_sowing": "75–110", "water_sensitivity": "high"},
            {"stage": "Maturity", "days_after_sowing": "110–130", "water_sensitivity": "low"},
        ],
        "common_pests": ["Fall armyworm", "Stem borer", "Leaf blight"],
        "ndvi_healthy_range": (0.6, 0.9),
    },
]


import datetime
import re


def get_crop_info(crop_name: str) -> dict | None:
    """Look up crop info by name (case-insensitive)."""
    if not crop_name:
        return None
    for entry in CROP_KNOWLEDGE_BASE:
        # Match exact, case-insensitive, or substring (e.g. "Rice" matches "Rice (Basmati)")
        if entry["crop"].lower() == crop_name.lower() or crop_name.lower() in entry["crop"].lower() or entry["crop"].lower() in crop_name.lower():
            return entry
    return None


def list_crops() -> list[str]:
    """Return list of all known crop names."""
    return [entry["crop"] for entry in CROP_KNOWLEDGE_BASE]


def derive_growth_stage(
    crop_name: str,
    sowing_date: str | datetime.date | datetime.datetime | None,
    reference_date: datetime.date | None = None,
) -> dict:
    """
    Auto-derive crop growth stage dynamically from sowing date using Punjab Agricultural Knowledge tables.
    Returns stage name, days after sowing (DAS), water sensitivity, stage index, and full stages list.
    """
    if not sowing_date:
        return {
            "stage": "Vegetative",
            "days_after_sowing": None,
            "water_sensitivity": "moderate",
            "stage_index": 1,
            "stages": [],
            "is_harvested": False,
        }

    # Parse sowing date
    if isinstance(sowing_date, str):
        try:
            sowing_dt = datetime.date.fromisoformat(sowing_date.split("T")[0])
        except Exception:
            return {
                "stage": "Vegetative",
                "days_after_sowing": None,
                "water_sensitivity": "moderate",
                "stage_index": 1,
                "stages": [],
                "is_harvested": False,
            }
    elif isinstance(sowing_date, datetime.datetime):
        sowing_dt = sowing_date.date()
    elif isinstance(sowing_date, datetime.date):
        sowing_dt = sowing_date
    else:
        return {
            "stage": "Vegetative",
            "days_after_sowing": None,
            "water_sensitivity": "moderate",
            "stage_index": 1,
            "stages": [],
            "is_harvested": False,
        }

    ref_dt = reference_date or datetime.date.today()
    days_elapsed = (ref_dt - sowing_dt).days

    crop_info = get_crop_info(crop_name)
    if not crop_info or "growth_stages" not in crop_info:
        # Generic agricultural stage curve
        if days_elapsed < 14:
            stage_name = "Emergence / Germination"
            idx = 0
            sens = "moderate"
        elif days_elapsed < 50:
            stage_name = "Vegetative Growth"
            idx = 1
            sens = "high"
        elif days_elapsed < 85:
            stage_name = "Flowering / Reproduction"
            idx = 2
            sens = "critical"
        elif days_elapsed < 125:
            stage_name = "Grain / Fruit Filling"
            idx = 3
            sens = "high"
        elif days_elapsed <= 160:
            stage_name = "Maturity"
            idx = 4
            sens = "low"
        else:
            stage_name = "Post-Maturity / Harvested"
            idx = 5
            sens = "low"

        return {
            "stage": stage_name,
            "days_after_sowing": max(0, days_elapsed),
            "water_sensitivity": sens,
            "stage_index": idx,
            "stages": [],
            "is_harvested": days_elapsed > 160,
        }

    stages = crop_info["growth_stages"]

    if days_elapsed < 0:
        return {
            "stage": "Pre-sowing",
            "days_after_sowing": days_elapsed,
            "water_sensitivity": "low",
            "stage_index": 0,
            "stages": stages,
            "is_harvested": False,
        }

    parsed_stages = []
    for idx, s in enumerate(stages):
        das_str = s.get("days_after_sowing", "")
        # Extract numbers from "0–10", "20–45", "145–160", etc.
        nums = [int(n) for n in re.findall(r"\d+", das_str)]
        if len(nums) >= 2:
            min_d, max_d = nums[0], nums[1]
        elif len(nums) == 1:
            min_d, max_d = nums[0], nums[0] + 15
        else:
            min_d, max_d = 0, 999
        parsed_stages.append((idx, min_d, max_d, s))

    # Match exact range
    for idx, min_d, max_d, s in parsed_stages:
        if min_d <= days_elapsed <= max_d:
            return {
                "stage": s["stage"],
                "days_after_sowing": days_elapsed,
                "water_sensitivity": s.get("water_sensitivity", "moderate"),
                "stage_index": idx,
                "stages": stages,
                "is_harvested": False,
            }

    # If within transitional gaps between defined stages, assign to the next upcoming phase
    for i in range(len(parsed_stages) - 1):
        curr_max = parsed_stages[i][2]
        next_min = parsed_stages[i + 1][1]
        if curr_max < days_elapsed < next_min:
            s = parsed_stages[i + 1][3]
            return {
                "stage": s["stage"],
                "days_after_sowing": days_elapsed,
                "water_sensitivity": s.get("water_sensitivity", "moderate"),
                "stage_index": parsed_stages[i + 1][0],
                "stages": stages,
                "is_harvested": False,
            }

    # If beyond final stage window
    last_idx, _, last_max, last_s = parsed_stages[-1]
    if days_elapsed > last_max:
        return {
            "stage": f"Post-{last_s['stage']} (Ready for Harvest)",
            "days_after_sowing": days_elapsed,
            "water_sensitivity": "low",
            "stage_index": last_idx,
            "stages": stages,
            "is_harvested": True,
        }

    # Default to first stage
    first_s = parsed_stages[0][3]
    return {
        "stage": first_s["stage"],
        "days_after_sowing": days_elapsed,
        "water_sensitivity": first_s.get("water_sensitivity", "moderate"),
        "stage_index": 0,
        "stages": stages,
        "is_harvested": False,
    }
