import logging
import math
from typing import Any, Dict, List
from app.core.config import settings
from app.repositories.document_repo import document_repo
from app.services.documents.chunker import chunk_sections
from app.services.documents.parser import DocumentParser
from app.services.embeddings.ollama import OllamaEmbeddingError, ollama_embedder

logger = logging.getLogger(__name__)


def _make_simulated_embedding(text: str, dim: int = 768) -> List[float]:
    """Generates a deterministic unit-length vector for offline testing."""
    val = sum(ord(c) for c in text[:100]) % 1000
    vec = [math.sin(val + i) for i in range(dim)]
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / norm for x in vec]


def run_document_ingestion(
    user_id: str,
    document_id: str,
    file_bytes: bytes,
    file_type: str,
) -> Dict[str, Any]:
    """
    Executes end-to-end ingestion pipeline:
    1. Parsing -> 2. Chunking -> 3. Vector Embedding -> 4. Idempotent Indexing
    """
    # 1. Update status to 'processing'
    document_repo.update_document(
        user_id,
        document_id,
        {"status": "processing", "error_message": None},
    )

    try:
        # 2. Extract sections & page/slide labels
        sections, page_or_slide_count = DocumentParser.parse(file_bytes, file_type)

        # 3. Chunk text with configured size and overlap
        chunks = chunk_sections(
            sections,
            chunk_size=settings.RAG_CHUNK_SIZE,
            chunk_overlap=settings.RAG_CHUNK_OVERLAP,
        )

        if not chunks:
            raise ValueError("Document contains no usable text chunks.")

        # 4. Generate embeddings via Ollama (or simulated vectors in test environment if Ollama offline)
        chunk_texts = [c.content for c in chunks]
        embeddings: List[List[float]] = []

        try:
            # Batch embedding call to local Ollama
            embeddings = ollama_embedder.embed_texts(chunk_texts)
        except OllamaEmbeddingError as e:
            if settings.ENVIRONMENT == "test":
                logger.warning(f"Ollama offline in test mode; using simulated vectors: {e}")
                embeddings = [_make_simulated_embedding(txt) for txt in chunk_texts]
            else:
                raise e

        # 5. Idempotent replacement: delete any prior chunks
        document_repo.delete_chunks_by_document(user_id, document_id)

        # 6. Save chunks with vector embeddings
        chunks_payload = []
        for c, emb in zip(chunks, embeddings):
            chunks_payload.append(
                {
                    "chunk_index": c.chunk_index,
                    "content": c.content,
                    "page_or_slide": c.page_or_slide,
                    "token_count": c.token_count,
                    "embedding": emb,
                }
            )

        document_repo.create_chunks(user_id, document_id, chunks_payload)

        # 7. Mark as indexed
        updated = document_repo.update_document(
            user_id,
            document_id,
            {
                "status": "indexed",
                "page_count": page_or_slide_count,
                "chunk_count": len(chunks),
                "error_message": None,
            },
        )
        return updated or {}

    except Exception as exc:
        err_msg = str(exc)
        logger.error(f"Ingestion failed for document {document_id}: {err_msg}")
        updated = document_repo.update_document(
            user_id,
            document_id,
            {
                "status": "failed",
                "error_message": err_msg,
            },
        )
        return updated or {}
