"""Integration tests for the API using TestClient and SQLite in-memory database."""
import os
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set test environment variables
os.environ["JWT_SECRET_KEY"] = "integration-test-secret-key-32-chars-minimum!"
os.environ["FRONTEND_ORIGIN"] = "http://localhost:3000"
os.environ["REDIS_URL"] = "redis://127.0.0.1:59999/0"  # Non-existent Redis for testing

# Override database configuration before importing the app
import database
from database import Base

_test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
database.engine = _test_engine
database.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_test_engine)

# Import the app after database override
from main import app


@pytest.fixture(autouse=True)
def reset_db():
    """Reset database before each test."""
    Base.metadata.drop_all(bind=_test_engine)
    Base.metadata.create_all(bind=_test_engine)
    yield
    Base.metadata.drop_all(bind=_test_engine)


@pytest.fixture
def client():
    """Test client fixture."""
    return TestClient(app)


def _register_user(client, email=None, password="TestPass123!", role="user"):
    """Helper to register a user."""
    if email is None:
        email = f"test_{uuid4()}@example.com"
    response = client.post(
        "/auth/register",
        json={"email": email, "password": password, "role": role},
    )
    assert response.status_code == 201, response.text
    return response.json()


def _login_user(client, email, password="TestPass123!"):
    """Helper to login a user."""
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return response.json()


class TestHealthAndRoot:
    """Test basic endpoints."""

    def test_root_endpoint(self, client):
        """Test root endpoint returns correct information."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "service" in data
        assert "docs" in data
        assert "health" in data

    def test_health_endpoint(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy", "db": "ok", "redis": "error"}

    def test_docs_endpoint(self, client):
        """Test that docs endpoint is accessible."""
        response = client.get("/docs")
        assert response.status_code == 200

    def test_openapi_json(self, client):
        """Test OpenAPI JSON endpoint."""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "paths" in data
        assert "components" in data


class TestAuthentication:
    """Test authentication endpoints."""

    def test_user_registration(self, client):
        """Test user registration."""
        user_data = _register_user(client)
        assert "id" in user_data
        assert "email" in user_data
        assert "role" in user_data
        assert user_data["role"] == "user"

    def test_user_login(self, client):
        """Test user login."""
        email = f"login_test_{uuid4()}@example.com"
        _register_user(client, email)
        tokens = _login_user(client, email)
        assert "access_token" in tokens
        assert "refresh_token" in tokens

    def test_get_current_user(self, client):
        """Test getting current user information."""
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
        """Test getting current user without authentication."""
        response = client.get("/auth/me")
        assert response.status_code == 401

    def test_duplicate_registration(self, client):
        """Test that duplicate email registration fails."""
        email = f"duplicate_{uuid4()}@example.com"
        _register_user(client, email)
        response = client.post(
            "/auth/register",
            json={"email": email, "password": "AnotherPass123!", "role": "user"},
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    def test_invalid_login(self, client):
        """Test login with invalid credentials."""
        response = client.post(
            "/auth/login",
            json={"email": "nonexistent@example.com", "password": "wrongpass"}
        )
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]


class TestConferences:
    """Test conference endpoints."""

    def test_create_conference(self, client):
        """Test creating a conference."""
        email = f"conf_create_{uuid4()}@example.com"
        _register_user(client, email)
        tokens = _login_user(client, email)

        conference_data = {
            "title": "Test Conference",
            "description": "A test conference description",
            "start_date": "2026-06-01T00:00:00Z",
            "end_date": "2026-06-05T00:00:00Z",
            "location": "Test City",
            "cfp_deadline": "2026-05-01T00:00:00Z",
            "category": "Computer Science"
        }

        response = client.post(
            "/conferences",
            json=conference_data,
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["title"] == conference_data["title"]
        assert data["category"] == conference_data["category"]
        assert "id" in data

    def test_list_conferences(self, client):
        """Test listing conferences."""
        # Create a conference first
        email = f"conf_list_{uuid4()}@example.com"
        _register_user(client, email)
        tokens = _login_user(client, email)

        conference_data = {
            "title": "List Test Conference",
            "description": "Description",
            "start_date": "2026-07-01T00:00:00Z",
            "end_date": "2026-07-03T00:00:00Z",
            "location": "Test Location",
            "cfp_deadline": "2026-06-01T00:00:00Z",
            "category": "Testing"
        }

        client.post(
            "/conferences",
            json=conference_data,
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )

        # List conferences
        response = client.get("/conferences")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 1
        assert len(data["items"]) >= 1

    def test_get_conference_by_id(self, client):
        """Test getting a specific conference."""
        email = f"conf_get_{uuid4()}@example.com"
        _register_user(client, email)
        tokens = _login_user(client, email)

        conference_data = {
            "title": "Get Test Conference",
            "description": "Description",
            "start_date": "2026-08-01T00:00:00Z",
            "end_date": "2026-08-03T00:00:00Z",
            "location": "Test Location",
            "cfp_deadline": "2026-07-01T00:00:00Z",
            "category": "Testing"
        }

        create_response = client.post(
            "/conferences",
            json=conference_data,
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        conference_id = create_response.json()["id"]

        # Get the conference
        response = client.get(f"/conferences/{conference_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == conference_id
        assert data["title"] == conference_data["title"]

    def test_update_conference(self, client):
        """Test updating a conference."""
        email = f"conf_update_{uuid4()}@example.com"
        _register_user(client, email)
        tokens = _login_user(client, email)

        conference_data = {
            "title": "Update Test Conference",
            "description": "Original description",
            "start_date": "2026-09-01T00:00:00Z",
            "end_date": "2026-09-03T00:00:00Z",
            "location": "Original Location",
            "cfp_deadline": "2026-08-01T00:00:00Z",
            "category": "Original Category"
        }

        create_response = client.post(
            "/conferences",
            json=conference_data,
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        conference_id = create_response.json()["id"]

        # Update the conference
        update_data = {"title": "Updated Conference Title"}
        response = client.put(
            f"/conferences/{conference_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Conference Title"
        assert data["description"] == conference_data["description"]  # Unchanged

    def test_delete_conference(self, client):
        """Test deleting a conference."""
        email = f"conf_delete_{uuid4()}@example.com"
        _register_user(client, email)
        tokens = _login_user(client, email)

        conference_data = {
            "title": "Delete Test Conference",
            "description": "Description",
            "start_date": "2026-10-01T00:00:00Z",
            "end_date": "2026-10-03T00:00:00Z",
            "location": "Test Location",
            "cfp_deadline": "2026-09-01T00:00:00Z",
            "category": "Testing"
        }

        create_response = client.post(
            "/conferences",
            json=conference_data,
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        conference_id = create_response.json()["id"]

        # Delete the conference
        response = client.delete(
            f"/conferences/{conference_id}",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        assert response.status_code == 204

        # Verify it's deleted
        get_response = client.get(f"/conferences/{conference_id}")
        assert get_response.status_code == 404

    def test_conference_search(self, client):
        """Test conference search functionality."""
        email = f"conf_search_{uuid4()}@example.com"
        _register_user(client, email)
        tokens = _login_user(client, email)

        # Create multiple conferences
        conferences = [
            {
                "title": "Machine Learning Conference",
                "description": "ML conference",
                "start_date": "2026-11-01T00:00:00Z",
                "end_date": "2026-11-03T00:00:00Z",
                "location": "ML City",
                "cfp_deadline": "2026-10-01T00:00:00Z",
                "category": "Machine Learning"
            },
            {
                "title": "Web Development Summit",
                "description": "Web dev summit",
                "start_date": "2026-12-01T00:00:00Z",
                "end_date": "2026-12-03T00:00:00Z",
                "location": "Web City",
                "cfp_deadline": "2026-11-01T00:00:00Z",
                "category": "Web Development"
            }
        ]

        for conf in conferences:
            client.post(
                "/conferences",
                json=conf,
                headers={"Authorization": f"Bearer {tokens['access_token']}"}
            )

        # Search for ML conferences
        response = client.get("/conferences?search=Machine Learning")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert "Machine Learning" in data["items"][0]["title"]

    def test_conference_pagination(self, client):
        """Test conference pagination."""
        email = f"conf_pagination_{uuid4()}@example.com"
        _register_user(client, email)
        tokens = _login_user(client, email)

        # Create multiple conferences
        for i in range(5):
            conference_data = {
                "title": f"Pagination Conference {i}",
                "description": f"Description {i}",
                "start_date": f"2026-{i+1:02d}-01T00:00:00Z",
                "end_date": f"2026-{i+1:02d}-03T00:00:00Z",
                "location": f"City {i}",
                "cfp_deadline": f"2025-{i+1:02d}-01T00:00:00Z",
                "category": "Testing"
            }
            client.post(
                "/conferences",
                json=conference_data,
                headers={"Authorization": f"Bearer {tokens['access_token']}"}
            )

        # Test pagination
        response = client.get("/conferences?limit=2&skip=0")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["total"] >= 5

        response2 = client.get("/conferences?limit=2&skip=2")
        assert response2.status_code == 200
        data2 = response2.json()
        assert len(data2["items"]) == 2
        # Ensure different items
        assert data["items"][0]["id"] != data2["items"][0]["id"]


class TestUserProfile:
    """Test user profile endpoints."""

    def test_get_user_conferences(self, client):
        """Test getting conferences created by the current user."""
        email = f"profile_{uuid4()}@example.com"
        _register_user(client, email)
        tokens = _login_user(client, email)

        # Create a conference
        conference_data = {
            "title": "My Conference",
            "description": "My own conference",
            "start_date": "2026-12-01T00:00:00Z",
            "end_date": "2026-12-03T00:00:00Z",
            "location": "My City",
            "cfp_deadline": "2026-11-01T00:00:00Z",
            "category": "Personal"
        }

        client.post(
            "/conferences",
            json=conference_data,
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )

        # Get user's conferences
        response = client.get(
            "/users/me/conferences",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        assert response.status_code == 200
        conferences = response.json()
        assert len(conferences) >= 1
        assert conferences[0]["title"] == "My Conference"


class TestAuthorization:
    """Test authorization and permissions."""

    def test_update_other_user_conference_forbidden(self, client):
        """Test that users cannot update other users' conferences."""
        # Create first user and conference
        email1 = f"user1_{uuid4()}@example.com"
        _register_user(client, email1)
        tokens1 = _login_user(client, email1)

        conference_data = {
            "title": "User1 Conference",
            "description": "Description",
            "start_date": "2027-01-01T00:00:00Z",
            "end_date": "2027-01-03T00:00:00Z",
            "location": "City",
            "cfp_deadline": "2026-12-01T00:00:00Z",
            "category": "Testing"
        }

        create_response = client.post(
            "/conferences",
            json=conference_data,
            headers={"Authorization": f"Bearer {tokens1['access_token']}"}
        )
        conference_id = create_response.json()["id"]

        # Create second user
        email2 = f"user2_{uuid4()}@example.com"
        _register_user(client, email2)
        tokens2 = _login_user(client, email2)

        # Try to update first user's conference
        update_response = client.put(
            f"/conferences/{conference_id}",
            json={"title": "Hacked Title"},
            headers={"Authorization": f"Bearer {tokens2['access_token']}"}
        )
        assert update_response.status_code == 403

    def test_delete_other_user_conference_forbidden(self, client):
        """Test that users cannot delete other users' conferences."""
        # Similar setup as above
        email1 = f"del_user1_{uuid4()}@example.com"
        _register_user(client, email1)
        tokens1 = _login_user(client, email1)

        conference_data = {
            "title": "Delete Test Conference",
            "description": "Description",
            "start_date": "2027-02-01T00:00:00Z",
            "end_date": "2027-02-03T00:00:00Z",
            "location": "City",
            "cfp_deadline": "2027-01-01T00:00:00Z",
            "category": "Testing"
        }

        create_response = client.post(
            "/conferences",
            json=conference_data,
            headers={"Authorization": f"Bearer {tokens1['access_token']}"}
        )
        conference_id = create_response.json()["id"]

        # Create second user
        email2 = f"del_user2_{uuid4()}@example.com"
        _register_user(client, email2)
        tokens2 = _login_user(client, email2)

        # Try to delete first user's conference
        delete_response = client.delete(
            f"/conferences/{conference_id}",
            headers={"Authorization": f"Bearer {tokens2['access_token']}"}
        )
        assert delete_response.status_code == 403
