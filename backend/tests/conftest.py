import pytest
from app.core.config import settings

TEST_SECRET = "super-secret-test-jwt-key-32-chars-long"


@pytest.fixture(autouse=True)
def setup_test_jwt_secret(monkeypatch):
    monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", TEST_SECRET)
    monkeypatch.setattr(settings, "ENVIRONMENT", "test")
