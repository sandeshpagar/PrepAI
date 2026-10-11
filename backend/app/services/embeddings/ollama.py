import logging
from typing import List, Union
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class OllamaEmbeddingError(Exception):
    pass


class OllamaEmbeddingClient:
    """
    Client for generating local vector embeddings using Ollama.
    """

    def __init__(
        self,
        base_url: str = settings.OLLAMA_BASE_URL,
        model: str = settings.OLLAMA_EMBEDDING_MODEL,
        expected_dimension: int = settings.EMBEDDING_DIMENSION,
        timeout: int = settings.OLLAMA_REQUEST_TIMEOUT_SECONDS,
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.expected_dimension = expected_dimension
        self.timeout = timeout

    def embed_texts(self, texts: Union[str, List[str]]) -> List[List[float]]:
        """
        Generates vector embeddings for a text string or list of texts.
        Validates dimensions against expected_dimension (768).
        """
        if isinstance(texts, str):
            input_list = [texts]
        else:
            input_list = texts

        if not input_list:
            return []

        url = f"{self.base_url}/api/embed"
        payload = {"model": self.model, "input": input_list}

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, json=payload)
        except httpx.ConnectError:
            raise OllamaEmbeddingError(
                f"Local Ollama server is offline or unreachable at {self.base_url}. "
                "Please verify Ollama is running (`ollama serve`)."
            )
        except httpx.TimeoutException:
            raise OllamaEmbeddingError(
                f"Timed out waiting for Ollama embeddings after {self.timeout}s."
            )
        except Exception as e:
            raise OllamaEmbeddingError(f"Ollama request error: {str(e)}")

        if response.status_code == 404:
            raise OllamaEmbeddingError(
                f"Ollama embedding model '{self.model}' not found. "
                f"Please run `ollama pull {self.model}`."
            )
        elif response.status_code != 200:
            error_msg = response.text
            try:
                error_msg = response.json().get("error", error_msg)
            except Exception:
                pass
            raise OllamaEmbeddingError(f"Ollama embedding failed ({response.status_code}): {error_msg}")

        data = response.json()
        embeddings = data.get("embeddings", [])

        if len(embeddings) != len(input_list):
            raise OllamaEmbeddingError(
                f"Expected {len(input_list)} embeddings from Ollama, but received {len(embeddings)}."
            )

        # Validate vector dimension on every returned embedding
        for i, emb in enumerate(embeddings):
            if len(emb) != self.expected_dimension:
                raise OllamaEmbeddingError(
                    f"Vector dimension mismatch for item {i}: expected {self.expected_dimension}, "
                    f"got {len(emb)}. Check Ollama embedding model configuration."
                )

        return embeddings

    def embed_text(self, text: str) -> List[float]:
        """Convenience method for a single text."""
        results = self.embed_texts(text)
        return results[0]


# Global singleton client
ollama_embedder = OllamaEmbeddingClient()
