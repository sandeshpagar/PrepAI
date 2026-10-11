import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.repositories.chat_repo import chat_repo
from app.repositories.document_repo import document_repo
from app.services.chat.service import _cosine_similarity, rag_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_mode(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "test")
    monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", "super-secret-test-jwt-key-32-chars-long")


def test_cosine_similarity_math():
    # Identical vectors -> 1.0
    v1 = [1.0, 0.0, 0.0]
    assert _cosine_similarity(v1, v1) == pytest.approx(1.0)

    # Orthogonal vectors -> 0.0
    v2 = [0.0, 1.0, 0.0]
    assert _cosine_similarity(v1, v2) == pytest.approx(0.0)

    # Opposite vectors -> clamped to 0.0
    v3 = [-1.0, 0.0, 0.0]
    assert _cosine_similarity(v1, v3) == pytest.approx(0.0)

    # Zero vector
    assert _cosine_similarity([0.0, 0.0], [1.0, 1.0]) == 0.0


def test_retrieval_user_isolation_and_document_filter():
    user_a = "user-alice-rag"
    user_b = "user-bob-rag"

    # Setup doc & chunk for Alice
    doc_a = document_repo.create_document(user_a, {"title": "Alice Physics", "file_type": "pdf", "file_size_bytes": 100, "storage_path": "a/p.pdf"})
    chunk_a = document_repo.create_chunks(user_a, doc_a["id"], [{
        "chunk_index": 0,
        "content": "Quantum entanglement occurs when particles remain connected.",
        "page_or_slide": 5,
        "token_count": 10,
        "embedding": [1.0] + [0.0] * 767,
    }])[0]

    # Setup doc & chunk for Bob
    doc_b = document_repo.create_document(user_b, {"title": "Bob Chemistry", "file_type": "pdf", "file_size_bytes": 100, "storage_path": "b/c.pdf"})
    document_repo.create_chunks(user_b, doc_b["id"], [{
        "chunk_index": 0,
        "content": "Covalent bonding involves the sharing of electrons.",
        "page_or_slide": 2,
        "token_count": 10,
        "embedding": [1.0] + [0.0] * 767,
    }])

    query_vec = [1.0] + [0.0] * 767

    # Alice searches: MUST NOT see Bob's chunk
    alice_results = rag_service.search_relevant_chunks(user_a, query_vec, top_k=5)
    assert len(alice_results) == 1
    assert alice_results[0]["id"] == chunk_a["id"]
    assert alice_results[0]["document_title"] == "Alice Physics"

    # Alice searches with nonexistent document filter -> 0 results
    filtered_results = rag_service.search_relevant_chunks(user_a, query_vec, document_ids=["nonexistent-doc-id"])
    assert len(filtered_results) == 0


def test_insufficient_evidence_path():
    user_id = "user-empty-rag"
    answer, citations, meta = rag_service.answer_query(
        user_id=user_id,
        question="What is the speed of light?",
    )
    assert "insufficient evidence" in answer.lower()
    assert len(citations) == 0
    assert meta["status"] == "insufficient_evidence"


def test_citation_guardrail_resolution():
    retrieved_chunks = [
        {
            "id": "real-chunk-123",
            "document_id": "doc-456",
            "document_title": "Computer Networks",
            "page_or_slide": 14,
            "content": "TCP uses a three-way handshake: SYN, SYN-ACK, ACK.",
            "similarity": 0.94,
        }
    ]

    # Answer contains real chunk citation AND a hallucinated chunk citation
    raw_answer = "TCP connections begin with a three-way handshake [cite: real-chunk-123], but UDP uses [cite: fake-chunk-999]."
    clean_text, citations = rag_service.resolve_citations(raw_answer, retrieved_chunks)

    # Fake chunk must be discarded; only real chunk resolved
    assert len(citations) == 1
    assert citations[0].chunk_id == "real-chunk-123"
    assert citations[0].document_title == "Computer Networks"
    assert citations[0].page_or_slide == 14
    assert "fake-chunk-999" not in clean_text


def make_token(user_id: str) -> str:
    import jwt
    payload = {
        "sub": user_id,
        "email": f"{user_id}@university.edu",
        "role": "authenticated",
        "aud": "authenticated",
    }
    return jwt.encode(payload, "super-secret-test-jwt-key-32-chars-long", algorithm="HS256")


def test_conversation_api_lifecycle():
    token = make_token("student-test-rag")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. List conversations
    res = client.get("/api/v1/conversations", headers=headers)
    assert res.status_code == 200
    convs = res.json()
    assert isinstance(convs, list)

    # 2. Create conversation
    create_res = client.post("/api/v1/conversations", json={"title": "Midterm Prep"}, headers=headers)
    assert create_res.status_code == 201
    conv_id = create_res.json()["id"]

    # 3. Get conversation detail
    detail_res = client.get(f"/api/v1/conversations/{conv_id}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["title"] == "Midterm Prep"
    assert detail_res.json()["messages"] == []

    # 4. Send message
    msg_res = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"content": "What is covered in the syllabus?"},
        headers=headers,
    )
    assert msg_res.status_code == 201
    asst_msg = msg_res.json()
    assert asst_msg["role"] == "assistant"
    assert len(asst_msg["content"]) > 0

    # 5. Check messages persisted in conversation
    detail_res2 = client.get(f"/api/v1/conversations/{conv_id}", headers=headers)
    assert len(detail_res2.json()["messages"]) == 2  # user + assistant

    # 6. Rename conversation
    rename_res = client.patch(f"/api/v1/conversations/{conv_id}", json={"title": "Updated Title"}, headers=headers)
    assert rename_res.status_code == 200
    assert rename_res.json()["title"] == "Updated Title"

    # 7. Delete conversation
    del_res = client.delete(f"/api/v1/conversations/{conv_id}", headers=headers)
    assert del_res.status_code == 204
    assert client.get(f"/api/v1/conversations/{conv_id}", headers=headers).status_code == 404

