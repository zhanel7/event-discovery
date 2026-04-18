"""SQLAlchemy модели для Event Discovery Service."""
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import uuid4

from database import Base
from sqlalchemy import Boolean, Column, DateTime, Enum as SQLEnum, ForeignKey, Index, String, Text, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Role(Enum):
    user = "user"
    admin = "admin"


class ConferenceStatus(Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    role: Mapped[Role] = mapped_column(SQLEnum(Role), nullable=False, default=Role.user)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    conferences: Mapped[list["Conference"]] = relationship("Conference", back_populates="owner", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role.value} active={self.is_active}>"


class Conference(Base):
    __tablename__ = "conferences"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    cfp_deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    status: Mapped[ConferenceStatus] = mapped_column(SQLEnum(ConferenceStatus), nullable=False, default=ConferenceStatus.published)
    owner_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    owner: Mapped["User"] = relationship("User", back_populates="conferences")

    def __repr__(self) -> str:
        return f"<Conference id={self.id} title={self.title} status={self.status.value} owner_id={self.owner_id}>"


# Индексы
Index("idx_conferences_owner_id", Conference.owner_id)
Index("idx_conferences_category", Conference.category)
Index("idx_conferences_start_date", Conference.start_date)
Index("idx_conferences_created_at", Conference.created_at)


def create_tables(engine):
    """Создаёт все таблицы в базе данных."""
    Base.metadata.create_all(bind=engine)
