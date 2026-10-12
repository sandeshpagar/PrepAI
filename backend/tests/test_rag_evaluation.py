import pytest
from app.core.config import settings
from app.repositories.document_repo import document_repo
from app.services.chat.service import rag_service

@pytest.fixture(autouse=True)
def setup_test_mode(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "test")
    monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", "super-secret-test-jwt-key-32-chars-long")

def test_grounded_answer_citation_resolution():
    """Validates that citations resolve accurately to chunk metadata, source page, and quote snippet."""
    retrieved_chunks = [
        {
            "id": "chunk-dijkstra-001",
            "document_id": "doc-algorithms-101",
            "document_title": "Algorithms 4th Edition",
            "page_or_slide": 42,
            "content": "Dijkstra's algorithm finds the shortest paths from a single source vertex to all other vertices in a weighted digraph with non-negative edge weights.",
            "similarity": 0.965,
        }
    ]

    answer = "According to [cite: chunk-dijkstra-001], Dijkstra's algorithm operates on non-negative edge weights."
    clean_text, citations = rag_service.resolve_citations(answer, retrieved_chunks)

    assert len(citations) == 1
    c = citations[0]
    assert c.chunk_id == "chunk-dijkstra-001"
    assert c.document_title == "Algorithms 4th Edition"
    assert c.page_or_slide == 42
    assert "Dijkstra" in c.quote
    assert c.similarity_score == 0.965

def test_insufficient_evidence_refusal():
    """Validates that if no relevant chunks exceed the similarity threshold, the model acknowledges insufficient evidence."""
    user_id = "eval-user-quantum-physics"
    # User has no uploaded documents or chunks
    answer, citations, meta = rag_service.answer_query(
        user_id=user_id,
        question="How does quantum decoherence explain the emergence of classical probabilities?",
    )

    assert "insufficient evidence" in answer.lower()
    assert len(citations) == 0
    assert meta["status"] == "insufficient_evidence"
    assert meta["chunks_retrieved"] == 0

def test_citation_guardrail_filters_hallucinated_chunks():
    """Validates that hallucinated citations not present in retrieved set are stripped."""
    retrieved_chunks = [
        {
            "id": "chunk-valid-777",
            "document_id": "doc-db-101",
            "document_title": "Database Management Systems",
            "page_or_slide": 105,
            "content": "ACID properties ensure reliable processing of database transactions.",
            "similarity": 0.92,
        }
    ]

    # Synthesized LLM text containing both valid and hallucinated chunk citations
    raw_answer = "Transactions provide ACID guarantees [cite: chunk-valid-777], but CAP theorem applies to distributed nodes [cite: fake-uuid-8888] [Chunk 99]."
    clean_text, citations = rag_service.resolve_citations(raw_answer, retrieved_chunks)

    assert len(citations) == 1
    assert citations[0].chunk_id == "chunk-valid-777"
    assert all(c.chunk_id != "fake-uuid-8888" for c in citations)
    assert all(c.chunk_id != "fake-chunk-99" for c in citations)

def test_top_k_retrieval_and_context_bounds():
    """Validates that retrieval respects top_k limits and formats context accurately."""
    user_id = "eval-user-topk-test"
    doc = document_repo.create_document(
        user_id,
        {"title": "Operating Systems Concepts", "file_type": "pdf", "file_size_bytes": 1024, "storage_path": "os.pdf"},
    )

    # Insert 6 chunks
    chunk_payloads = [
        {
            "chunk_index": i,
            "content": f"OS Concept Section {i}: Virtual memory paging and page replacement algorithms.",
            "page_or_slide": i + 1,
            "token_count": 15,
            "embedding": [1.0] + [0.0] * 767,
        }
        for i in range(6)
    ]
    document_repo.create_chunks(user_id, doc["id"], chunk_payloads)

    query_vec = [1.0] + [0.0] * 767
    top_3 = rag_service.search_relevant_chunks(user_id, query_vec, top_k=3)
    assert len(top_3) == 3

    context_str = rag_service.build_prompt_context(top_3)
    assert "[Chunk 1 | ID:" in context_str
    assert "[Chunk 2 | ID:" in context_str
    assert "[Chunk 3 | ID:" in context_str
    assert "[Chunk 4 | ID:" not in context_str
