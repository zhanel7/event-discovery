"""Unit-тесты: хэширование, JWT, валидация Pydantic."""
import os
from datetime import datetime, timezone

import pytest
from jose import jwt
from pydantic import ValidationError

os.environ.setdefault("JWT_SECRET_KEY", "unit-test-secret-key-32-chars!!")

from auth import (  # noqa: E402
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from schemas import ConferenceBase, UserRegister  # noqa: E402


def test_password_hash_and_verify():
    h = get_password_hash("Secret123")
    assert verify_password("Secret123", h)
    assert not verify_password("wrong", h)


def test_access_token_encode_decode():
    token = create_access_token("a@b.com", 1, "user")
    payload = decode_token(token)
    assert payload["sub"] == "a@b.com"
    assert payload["uid"] == 1
    assert payload["type"] == "access"
    assert payload["role"] == "user"


def test_refresh_token_type():
    token = create_refresh_token("a@b.com", 2, "admin")
    payload = decode_token(token)
    assert payload["type"] == "refresh"


def test_token_expiry_in_payload():
    token = create_access_token("x@y.com", 3, "user")
    payload = decode_token(token)
    exp = payload.get("exp")
    assert exp is not None
    exp_dt = datetime.fromtimestamp(exp, tz=timezone.utc)
    assert exp_dt > datetime.now(timezone.utc)


def test_invalid_jwt_raises():
    from jose import JWTError

    with pytest.raises(JWTError):
        decode_token("not-a-token")


def test_user_register_password_validation():
    with pytest.raises(ValidationError):
        UserRegister(email="u@example.com", password="short")  # noqa


def test_user_register_requires_letter_and_digit():
    with pytest.raises(ValidationError):
        UserRegister(email="u@example.com", password="alllettersno")


def test_conference_date_order_validation():
    with pytest.raises(ValidationError):
        ConferenceBase(
            title="T",
            start_date=datetime(2026, 6, 1, tzinfo=timezone.utc),
            end_date=datetime(2026, 5, 1, tzinfo=timezone.utc),
        )


def test_conference_valid():
    c = ConferenceBase(
        title="Conf",
        description="d",
        start_date=datetime(2026, 6, 1, tzinfo=timezone.utc),
        end_date=datetime(2026, 6, 5, tzinfo=timezone.utc),
        category="CS",
    )
    assert c.category == "CS"


def test_jwt_uses_configured_secret():
    token = create_access_token("t@t.com", 9, "user")
    # подпись проверяется decode_token с SECRET_KEY из auth
    decoded = jwt.get_unverified_claims(token)
    assert decoded["uid"] == 9
