"""Main FastAPI application for Event Discovery Service."""
import os
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy import text
from sqlalchemy.orm import Session

from admin import router as admin_router
from auth import authenticate_user, create_access_token, create_refresh_token, decode_token, get_current_user, get_password_hash, require_admin, verify_password
from cache import get_cached, get_redis_client, invalidate_conferences, make_cache_key, set_cached
from crud import create_conference, create_user, delete_conference, get_conference, get_user_by_email, get_user_by_id, list_conferences, list_conferences_by_owner, update_conference
from database import get_db, Base, engine
from middleware import LoggingMiddleware, PrometheusMiddleware, RateLimitMiddleware, SecurityHeadersMiddleware
from schemas import ConferenceCreate, ConferenceOut, ConferenceUpdate, LoginRequest, PaginatedConferences, TokenPair, TokenRefreshRequest, UserOut, UserRegister


def get_cors_origins() -> List[str]:
    origins = os.getenv("FRONTEND_ORIGINS", os.getenv("FRONTEND_ORIGIN", "http://localhost:3000"))
    return [origin.strip() for origin in origins.split(",") if origin.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Event Discovery Service",
    description="API for discovering and managing scientific conferences",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(PrometheusMiddleware)

Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)
app.include_router(admin_router, prefix="/admin", tags=["admin"])


@app.get("/health")
def health_check():
    db_status = "ok"
    redis_status = "ok"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"
    try:
        redis_client = get_redis_client()
        if not redis_client:
            raise RuntimeError("Redis unavailable")
        redis_client.ping()
    except Exception:
        redis_status = "error"
    overall = "healthy" if db_status == "ok" and redis_status == "ok" else "error"
    return {"status": overall, "db": db_status, "redis": redis_status}


@app.get("/")
def root():
    return {
        "service": "Event Discovery API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "metrics": "/metrics",
    }


@app.post("/auth/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    if get_user_by_email(db, user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user_data.password)
    user = create_user(db, user_data.email, hashed_password, user_data.role.value)
    return UserOut.from_orm(user)


@app.post("/auth/login", response_model=TokenPair)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(user.email, str(user.id), user.role.value)
    refresh_token = create_refresh_token(user.email, str(user.id), user.role.value)
    return TokenPair(access_token=access_token, refresh_token=refresh_token)


@app.post("/auth/refresh", response_model=TokenPair)
def refresh_token(token_data: TokenRefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(token_data.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user_id = payload.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    access_token = create_access_token(user.email, str(user.id), user.role.value)
    new_refresh_token = create_refresh_token(user.email, str(user.id), user.role.value)
    return TokenPair(access_token=access_token, refresh_token=new_refresh_token)


@app.get("/auth/me", response_model=UserOut)
def get_current_user_info(current_user: UserOut = Depends(get_current_user)):
    return current_user


@app.get("/conferences", response_model=PaginatedConferences)
def get_conferences(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    sort_by: str = Query("start_date", pattern="^(start_date|created_at)$"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    cache_key = make_cache_key("conferences", skip=skip, limit=limit, search=search, category=category, sort_by=sort_by, sort_order=sort_order)
    cached_result = get_cached(cache_key)
    if cached_result:
        return PaginatedConferences(**cached_result)

    conferences, total = list_conferences(
        db=db, skip=skip, limit=limit,
        search=search, category=category,
        sort_by=sort_by, sort_order=sort_order,
    )

    conference_dicts = []
    for conf in conferences:
        conf_dict = {
            'id': str(conf.id),
            'title': conf.title,
            'description': conf.description,
            'start_date': conf.start_date,
            'end_date': conf.end_date,
            'cfp_deadline': conf.cfp_deadline,
            'location': conf.location,
            'url': conf.url,
            'category': conf.category,
            'status': conf.status.value if hasattr(conf.status, 'value') else conf.status,
            'owner_id': str(conf.owner_id),
            'owner_email': conf.owner.email if conf.owner else None,
            'created_at': conf.created_at,
            'updated_at': conf.updated_at,
        }
        conference_dicts.append(conf_dict)

    result = PaginatedConferences(
        items=[ConferenceOut.model_validate(conf_dict) for conf_dict in conference_dicts],
        total=total,
        skip=skip,
        limit=limit,
    )
    set_cached(cache_key, result.model_dump())
    return result


@app.post("/conferences", response_model=ConferenceOut, status_code=status.HTTP_201_CREATED)
def create_new_conference(
    conference_data: ConferenceCreate,
    current_user: UserOut = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conference = create_conference(db, conference_data, current_user.id)
    invalidate_conferences()
    conf_dict = {
        'id': str(conference.id),
        'title': conference.title,
        'description': conference.description,
        'start_date': conference.start_date,
        'end_date': conference.end_date,
        'cfp_deadline': conference.cfp_deadline,
        'location': conference.location,
        'url': conference.url,
        'category': conference.category,
        'status': conference.status.value if hasattr(conference.status, 'value') else conference.status,
        'owner_id': str(conference.owner_id),
        'owner_email': conference.owner.email if conference.owner else None,
        'created_at': conference.created_at,
        'updated_at': conference.updated_at,
    }
    return ConferenceOut.model_validate(conf_dict)


@app.get("/conferences/{conference_id}", response_model=ConferenceOut)
def get_conference_by_id(conference_id: str, db: Session = Depends(get_db)):
    conference = get_conference(db, conference_id)
    if not conference:
        raise HTTPException(status_code=404, detail="Conference not found")
    conf_dict = {
        'id': str(conference.id),
        'title': conference.title,
        'description': conference.description,
        'start_date': conference.start_date,
        'end_date': conference.end_date,
        'cfp_deadline': conference.cfp_deadline,
        'location': conference.location,
        'url': conference.url,
        'category': conference.category,
        'status': conference.status.value if hasattr(conference.status, 'value') else conference.status,
        'owner_id': str(conference.owner_id),
        'owner_email': conference.owner.email if conference.owner else None,
        'created_at': conference.created_at,
        'updated_at': conference.updated_at,
    }
    return ConferenceOut.model_validate(conf_dict)


@app.put("/conferences/{conference_id}", response_model=ConferenceOut)
def update_existing_conference(
    conference_id: str,
    conference_data: ConferenceUpdate,
    current_user: UserOut = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conference = get_conference(db, conference_id)
    if not conference:
        raise HTTPException(status_code=404, detail="Conference not found")
    if str(conference.owner_id) != str(current_user.id) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this conference")
    updated = update_conference(db, conference_id, conference_data)
    invalidate_conferences()
    conf_dict = {
        'id': str(updated.id),
        'title': updated.title,
        'description': updated.description,
        'start_date': updated.start_date,
        'end_date': updated.end_date,
        'cfp_deadline': updated.cfp_deadline,
        'location': updated.location,
        'url': updated.url,
        'category': updated.category,
        'status': updated.status.value if hasattr(updated.status, 'value') else updated.status,
        'owner_id': str(updated.owner_id),
        'owner_email': updated.owner.email if updated.owner else None,
        'created_at': updated.created_at,
        'updated_at': updated.updated_at,
    }
    return ConferenceOut.model_validate(conf_dict)


@app.delete("/conferences/{conference_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_conference(
    conference_id: str,
    current_user: UserOut = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conference = get_conference(db, conference_id)
    if not conference:
        raise HTTPException(status_code=404, detail="Conference not found")
    if str(conference.owner_id) != str(current_user.id) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this conference")
    delete_conference(db, conference_id)
    invalidate_conferences()


@app.get("/users/me/conferences", response_model=List[ConferenceOut])
def get_my_conferences(
    current_user: UserOut = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conferences = list_conferences_by_owner(db, current_user.id)
    result = []
    for conf in conferences:
        conf_dict = {
            'id': str(conf.id),
            'title': conf.title,
            'description': conf.description,
            'start_date': conf.start_date,
            'end_date': conf.end_date,
            'cfp_deadline': conf.cfp_deadline,
            'location': conf.location,
            'url': conf.url,
            'category': conf.category,
            'status': conf.status.value if hasattr(conf.status, 'value') else conf.status,
            'owner_id': str(conf.owner_id),
            'owner_email': conf.owner.email if conf.owner else None,
            'created_at': conf.created_at,
            'updated_at': conf.updated_at,
        }
        result.append(ConferenceOut.model_validate(conf_dict))
    return result


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )