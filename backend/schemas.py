"""Pydantic-схемы (валидация API)."""
import re
from datetime import datetime
from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class Role(str, Enum):
    user = "user"
    admin = "admin"


class UserBase(BaseModel):
    email: EmailStr


class UserRegister(UserBase):
    password: str = Field(..., min_length=8, max_length=128)
    role: Role = Role.user

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("Password must contain at least one letter and one digit")
        return v


class UserCreate(UserBase):
    password: str
    role: Role = Role.user


class UserOut(BaseModel):
    id: int
    email: str
    role: str

    model_config = {"from_attributes": True}


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def new_password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("New password must contain at least one letter and one digit")
        return v


class RoleUpdateRequest(BaseModel):
    role: Role


class ConferenceBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: str = ""
    start_date: datetime
    end_date: datetime
    location: str = ""
    cfp_deadline: Optional[datetime] = None
    category: str = ""

    @model_validator(mode="after")
    def check_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date must be >= start_date")
        return self


class ConferenceCreate(ConferenceBase):
    pass


class ConferenceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    cfp_deadline: Optional[datetime] = None
    category: Optional[str] = None


class ConferenceOut(BaseModel):
    id: int
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    location: str
    cfp_deadline: Optional[datetime]
    category: str
    user_id: int

    model_config = {"from_attributes": True}


class PaginatedConferences(BaseModel):
    items: list[ConferenceOut]
    total: int
    skip: int
    limit: int


SortOrder = Literal["asc", "desc"]
