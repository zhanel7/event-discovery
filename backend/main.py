"""
Event Discovery Service — FastAPI приложение.
"""
import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jose import JWTError
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy.orm import Session

import cache
import crud
from admin import router as admin_router
from auth import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    get_password_hash,
    get_user_by_email,
    get_user_by_id,
    verify_password,
)
from database import Base, engine, get_db
from middleware import (
    RateLimitMiddleware,
    RequestLoggingMiddleware,
    SecurityHeadersMiddleware,
    setup_logging,
)
from models import User
from schemas import (
    ChangePasswordRequest,
    ConferenceCreate,
    ConferenceOut,
    ConferenceUpdate,
    LoginRequest,
    PaginatedConferences,
    Role,
    TokenPair,
    TokenRefreshRequest,
    UserOut,
    UserRegister,
)
def _cors_origins() -> list[str]:
    """CORS: FRONTEND_ORIGINS=url1,url2 или одно значение FRONTEND_ORIGIN."""
    multi = os.getenv("FRONTEND_ORIGINS", "").strip()
    if multi:
        return [o.strip() for o in multi.split(",") if o.strip()]
    return [os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")]


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Event Discovery Service",
    description="Поиск и управление научными конференциями",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(RequestLoggingMiddleware)

Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)

app.include_router(admin_router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "message": "Validation error"},
    )


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {
        "service": "Event Discovery API",
        "docs": "/docs",
        "health": "/health",
        "metrics": "/metrics",
    }


# --- Auth ---


@app.post("/auth/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(body: UserRegister, db: Session = Depends(get_db)):
    """Регистрация. Роль admin через API недоступна — только user."""
    if body.role != Role.user:
        raise HTTPException(
            status_code=400,
            detail="Only 'user' role is allowed for self-registration",
        )
    if get_user_by_email(db, body.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = crud.create_user(
        db,
        email=body.email,
        hashed_password=get_password_hash(body.password),
        role=Role.user.value,
    )
    return user


@app.post("/auth/login", response_model=TokenPair)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access = create_access_token(user.email, user.id, user.role)
    refresh = create_refresh_token(user.email, user.id, user.role)
    return TokenPair(access_token=access, refresh_token=refresh)


@app.post("/auth/refresh", response_model=TokenPair)
def refresh_token(body: TokenRefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        uid = payload.get("uid")
        email = payload.get("sub")
        if uid is None or email is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = get_user_by_id(db, uid)
    if not user or user.email != email:
        raise HTTPException(status_code=401, detail="User not found")
    access = create_access_token(user.email, user.id, user.role)
    refresh = create_refresh_token(user.email, user.id, user.role)
    return TokenPair(access_token=access, refresh_token=refresh)


@app.post("/auth/logout")
def logout():
    """JWT в header — выход на клиенте (очистка токенов)."""
    return {"detail": "Logged out on client; discard tokens"}


@app.get("/auth/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)):
    return current


@app.post("/auth/change-password")
def change_password(
    body: ChangePasswordRequest,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.current_password, current.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current.hashed_password = get_password_hash(body.new_password)
    db.add(current)
    db.commit()
    return {"detail": "Password updated"}


# --- Conferences (public list) ---


@app.get("/conferences", response_model=PaginatedConferences)
def list_conferences(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = Query(None),
    category: str | None = Query(None),
    sort: str = Query("asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    params = {
        "skip": skip,
        "limit": limit,
        "search": search,
        "category": category,
        "sort": sort,
    }
    key = cache.cache_key("conf_list", params)
    cached = cache.get_json(key)
    if cached:
        return PaginatedConferences(**cached)

    items, total = crud.list_conferences(db, skip, limit, search, category, sort)
    out = PaginatedConferences(
        items=[ConferenceOut.model_validate(i) for i in items],
        total=total,
        skip=skip,
        limit=limit,
    )
    cache.set_json(key, out.model_dump(mode="json"))
    return out


@app.post("/conferences", response_model=ConferenceOut, status_code=status.HTTP_201_CREATED)
def create_conference(
    body: ConferenceCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conf = crud.create_conference(db, body, current.id)
    cache.invalidate_conference_list()
    return conf


@app.get("/conferences/{conf_id}", response_model=ConferenceOut)
def get_conference(conf_id: int, db: Session = Depends(get_db)):
    conf = crud.get_conference(db, conf_id)
    if not conf:
        raise HTTPException(status_code=404, detail="Conference not found")
    return conf


@app.put("/conferences/{conf_id}", response_model=ConferenceOut)
def update_conference(
    conf_id: int,
    body: ConferenceUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conf = crud.get_conference(db, conf_id)
    if not conf:
        raise HTTPException(status_code=404, detail="Conference not found")
    if conf.user_id != current.id and current.role != Role.admin.value:
        raise HTTPException(status_code=403, detail="Not allowed to edit this conference")
    try:
        updated = crud.update_conference(db, conf_id, body)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    cache.invalidate_conference_list()
    return updated


@app.delete("/conferences/{conf_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conference(
    conf_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conf = crud.get_conference(db, conf_id)
    if not conf:
        raise HTTPException(status_code=404, detail="Conference not found")
    if conf.user_id != current.id and current.role != Role.admin.value:
        raise HTTPException(status_code=403, detail="Not allowed to delete this conference")
    crud.delete_conference(db, conf_id)
    cache.invalidate_conference_list()


# --- Profile: мои конференции ---


@app.get("/users/me/conferences", response_model=list[ConferenceOut])
def my_conferences(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.list_conferences_by_user(db, current.id)
