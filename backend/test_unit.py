"""Unit tests for authentication, validation, and core functions."""
import os
from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt
from pydantic import ValidationError

os.environ.setdefault("JWT_SECRET_KEY", "unit-test-secret-key-32-chars-minimum!")

from auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from schemas import ConferenceCreate, UserRegister


class TestPasswordHashing:
    def test_password_hash_and_verify(self):
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed)
        assert not verify_password("wrongpassword", hashed)

    def test_password_hash_is_different_each_time(self):
        password = "TestPassword123!"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        assert hash1 != hash2
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)


class TestJWT:
    def test_access_token_creation_and_decoding(self):
        email = "test@example.com"
        user_id = "550e8400-e29b-41d4-a716-446655440000"
        role = "user"
        token = create_access_token(email, user_id, role)
        payload = decode_token(token)
        assert payload["sub"] == email
        assert payload["uid"] == user_id
        assert payload["type"] == "access"
        assert payload["role"] == role

    def test_refresh_token_creation_and_decoding(self):
        email = "test@example.com"
        user_id = "550e8400-e29b-41d4-a716-446655440000"
        role = "admin"
        token = create_refresh_token(email, user_id, role)
        payload = decode_token(token)
        assert payload["sub"] == email
        assert payload["uid"] == user_id
        assert payload["type"] == "refresh"
        assert payload["role"] == role

    def test_token_expiration(self):
        email = "test@example.com"
        user_id = "550e8400-e29b-41d4-a716-446655440000"
        role = "user"
        token = create_access_token(email, user_id, role)
        payload = decode_token(token)
        exp = payload.get("exp")
        assert exp is not None
        exp_datetime = datetime.fromtimestamp(exp, tz=timezone.utc)
        now = datetime.now(timezone.utc)
        assert exp_datetime > now
        # Access token expires in 30 minutes
        expected_exp = now + timedelta(minutes=30)
        assert abs((exp_datetime - expected_exp).total_seconds()) < 60

    def test_invalid_token_raises_error(self):
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            decode_token("invalid.token.here")
        assert exc_info.value.status_code == 401

    def test_token_uses_configured_secret(self):
        email = "test@example.com"
        user_id = "550e8400-e29b-41d4-a716-446655440000"
        role = "user"
        token = create_access_token(email, user_id, role)
        claims = jwt.get_unverified_claims(token)
        assert claims["uid"] == user_id
        assert claims["role"] == role


class TestPydanticValidation:
    def test_user_register_valid(self):
        user = UserRegister(
            email="test@example.com",
            password="ValidPass123!",
            role="user"
        )
        assert user.email == "test@example.com"
        assert user.role == "user"

    def test_user_register_password_too_short(self):
        with pytest.raises(ValidationError) as exc_info:
            UserRegister(
                email="test@example.com",
                password="Short1!",
                role="user"
            )
        assert "Password must be at least 8 characters" in str(exc_info.value)

    def test_user_register_password_no_uppercase(self):
        with pytest.raises(ValidationError) as exc_info:
            UserRegister(
                email="test@example.com",
                password="lowercase123!",
                role="user"
            )
        assert "Password must contain at least one uppercase letter" in str(exc_info.value)

    def test_user_register_password_no_lowercase(self):
        with pytest.raises(ValidationError) as exc_info:
            UserRegister(
                email="test@example.com",
                password="UPPERCASE123!",
                role="user"
            )
        assert "Password must contain at least one lowercase letter" in str(exc_info.value)

    def test_user_register_password_no_digit(self):
        with pytest.raises(ValidationError) as exc_info:
            UserRegister(
                email="test@example.com",
                password="PasswordOnly!",
                role="user"
            )
        assert "Password must contain at least one digit" in str(exc_info.value)

    def test_conference_create_valid(self):
        start_date = datetime(2026, 6, 1, tzinfo=timezone.utc)
        end_date = datetime(2026, 6, 5, tzinfo=timezone.utc)
        cfp_deadline = datetime(2026, 5, 1, tzinfo=timezone.utc)
        conf = ConferenceCreate(
            title="Test Conference",
            description="A test conference",
            start_date=start_date,
            end_date=end_date,
            location="Test City",
            cfp_deadline=cfp_deadline,
            category="Computer Science"
        )
        assert conf.title == "Test Conference"
        assert conf.category == "Computer Science"

    def test_conference_end_date_before_start_date(self):
        start_date = datetime(2026, 6, 5, tzinfo=timezone.utc)
        end_date = datetime(2026, 6, 1, tzinfo=timezone.utc)
        cfp_deadline = datetime(2026, 5, 1, tzinfo=timezone.utc)
        with pytest.raises(ValidationError) as exc_info:
            ConferenceCreate(
                title="Test Conference",
                description="A test conference",
                start_date=start_date,
                end_date=end_date,
                location="Test City",
                cfp_deadline=cfp_deadline,
                category="Computer Science"
            )
        assert "start_date" in str(exc_info.value)

    def test_conference_cfp_deadline_after_start_date(self):
        start_date = datetime(2026, 6, 1, tzinfo=timezone.utc)
        end_date = datetime(2026, 6, 5, tzinfo=timezone.utc)
        cfp_deadline = datetime(2026, 6, 10, tzinfo=timezone.utc)
        with pytest.raises(ValidationError) as exc_info:
            ConferenceCreate(
                title="Test Conference",
                description="A test conference",
                start_date=start_date,
                end_date=end_date,
                location="Test City",
                cfp_deadline=cfp_deadline,
                category="Computer Science"
            )
        assert "start_date" in str(exc_info.value)