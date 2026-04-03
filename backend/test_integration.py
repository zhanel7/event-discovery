"""
Интеграционные тесты API (SQLite in-memory, патч движка БД до импорта приложения).
"""
import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["JWT_SECRET_KEY"] = "integration-test-secret-key-32b"
os.environ["FRONTEND_ORIGIN"] = "http://localhost:3000"
os.environ["REDIS_URL"] = "redis://127.0.0.1:59999/0"

import database  # noqa: E402
from database import Base  # noqa: E402

_test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
database.engine = _test_engine
database.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_test_engine)

from main import app  # noqa: E402


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=_test_engine)
    Base.metadata.create_all(bind=_test_engine)
    yield
    Base.metadata.drop_all(bind=_test_engine)


@pytest.fixture
def client():
    return TestClient(app)


def _register(client, email="u1@test.com", password="Pass12345"):
    r = client.post(
        "/auth/register",
        json={"email": email, "password": password, "role": "user"},
    )
    assert r.status_code == 201, r.text
    return r.json()


def _login(client, email="u1@test.com", password="Pass12345"):
    r = client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()


def test_root_and_docs(client):
    r = client.get("/")
    assert r.status_code == 200
    assert "docs" in r.json()
    r2 = client.get("/docs")
    assert r2.status_code == 200


def test_register_and_login(client):
    _register(client)
    data = _login(client)
    assert "access_token" in data and "refresh_token" in data


def test_me_requires_auth(client):
    r = client.get("/auth/me")
    assert r.status_code == 401


def test_me_with_token(client):
    _register(client)
    tok = _login(client)["access_token"]
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200
    assert r.json()["email"] == "u1@test.com"


def test_create_and_list_conferences(client):
    _register(client)
    tok = _login(client)["access_token"]
    h = {"Authorization": f"Bearer {tok}"}
    body = {
        "title": "ICML",
        "description": "Machine learning",
        "start_date": "2026-07-01T00:00:00+00:00",
        "end_date": "2026-07-05T00:00:00+00:00",
        "location": "Vienna",
        "cfp_deadline": "2026-01-15T00:00:00+00:00",
        "category": "ML",
    }
    r = client.post("/conferences", json=body, headers=h)
    assert r.status_code == 201, r.text
    cid = r.json()["id"]
    r2 = client.get("/conferences")
    assert r2.status_code == 200
    data = r2.json()
    assert data["total"] >= 1
    assert any(x["id"] == cid for x in data["items"])


def test_search_pagination(client):
    _register(client)
    tok = _login(client)["access_token"]
    h = {"Authorization": f"Bearer {tok}"}
    for i in range(3):
        client.post(
            "/conferences",
            json={
                "title": f"Conf {i} searchtoken",
                "description": "desc",
                "start_date": "2026-08-01T00:00:00+00:00",
                "end_date": "2026-08-03T00:00:00+00:00",
                "category": "X",
            },
            headers=h,
        )
    r = client.get("/conferences?search=searchtoken&limit=2&skip=0")
    assert r.status_code == 200
    assert r.json()["total"] >= 2


def test_update_own_conference(client):
    _register(client)
    tok = _login(client)["access_token"]
    h = {"Authorization": f"Bearer {tok}"}
    r = client.post(
        "/conferences",
        json={
            "title": "T",
            "description": "",
            "start_date": "2026-09-01T00:00:00+00:00",
            "end_date": "2026-09-02T00:00:00+00:00",
            "category": "A",
        },
        headers=h,
    )
    cid = r.json()["id"]
    r2 = client.put(
        f"/conferences/{cid}",
        json={"title": "Updated"},
        headers=h,
    )
    assert r2.status_code == 200
    assert r2.json()["title"] == "Updated"


def test_delete_forbidden_other_user(client):
    _register(client, "a@test.com")
    tok_a = _login(client, "a@test.com")["access_token"]
    r = client.post(
        "/conferences",
        json={
            "title": "X",
            "description": "",
            "start_date": "2026-10-01T00:00:00+00:00",
            "end_date": "2026-10-02T00:00:00+00:00",
            "category": "C",
        },
        headers={"Authorization": f"Bearer {tok_a}"},
    )
    cid = r.json()["id"]
    _register(client, "b@test.com")
    tok_b = _login(client, "b@test.com")["access_token"]
    r2 = client.delete(f"/conferences/{cid}", headers={"Authorization": f"Bearer {tok_b}"})
    assert r2.status_code == 403


def test_admin_list_users_and_change_role(client):
    _register(client, "admin@test.com", "Admin12345")
    # назначаем admin вручную в БД
    from database import SessionLocal
    from models import User

    db = SessionLocal()
    try:
        u = db.query(User).filter(User.email == "admin@test.com").first()
        u.role = "admin"
        db.commit()
    finally:
        db.close()

    tok = _login(client, "admin@test.com", "Admin12345")["access_token"]
    h = {"Authorization": f"Bearer {tok}"}
    r = client.get("/admin/users", headers=h)
    assert r.status_code == 200
    _register(client, "plain@test.com", "Plain12345")
    from database import SessionLocal
    from models import User

    db = SessionLocal()
    try:
        uid = db.query(User).filter(User.email == "plain@test.com").first().id
    finally:
        db.close()
    r2 = client.put(f"/admin/users/{uid}/role", json={"role": "admin"}, headers=h)
    assert r2.status_code == 200
    assert r2.json()["role"] == "admin"


def test_admin_delete_any_conference(client):
    _register(client, "user@test.com", "User12345")
    tok_u = _login(client, "user@test.com", "User12345")["access_token"]
    r = client.post(
        "/conferences",
        json={
            "title": "Del",
            "description": "",
            "start_date": "2026-11-01T00:00:00+00:00",
            "end_date": "2026-11-02T00:00:00+00:00",
            "category": "Z",
        },
        headers={"Authorization": f"Bearer {tok_u}"},
    )
    cid = r.json()["id"]
    _register(client, "adm2@test.com", "Adm212345")
    from database import SessionLocal
    from models import User

    db = SessionLocal()
    try:
        u = db.query(User).filter(User.email == "adm2@test.com").first()
        u.role = "admin"
        db.commit()
    finally:
        db.close()
    tok_a = _login(client, "adm2@test.com", "Adm212345")["access_token"]
    r2 = client.delete(f"/admin/conferences/{cid}", headers={"Authorization": f"Bearer {tok_a}"})
    assert r2.status_code == 204


def test_refresh_token(client):
    _register(client)
    data = _login(client)
    r = client.post("/auth/refresh", json={"refresh_token": data["refresh_token"]})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_change_password(client):
    _register(client, "cp@test.com", "Oldpass123")
    tok = _login(client, "cp@test.com", "Oldpass123")["access_token"]
    r = client.post(
        "/auth/change-password",
        json={"current_password": "Oldpass123", "new_password": "Newpass123"},
        headers={"Authorization": f"Bearer {tok}"},
    )
    assert r.status_code == 200
    r2 = client.post("/auth/login", json={"email": "cp@test.com", "password": "Newpass123"})
    assert r2.status_code == 200
