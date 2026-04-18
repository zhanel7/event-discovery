"""Pydantic v2 схемы для Event Discovery Service."""
import re
from datetime import datetime
from enum import Enum
from typing import Generic, List, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, HttpUrl, ValidationError, field_validator, model_validator


T = TypeVar('T')


class Role(str, Enum):
    user = "user"
    admin = "admin"


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., max_length=128)

    @field_validator('password')
    @classmethod
    def password_strength(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(ch.isupper() for ch in value):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(ch.islower() for ch in value):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(ch.isdigit() for ch in value):
            raise ValueError('Password must contain at least one digit')
        return value


class UserRegister(UserCreate):
    role: Role = Role.user


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: Role
    created_at: datetime
    updated_at: datetime
    is_active: bool

    model_config = {'from_attributes': True}

    @field_validator('id', mode='before')
    @classmethod
    def cast_id(cls, value):
        if isinstance(value, UUID):
            return str(value)
        return value


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
    new_password: str = Field(..., max_length=128)

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError('New password must be at least 8 characters')
        if not any(ch.isupper() for ch in value):
            raise ValueError('New password must contain at least one uppercase letter')
        if not any(ch.islower() for ch in value):
            raise ValueError('New password must contain at least one lowercase letter')
        if not any(ch.isdigit() for ch in value):
            raise ValueError('New password must contain at least one digit')
        return value


class RoleUpdate(BaseModel):
    role: Role


class ConferenceCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    cfp_deadline: Optional[datetime] = None
    location: Optional[str] = None
    url: Optional[HttpUrl] = None
    category: Optional[str] = None

    @field_validator('end_date')
    @classmethod
    def validate_end_date(cls, value: datetime, info) -> datetime:
        start_date = info.data.get('start_date')
        if start_date and value <= start_date:
            raise ValueError('End date must be after start_date')
        return value

    @field_validator('cfp_deadline')
    @classmethod
    def validate_cfp_deadline(cls, value: datetime, info) -> datetime:
        start_date = info.data.get('start_date')
        if start_date and value >= start_date:
            raise ValueError('CFP deadline must be before start_date')
        return value


class ConferenceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    cfp_deadline: Optional[datetime] = None
    location: Optional[str] = None
    url: Optional[HttpUrl] = None
    category: Optional[str] = None

    @field_validator('end_date')
    @classmethod
    def validate_end_date(cls, value: datetime, info) -> datetime:
        start_date = info.data.get('start_date')
        if start_date and value <= start_date:
            raise ValueError('End date must be after start_date')
        return value

    @field_validator('cfp_deadline')
    @classmethod
    def validate_cfp_deadline(cls, value: datetime, info) -> datetime:
        start_date = info.data.get('start_date')
        if start_date and value >= start_date:
            raise ValueError('CFP deadline must be before start_date')
        return value


class ConferenceResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    start_date: datetime
    end_date: datetime
    cfp_deadline: Optional[datetime]
    location: Optional[str]
    url: Optional[str]
    category: Optional[str]
    status: str
    owner_id: str
    owner_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {'from_attributes': True}

    @field_validator('id', 'owner_id', mode='before')
    @classmethod
    def cast_ids(cls, value):
        if isinstance(value, UUID):
            return str(value)
        return value

    @model_validator(mode='before')
    @classmethod
    def set_owner_email(cls, data):
        if isinstance(data, dict):
            if 'owner_email' not in data or data['owner_email'] is None:
                owner = data.get('owner')
                if owner and isinstance(owner, dict) and 'email' in owner:
                    data['owner_email'] = owner['email']
                elif hasattr(owner, 'email'):
                    data['owner_email'] = owner.email
        return data


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    skip: int
    limit: int


class UserOut(UserResponse):
    pass


class ConferenceOut(ConferenceResponse):
    pass


class RoleUpdateRequest(RoleUpdate):
    pass


class PaginatedConferences(PaginatedResponse[ConferenceOut]):
    pass
