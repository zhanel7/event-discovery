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
    """Get CORS origins from environment."""
    origins = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000")
    return [origin.strip() for origin in origins.split(",") if origin.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Event Discovery Service",
    description="API for discovering and managing scientific conferences",
    version="1.0.0",
    lifespan=lifespan,
)

# Add middleware
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

# Add Prometheus metrics
Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)

# Include admin router
app.include_router(admin_router, prefix="/admin", tags=["admin"])


@app.get("/health")
def health_check():
    """Health check endpoint."""
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

    status = "healthy" if db_status == "ok" and redis_status == "ok" else "error"
    return {"status": status, "db": db_status, "redis": redis_status}


@app.get("/")
def root():
    """Root endpoint with API information."""
    return {
        "service": "Event Discovery API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "metrics": "/metrics",
    }


# Authentication endpoints
@app.post("/auth/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user."""
    if get_user_by_email(db, user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user_data.password)
    user = create_user(db, user_data.email, hashed_password, user_data.role.value)
    return UserOut.from_orm(user)


@app.post("/auth/login", response_model=TokenPair)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return tokens."""
    user = authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(user.email, str(user.id), user.role.value)
    refresh_token = create_refresh_token(user.email, str(user.id), user.role.value)

    return TokenPair(access_token=access_token, refresh_token=refresh_token)


@app.post("/auth/refresh", response_model=TokenPair)
def refresh_token(token_data: TokenRefreshRequest, db: Session = Depends(get_db)):
    """Refresh access token using refresh token."""
    payload = decode_token(token_data.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = payload.get("uid")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    try:
        from uuid import UUID

        uid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    user = get_user_by_id(db, uid)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    access_token = create_access_token(user.email, str(user.id), user.role)
    refresh_token = create_refresh_token(user.email, str(user.id), user.role)
    return TokenPair(access_token=access_token, refresh_token=refresh_token)


@app.get("/auth/me", response_model=UserOut)
def get_current_user_info(current_user: UserOut = Depends(get_current_user)):
    """Get current user information."""
    return current_user


# Conference endpoints
@app.get("/conferences", response_model=PaginatedConferences)
def get_conferences(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    sort_by: str = Query("start_date", regex="^(start_date|created_at)$"),
    sort_order: str = Query("asc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    """Get paginated list of conferences with optional filters."""
    cache_key = make_cache_key("conferences", skip=skip, limit=limit, search=search, category=category, sort_by=sort_by, sort_order=sort_order)
    cached_result = get_cached(cache_key)

    if cached_result:
        return PaginatedConferences(**cached_result)

    conferences, total = list_conferences(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        category=category,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    # Convert conferences to dict with owner_email
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
    """Create a new conference."""
    conference = create_conference(db, conference_data, current_user.id)
    invalidate_conferences()
    return ConferenceOut.from_orm(conference)


@app.get("/conferences/{conference_id}", response_model=ConferenceOut)
def get_conference_by_id(conference_id: str, db: Session = Depends(get_db)):
    """Get a specific conference by ID."""
    try:
        from uuid import UUID
        conf_id = UUID(conference_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid conference ID format")

    conference = get_conference(db, conf_id)
    if not conference:
        raise HTTPException(status_code=404, detail="Conference not found")

    return ConferenceOut.from_orm(conference)


@app.put("/conferences/{conference_id}", response_model=ConferenceOut)
def update_existing_conference(
    conference_id: str,
    conference_data: ConferenceUpdate,
    current_user: UserOut = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an existing conference."""
    try:
        from uuid import UUID
        conf_id = UUID(conference_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid conference ID format")

    conference = get_conference(db, conf_id)
    if not conference:
        raise HTTPException(status_code=404, detail="Conference not found")

    if conference.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this conference")

    updated_conference = update_conference(db, conf_id, conference_data)
    invalidate_conferences()
    return ConferenceOut.from_orm(updated_conference)


@app.delete("/conferences/{conference_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_conference(
    conference_id: str,
    current_user: UserOut = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a conference."""
    try:
        from uuid import UUID
        conf_id = UUID(conference_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid conference ID format")

    conference = get_conference(db, conf_id)
    if not conference:
        raise HTTPException(status_code=404, detail="Conference not found")

    if conference.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this conference")

    delete_conference(db, conf_id)
    invalidate_conferences()


@app.get("/users/me/conferences", response_model=List[ConferenceOut])
def get_my_conferences(
    current_user: UserOut = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get conferences created by the current user."""
    conferences = list_conferences_by_owner(db, current_user.id)
    return [ConferenceOut.from_orm(conf) for conf in conferences]


# Error handlers
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
