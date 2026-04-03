"""Админ-роуты: пользователи и конференции."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

import cache
import crud
from auth import get_current_admin
from database import get_db
from models import User
from schemas import ConferenceOut, RoleUpdateRequest, UserOut

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[UserOut])
def admin_list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    items, _ = crud.list_users(db, skip=skip, limit=limit)
    return items


@router.put("/users/{user_id}/role", response_model=UserOut)
def admin_update_role(
    user_id: int,
    body: RoleUpdateRequest,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.role == "admin" and body.role.value == "user":
        admin_count = db.query(User).filter(User.role == "admin").count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot demote the last administrator",
            )
    u = crud.update_user_role(db, user_id, body.role.value)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return u


@router.get("/conferences", response_model=list[ConferenceOut])
def admin_list_conferences(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    items, _ = crud.list_all_conferences_admin(db, skip=skip, limit=limit)
    return items


@router.delete("/conferences/{conf_id}", status_code=204)
def admin_delete_conference(
    conf_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    ok = crud.delete_conference(db, conf_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Conference not found")
    cache.invalidate_conference_list()
