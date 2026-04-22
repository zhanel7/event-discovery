"""Integration tests for the API using TestClient and SQLite in-memory database."""
import os
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["JWT_SECRET_KEY"] = "integration-test-secret-key-32-chars-minimum!"
os.environ["FRONTEND_ORIGIN"] = "http://localhost:3000"
os.environ["REDIS_URL"] = "redis://127.0.0.1:59999/0"

import database
from database import Base

_test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
database.engine = _test_engine
database.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_test_engine)

from main import app


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=_test_engine)
    Base.metadata.create_all(bind=_test_engine)
    yield
    Base.metadata.drop_all(bind=_test_engine)


@pytest.fixture
def client():
    return TestClient(app)


def _register_user(client, email=None, password="TestPass123!", role="user"):
    if email is None:
        email = f"test_{uuid4()}@example.com"
    response = client.post(
        "/auth/register",
        json={"email": email, "password": password, "role": role},
    )
    assert response.status_code == 201, response.text
    return response.json()


def _login_user(client, email, password="TestPass123!"):
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return response.json()


def _create_conference(client, tokens, title="Test Conference", idx=1):
    conference_data = {
        "title": title,
        "description": "A test conference description",
        "start_date": f"2028-0{idx}-10T00:00:00Z",
        "end_date": f"2028-0{idx}-15T00:00:00Z",
        "location": "Test City",
        "cfp_deadline": f"2027-0{idx}-01T00:00:00Z",
        "category": "Computer Science"
    }
    response = client.post(
        "/conferences",
        json=conference_data,
        headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )
    assert response.status_code == 201, f"Create conference failed: {response.text}"
    return response.json()


class TestHealthAndRoot:
    def test_root_endpoint(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "service" in data
        assert "docs" in data
        assert "health" in data

    def test_health_endpoint(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["db"] == "ok"
        assert "status" in data

    def test_docs_endpoint(self, client):
        response = client.get("/docs")
        assert response.status_code == 200

    def test_openapi_json(self, client):
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "paths" in data
        assert "components" in data


class TestAuthentication:
    def test_user_registration(self, client):
        user_data = _register_user(client)
        assert "id" in user_data
        assert "email" in user_data
        assert "role" in user_data
        assert user_data["role"] == "user"

    def test_user_login(self, client):
        email = f"login_test_{uuid4()}@example.com"
        _register_user(client, email)
        tokens = _login_user(client, email)
        assert "access_token" in tokens
        assert "refresh_token" in tokens

    def test_get_current_user(self, client):
        email = f"me_test_{uuid4()}@example.com"
        _register_user(client, email)
        tokens = _login_user(client, email)
        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        assert response.status_code == 200
        user_data = response.json()
        assert user_data["email"] == email
        assert user_data["role"] == "user"

    def test_get_current_user_unauthorized(self, client):
        response = client.get("/auth/me")
        assert response.status_code == 401

    def test_duplicate_registration(self, client):
        email = f"duplicate_{uuid4()}@example.com"
        _register_user(client, email)
        response = client.post(
            "/auth/register",
            json={"email": email, "password": "AnotherPass123!", "role": "user"},
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    def test_invalid_login(self, client):
        response = client.post(
            "/auth/login",
            json={"email": "nonexistent@example.com", "password": "wrongpass"}
        )
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]


class TestConferences:
    def test_create_conference(self, client):
        email = f"conf_create_{uuid4()}@example.com"
        _register_user(client, email)
        tokens = _login_user(client, email)
        data = _create_conference(client, tokens, title="Test Conference")
        assert data["title"] == "Test Conference"
        assert data["category"] == "Computer Science"
        assert "id" in data

    def test_list_conferences(self, client):
        email = f"conf_list_{uuid4()}@example.com"
        _register_user(client, email)
        tokens = _login_user(client, email)
        _create_conference(client, tokens, title="List Test Conference")
        response = client.get("/conferences")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 1

    def test_get_conference_by_id(self, client):
        email = f"conf_get_{uuid4()}@example.com"
        _register_user(client, email)
        tokens = _login_user(client, email)
        created = _create_conference(client, tokens, title="Get Test Conference")
        conference_id = created["id"]
        response = client.get(f"/conferences/{conference_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == conference_id
        assert data["title"] == "Get Test Conference"

    def test_update_conference(self, client):
        email = f"conf_update_{uuid4()}@example.com"
        _register_user(client, email)
        tokens = _login_user(client, email)
        created = _create_conference(client, tokens, title="Update Test Conference")
        conference_id = created["id"]
        update_data = {"title": "Updated Conference Title"}
        response = client.put(
            f"/conferences/{conference_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Conference Title"

    def test_delete_conference(self, client):
        email = f"conf_delete_{uuid4()}@example.com"
        _register_user(client, email)
        tokens = _login_user(client, email)
        created = _create_conference(client, tokens, title="Delete Test Conference")
        conference_id = created["id"]
        response = client.delete(
            f"/conferences/{conference_id}",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        assert response.status_code == 204
        get_response = client.get(f"/conferences/{conference_id}")
        assert get_response.status_code == 404

    def test_conference_search(self, client):
        email = f"conf_search_{uuid4()}@example.com"
        _register_user(client, email)
        tokens = _login_user(client, email)
        _create_conference(client, tokens, title="Machine Learning Conference", idx=1)
        _create_conference(client, tokens, title="Web Development Summit", idx=2)
        response = client.get("/conferences?search=Machine Learning")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        titles = [item["title"] for item in data["items"]]
        assert any("Machine Learning" in t for t in titles)

    def test_conference_pagination(self, client):
        email = f"conf_pagination_{uuid4()}@example.com"
        _register_user(client, email)
        tokens = _login_user(client, email)
        for i in range(1, 6):
            _create_conference(client, tokens, title=f"Pagination Conference {i}", idx=i)
        response = client.get("/conferences?limit=2&skip=0")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["total"] >= 5
        response2 = client.get("/conferences?limit=2&skip=2")
        assert response2.status_code == 200
        data2 = response2.json()
        assert len(data2["items"]) == 2
        assert data["items"][0]["id"] != data2["items"][0]["id"]


class TestUserProfile:
    def test_get_user_conferences(self, client):
        email = f"profile_{uuid4()}@example.com"
        _register_user(client, email)
        tokens = _login_user(client, email)
        _create_conference(client, tokens, title="My Conference")
        response = client.get(
            "/users/me/conferences",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        assert response.status_code == 200
        conferences = response.json()
        assert len(conferences) >= 1
        assert conferences[0]["title"] == "My Conference"


class TestAuthorization:
    def test_update_other_user_conference_forbidden(self, client):
        email1 = f"user1_{uuid4()}@example.com"
        _register_user(client, email1)
        tokens1 = _login_user(client, email1)
        created = _create_conference(client, tokens1, title="User1 Conference")
        conference_id = created["id"]
        email2 = f"user2_{uuid4()}@example.com"
        _register_user(client, email2)
        tokens2 = _login_user(client, email2)
        update_response = client.put(
            f"/conferences/{conference_id}",
            json={"title": "Hacked Title"},
            headers={"Authorization": f"Bearer {tokens2['access_token']}"}
        )
        assert update_response.status_code == 403

    def test_delete_other_user_conference_forbidden(self, client):
        email1 = f"del_user1_{uuid4()}@example.com"
        _register_user(client, email1)
        tokens1 = _login_user(client, email1)
        created = _create_conference(client, tokens1, title="Delete Test Conference")
        conference_id = created["id"]
        email2 = f"del_user2_{uuid4()}@example.com"
        _register_user(client, email2)
        tokens2 = _login_user(client, email2)
        delete_response = client.delete(
            f"/conferences/{conference_id}",
            headers={"Authorization": f"Bearer {tokens2['access_token']}"}
        )
        assert delete_response.status_code == 403