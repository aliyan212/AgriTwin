"""Farm management router — CRUD for farms and crops."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Crop, Farm, User
from app.routers.auth import get_optional_current_user
from app.schemas import CropCreate, CropResponse, FarmCreate, FarmResponse
import warabandi_engine
import crop_knowledge

router = APIRouter(prefix="/farms", tags=["farms"])


# ── Farm CRUD ─────────────────────────────────────────────────────────────────
@router.post("/", response_model=FarmResponse, status_code=201)
def create_farm(
    payload: FarmCreate,
    user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Create a new farm assigned to current authenticated user."""
    data = payload.model_dump()
    if not data.get("canal_name"):
        data["canal_name"] = warabandi_engine.infer_canal_from_location(
            district=data.get("district"),
            lat=data.get("latitude"),
            lon=data.get("longitude"),
        )
    user_id = user.id if user else 1
    farm = Farm(user_id=user_id, **data)
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


@router.get("/", response_model=list[FarmResponse])
def list_farms(
    user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """List farms based on role: Officers see all Punjab farms; Farmers see their own."""
    if user and user.role == "extension_officer":
        return db.query(Farm).all()
    elif user:
        user_farms = db.query(Farm).filter(Farm.user_id == user.id).all()
        return user_farms if user_farms else db.query(Farm).all()
    return db.query(Farm).all()


@router.get("/{farm_id}", response_model=FarmResponse)
def get_farm(farm_id: int, db: Session = Depends(get_db)):
    farm = db.query(Farm).get(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm


@router.delete("/{farm_id}", status_code=204)
def delete_farm(
    farm_id: int,
    user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Delete a farm node. Restricted for Extension Officers (read-only audit)."""
    if user and user.role == "extension_officer":
        raise HTTPException(
            status_code=403,
            detail="Field deletion is restricted to registered landowners (Farmer Mode only).",
        )
    farm = db.query(Farm).get(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    db.delete(farm)
    db.commit()


# ── Crop CRUD ─────────────────────────────────────────────────────────────────
@router.post("/{farm_id}/crops", response_model=CropResponse, status_code=201)
def add_crop(farm_id: int, payload: CropCreate, db: Session = Depends(get_db)):
    farm = db.query(Farm).get(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    data = payload.model_dump()
    if not data.get("growth_stage") and data.get("sowing_date"):
        stage_info = crop_knowledge.derive_growth_stage(data["crop_name"], data["sowing_date"])
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
            stage_info = crop_knowledge.derive_growth_stage(c.crop_name, c.sowing_date)
            if c.growth_stage != stage_info["stage"]:
                c.growth_stage = stage_info["stage"]
                db.add(c)
    db.commit()
    return crops
