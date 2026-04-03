"""Операции с БД."""
from typing import Optional, Tuple

from sqlalchemy import asc, desc, func, or_
from sqlalchemy.orm import Session

from models import Conference, User
from schemas import ConferenceCreate, ConferenceUpdate


def create_user(db: Session, email: str, hashed_password: str, role: str = "user") -> User:
    user = User(email=email, hashed_password=hashed_password, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def list_users(db: Session, skip: int = 0, limit: int = 100) -> Tuple[list[User], int]:
    q = db.query(User)
    total = q.count()
    items = q.order_by(User.id).offset(skip).limit(limit).all()
    return items, total


def update_user_role(db: Session, user_id: int, new_role: str) -> Optional[User]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    user.role = new_role
    db.commit()
    db.refresh(user)
    return user


def create_conference(db: Session, data: ConferenceCreate, user_id: int) -> Conference:
    conf = Conference(
        title=data.title,
        description=data.description or "",
        start_date=data.start_date,
        end_date=data.end_date,
        location=data.location or "",
        cfp_deadline=data.cfp_deadline,
        category=data.category or "",
        user_id=user_id,
    )
    db.add(conf)
    db.commit()
    db.refresh(conf)
    return conf


def get_conference(db: Session, conf_id: int) -> Optional[Conference]:
    return db.query(Conference).filter(Conference.id == conf_id).first()


def list_conferences(
    db: Session,
    skip: int,
    limit: int,
    search: Optional[str],
    category: Optional[str],
    sort: str,
) -> Tuple[list[Conference], int]:
    q = db.query(Conference)
    if search:
        term = f"%{search.strip()}%"
        q = q.filter(
            or_(
                Conference.title.ilike(term),
                Conference.description.ilike(term),
            )
        )
    if category:
        q = q.filter(Conference.category == category)

    total = q.count()
    order = asc(Conference.start_date) if sort == "asc" else desc(Conference.start_date)
    items = q.order_by(order).offset(skip).limit(limit).all()
    return items, total


def update_conference(
    db: Session, conf_id: int, data: ConferenceUpdate
) -> Optional[Conference]:
    conf = get_conference(db, conf_id)
    if not conf:
        return None
    payload = data.model_dump(exclude_unset=True)
    if "start_date" in payload and "end_date" in payload:
        if payload["end_date"] < payload["start_date"]:
            raise ValueError("end_date must be >= start_date")
    elif "end_date" in payload and conf.start_date:
        if payload["end_date"] < conf.start_date:
            raise ValueError("end_date must be >= start_date")
    elif "start_date" in payload and conf.end_date:
        if conf.end_date < payload["start_date"]:
            raise ValueError("end_date must be >= start_date")
    for k, v in payload.items():
        setattr(conf, k, v)
    db.commit()
    db.refresh(conf)
    return conf


def delete_conference(db: Session, conf_id: int) -> bool:
    conf = get_conference(db, conf_id)
    if not conf:
        return False
    db.delete(conf)
    db.commit()
    return True


def list_conferences_by_user(db: Session, user_id: int) -> list[Conference]:
    return (
        db.query(Conference)
        .filter(Conference.user_id == user_id)
        .order_by(desc(Conference.start_date))
        .all()
    )


def list_all_conferences_admin(db: Session, skip: int, limit: int) -> Tuple[list[Conference], int]:
    total = db.query(func.count(Conference.id)).scalar() or 0
    items = (
        db.query(Conference)
        .order_by(desc(Conference.id))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return items, total
