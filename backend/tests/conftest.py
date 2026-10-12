import pytest
from app.core.config import settings

TEST_SECRET = "super-secret-test-jwt-key-32-chars-long"


@pytest.fixture(autouse=True)
def setup_test_jwt_secret(monkeypatch):
    monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", TEST_SECRET)
    monkeypatch.setattr(settings, "ENVIRONMENT", "test")
    from app.repositories.document_repo import document_repo
    from app.repositories.chat_repo import chat_repo
    document_repo.documents.clear()
    document_repo.chunks.clear()
    document_repo.file_storage.clear()
    chat_repo.conversations.clear()
    chat_repo.messages.clear()
    chat_repo._seed_development_chat()
