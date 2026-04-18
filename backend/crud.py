"""CRUD operations for users and conferences."""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session, joinedload

from models import Conference, User
from schemas import ConferenceCreate, ConferenceUpdate


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email."""
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: UUID) -> Optional[User]:
    """Get user by ID."""
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, email: str, hashed_password: str, role: str = "user") -> User:
    """Create a new user."""
    user = User(email=email, password_hash=hashed_password, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user_role(db: Session, user_id: UUID, new_role: str) -> Optional[User]:
    """Update user role."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    user.role = new_role
    db.commit()
    db.refresh(user)
    return user


def list_users(db: Session, skip: int = 0, limit: int = 100) -> Tuple[List[User], int]:
    """List users with pagination."""
    query = db.query(User)
    total = query.count()
    users = query.order_by(User.created_at).offset(skip).limit(limit).all()
    return users, total


def create_conference(db: Session, conference_data: ConferenceCreate, owner_id: UUID) -> Conference:
    """Create a new conference."""
    conference = Conference(
        title=conference_data.title,
        description=conference_data.description,
        start_date=conference_data.start_date,
        end_date=conference_data.end_date,
        location=conference_data.location,
        cfp_deadline=conference_data.cfp_deadline,
        category=conference_data.category,
        owner_id=owner_id,
    )
    db.add(conference)
    db.commit()
    db.refresh(conference)
    return conference


def get_conference(db: Session, conference_id: UUID) -> Optional[Conference]:
    """Get conference by ID."""
    return db.query(Conference).filter(Conference.id == conference_id).first()


def list_conferences(
    db: Session,
    skip: int = 0,
    limit: int = 10,
    search: Optional[str] = None,
    category: Optional[str] = None,
    sort_by: str = "start_date",
    sort_order: str = "asc",
) -> Tuple[List[Conference], int]:
    """List conferences with filters and pagination."""
    query = db.query(Conference).options(joinedload(Conference.owner))

    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Conference.title.ilike(search_term),
                Conference.description.ilike(search_term),
                Conference.location.ilike(search_term),
            )
        )

    # Apply category filter
    if category:
        query = query.filter(Conference.category == category)

    # Get total count
    total = query.count()

    # Apply sorting
    if sort_by == "start_date":
        order_column = Conference.start_date
    elif sort_by == "created_at":
        order_column = Conference.created_at
    else:
        order_column = Conference.start_date

    if sort_order == "desc":
        query = query.order_by(desc(order_column))
    else:
        query = query.order_by(order_column)

    # Apply pagination
    conferences = query.offset(skip).limit(limit).all()
    return conferences, total


def update_conference(db: Session, conference_id: UUID, update_data: ConferenceUpdate) -> Optional[Conference]:
    """Update conference."""
    conference = db.query(Conference).filter(Conference.id == conference_id).first()
    if not conference:
        return None

    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(conference, key, value)

    db.commit()
    db.refresh(conference)
    return conference


def delete_conference(db: Session, conference_id: UUID) -> bool:
    """Delete conference."""
    conference = db.query(Conference).filter(Conference.id == conference_id).first()
    if not conference:
        return False
    db.delete(conference)
    db.commit()
    return True


def list_conferences_by_owner(db: Session, owner_id: UUID) -> List[Conference]:
    """List conferences by owner."""
    return (
        db.query(Conference)
        .filter(Conference.owner_id == owner_id)
        .order_by(desc(Conference.created_at))
        .all()
    )


def list_all_conferences_admin(db: Session, skip: int = 0, limit: int = 100) -> Tuple[List[Conference], int]:
    """List all conferences for admin."""
    query = db.query(Conference)
    total = query.count()
    conferences = query.order_by(desc(Conference.created_at)).offset(skip).limit(limit).all()
    return conferences, total
