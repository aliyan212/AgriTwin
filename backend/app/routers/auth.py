"""Authentication router — JWT register, login, and token dependency with cookie & Bearer support."""

import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordBearer
import bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_PREFIX}/auth/login", auto_error=False
)


# ── Helpers ───────────────────────────────────────────────────────────────────
def _hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _create_token(user_id: int, expires_minutes: int | None = None) -> str:
    exp = datetime.datetime.now(datetime.UTC) + datetime.timedelta(
        minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return jwt.encode(
        {"sub": str(user_id), "exp": exp},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def _extract_token(request: Request, bearer_token: str | None) -> str | None:
    """Extract token from Authorization header or from HttpOnly agri_session cookie."""
    if bearer_token:
        return bearer_token
    # Fallback to cookie
    return request.cookies.get("agri_session")


# ── Dependencies ─────────────────────────────────────────────────────────────
def get_current_user(
    request: Request,
    token: Annotated[str | None, Depends(oauth2_scheme)] = None,
    db: Session = Depends(get_db),
) -> User:
    """Decode JWT and return the authenticated user, or raise 401."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    jwt_token = _extract_token(request, token)
    if not jwt_token:
        raise credentials_exception

    try:
        payload = jwt.decode(jwt_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str | None = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(User).get(user_id)
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def get_optional_current_user(
    request: Request,
    token: Annotated[str | None, Depends(oauth2_scheme)] = None,
    db: Session = Depends(get_db),
) -> User | None:
    """Decode JWT if token is present (header or cookie), else return None without 401 error."""
    jwt_token = _extract_token(request, token)
    if not jwt_token:
        return None
    try:
        payload = jwt.decode(jwt_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str | None = payload.get("sub")
        if user_id_str is None:
            return None
        user_id = int(user_id_str)
        user = db.query(User).get(user_id)
        if user and user.is_active:
            return user
    except Exception:
        return None
    return None


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.post("/register", response_model=UserResponse, status_code=201)
def register(
    payload: UserCreate,
    response: Response,
    db: Session = Depends(get_db),
):
    """Register a new user and set secure auth cookie."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        role=payload.role or "farmer",
        hashed_password=_hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = _create_token(user.id)
    response.set_cookie(
        key="agri_session",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=86400 * 7,
        path="/",
    )
    return user


@router.post("/login")
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """Authenticate, issue JWT access token, and set HttpOnly session cookie."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not _verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    token = _create_token(user.id)
    response.set_cookie(
        key="agri_session",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=86400 * 7,
        path="/",
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role or "farmer",
        },
    }


@router.post("/logout")
def logout(response: Response):
    """Clear the session cookie."""
    response.delete_cookie(key="agri_session", path="/")
    return {"status": "ok", "message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return user
