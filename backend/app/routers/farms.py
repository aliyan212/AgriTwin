"""Farm management router — CRUD for farms and crops."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Crop, Farm
from app.routers.auth import get_current_user
from app.schemas import CropCreate, CropResponse, FarmCreate, FarmResponse

router = APIRouter(prefix="/farms", tags=["farms"])


def _get_user_id(user=None) -> int:
    """Extract user_id from JWT user if present, else default to 1."""
    return user.id if user else 1


# ── Farm CRUD ─────────────────────────────────────────────────────────────────
@router.post("/", response_model=FarmResponse, status_code=201)
def create_farm(payload: FarmCreate, db: Session = Depends(get_db)):
    """Create a new farm. Uses user_id=1 until auth is wired."""
    farm = Farm(user_id=1, **payload.model_dump())
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


@router.get("/", response_model=list[FarmResponse])
def list_farms(db: Session = Depends(get_db)):
    """List all farms (user_id=1 until auth is wired)."""
    return db.query(Farm).filter(Farm.user_id == 1).all()


@router.get("/{farm_id}", response_model=FarmResponse)
def get_farm(farm_id: int, db: Session = Depends(get_db)):
    farm = db.query(Farm).get(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm


@router.delete("/{farm_id}", status_code=204)
def delete_farm(farm_id: int, db: Session = Depends(get_db)):
    farm = db.query(Farm).get(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    db.delete(farm)
    db.commit()


from crop_knowledge import derive_growth_stage


# ── Crop CRUD ─────────────────────────────────────────────────────────────────
@router.post("/{farm_id}/crops", response_model=CropResponse, status_code=201)
def add_crop(farm_id: int, payload: CropCreate, db: Session = Depends(get_db)):
    farm = db.query(Farm).get(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    data = payload.model_dump()
    if not data.get("growth_stage") and data.get("sowing_date"):
        stage_info = derive_growth_stage(data["crop_name"], data["sowing_date"])
        data["growth_stage"] = stage_info["stage"]
    crop = Crop(farm_id=farm_id, **data)
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return crop


@router.get("/{farm_id}/crops", response_model=list[CropResponse])
def list_crops(farm_id: int, db: Session = Depends(get_db)):
    crops = db.query(Crop).filter(Crop.farm_id == farm_id).all()
    # Dynamic sync of current growth stage based on elapsed days
    for c in crops:
        if c.sowing_date:
            stage_info = derive_growth_stage(c.crop_name, c.sowing_date)
            if c.growth_stage != stage_info["stage"]:
                c.growth_stage = stage_info["stage"]
                db.add(c)
    db.commit()
    return crops
