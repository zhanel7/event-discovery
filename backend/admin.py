"""Admin routes for managing users and conferences."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth import require_admin
from cache import invalidate_conferences
from crud import delete_conference, list_all_conferences_admin, list_users, update_user_role
from database import get_db
from schemas import ConferenceOut, RoleUpdateRequest, UserOut

router = APIRouter()


@router.get("/users", response_model=List[UserOut])
def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    """Get all users (admin only)."""
    users, _ = list_users(db, skip=skip, limit=limit)
    return [UserOut.from_orm(user) for user in users]


@router.put("/users/{user_id}/role", response_model=UserOut)
def update_user_role_endpoint(
    user_id: str,
    role_update: RoleUpdateRequest,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    """Update user role (admin only)."""
    try:
        from uuid import UUID
        uid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid user ID format")

    # Check if trying to demote the last admin
    if role_update.role == "user":
        from crud import get_user_by_id
        user = get_user_by_id(db, uid)
        if user and user.role == "admin":
            from sqlalchemy import func
            from models import User
            admin_count = db.query(func.count(User.id)).filter(User.role == "admin").scalar()
            if admin_count <= 1:
                raise HTTPException(status_code=400, detail="Cannot demote the last administrator")

    updated_user = update_user_role(db, uid, role_update.role)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserOut.from_orm(updated_user)


@router.get("/conferences", response_model=List[ConferenceOut])
def get_all_conferences(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    """Get all conferences (admin only)."""
    conferences, _ = list_all_conferences_admin(db, skip=skip, limit=limit)
    return [ConferenceOut.from_orm(conf) for conf in conferences]


@router.delete("/conferences/{conference_id}")
def delete_conference_admin(
    conference_id: str,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    """Delete any conference (admin only)."""
    try:
        from uuid import UUID
        conf_id = UUID(conference_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid conference ID format")

    success = delete_conference(db, conf_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conference not found")

    invalidate_conferences()
    return {"detail": "Conference deleted"}
