import time
import jwt
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)
TEST_SECRET = "super-secret-test-jwt-key-32-chars-long"


@pytest.fixture(autouse=True)
def setup_test_jwt_secret(monkeypatch):
    monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", TEST_SECRET)
    monkeypatch.setattr(settings, "ENVIRONMENT", "test")


def test_auth_me_missing_token():
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "Authorization credentials required" in response.json()["detail"]


def test_auth_me_invalid_token():
    headers = {"Authorization": "Bearer invalid.token.payload"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401


def test_auth_me_expired_token():
    payload = {
        "sub": "user-12345",
        "email": "student@university.edu",
        "exp": int(time.time()) - 3600,  # Expired 1 hour ago
        "aud": "authenticated",
    }
    token = jwt.encode(payload, TEST_SECRET, algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()


def test_auth_me_valid_token():
    payload = {
        "sub": "user-12345",
        "email": "student@university.edu",
        "role": "authenticated",
        "exp": int(time.time()) + 3600,
        "aud": "authenticated",
    }
    token = jwt.encode(payload, TEST_SECRET, algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "user-12345"
    assert data["email"] == "student@university.edu"
    assert data["role"] == "authenticated"
