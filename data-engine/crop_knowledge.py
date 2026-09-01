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


def get_crop_info(crop_name: str) -> dict | None:
    """Look up crop info by name (case-insensitive)."""
    for entry in CROP_KNOWLEDGE_BASE:
        if entry["crop"].lower() == crop_name.lower():
            return entry
    return None


def list_crops() -> list[str]:
    """Return list of all known crop names."""
    return [entry["crop"] for entry in CROP_KNOWLEDGE_BASE]
