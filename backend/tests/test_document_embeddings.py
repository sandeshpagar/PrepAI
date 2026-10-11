import pytest
from app.services.embeddings.ollama import OllamaEmbeddingClient, OllamaEmbeddingError


def test_ollama_client_dimension_validation():
    client = OllamaEmbeddingClient(expected_dimension=768)
    assert client.expected_dimension == 768


def test_ollama_client_unreachable_server():
    client = OllamaEmbeddingClient(base_url="http://127.0.0.1:59999", timeout=1)
    with pytest.raises(OllamaEmbeddingError, match="offline or unreachable|Timed out"):
        client.embed_text("test content")
