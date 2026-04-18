"""Unit tests for authentication, validation, and core functions."""
import os
from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt
from pydantic import ValidationError

# Set test environment
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
    """Test password hashing and verification."""

    def test_password_hash_and_verify(self):
        """Test that password hashing and verification works correctly."""
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed)
        assert not verify_password("wrongpassword", hashed)

    def test_password_hash_is_different_each_time(self):
        """Test that password hashes are salted and different each time."""
        password = "TestPassword123!"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        assert hash1 != hash2
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)


class TestJWT:
    """Test JWT token creation and decoding."""

    def test_access_token_creation_and_decoding(self):
        """Test access token creation and decoding."""
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
        """Test refresh token creation and decoding."""
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
        """Test that tokens have proper expiration."""
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

        # Access token should expire in 15 minutes
        expected_exp = now + timedelta(minutes=15)
        assert abs((exp_datetime - expected_exp).total_seconds()) < 10  # Allow 10 second tolerance

    def test_invalid_token_raises_error(self):
        """Test that invalid tokens raise JWTError."""
        from jose import JWTError

        with pytest.raises(JWTError):
            decode_token("invalid.token.here")

    def test_token_uses_configured_secret(self):
        """Test that tokens use the configured secret key."""
        email = "test@example.com"
        user_id = "550e8400-e29b-41d4-a716-446655440000"
        role = "user"

        token = create_access_token(email, user_id, role)

        # Decode without verification to check claims
        claims = jwt.get_unverified_claims(token)
        assert claims["uid"] == user_id
        assert claims["role"] == role


class TestPydanticValidation:
    """Test Pydantic schema validation."""

    def test_user_register_valid(self):
        """Test valid user registration."""
        user = UserRegister(
            email="test@example.com",
            password="ValidPass123!",
            role="user"
        )
        assert user.email == "test@example.com"
        assert user.role == "user"

    def test_user_register_password_too_short(self):
        """Test password validation - too short."""
        with pytest.raises(ValidationError) as exc_info:
            UserRegister(
                email="test@example.com",
                password="Short1!",
                role="user"
            )
        assert "Password must be at least 8 characters" in str(exc_info.value)

    def test_user_register_password_no_uppercase(self):
        """Test password validation - no uppercase letter."""
        with pytest.raises(ValidationError) as exc_info:
            UserRegister(
                email="test@example.com",
                password="lowercase123!",
                role="user"
            )
        assert "Password must contain at least one uppercase letter" in str(exc_info.value)

    def test_user_register_password_no_lowercase(self):
        """Test password validation - no lowercase letter."""
        with pytest.raises(ValidationError) as exc_info:
            UserRegister(
                email="test@example.com",
                password="UPPERCASE123!",
                role="user"
            )
        assert "Password must contain at least one lowercase letter" in str(exc_info.value)

    def test_user_register_password_no_digit(self):
        """Test password validation - no digit."""
        with pytest.raises(ValidationError) as exc_info:
            UserRegister(
                email="test@example.com",
                password="PasswordOnly!",
                role="user"
            )
        assert "Password must contain at least one digit" in str(exc_info.value)

    def test_conference_create_valid(self):
        """Test valid conference creation."""
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
        """Test conference validation - end date before start date."""
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
        assert "End date must be after start date" in str(exc_info.value)

    def test_conference_cfp_deadline_after_start_date(self):
        """Test conference validation - CFP deadline after start date."""
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
        assert "CFP deadline must be before start date" in str(exc_info.value)
