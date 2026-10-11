import io
import jwt
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
TEST_SECRET = "super-secret-test-jwt-key-32-chars-long"


def make_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "email": f"{user_id}@test.edu",
        "role": "authenticated",
        "aud": "authenticated",
    }
    return jwt.encode(payload, TEST_SECRET, algorithm="HS256")


def test_document_full_lifecycle_and_ownership():
    token_a = make_token("student-alice")
    token_b = make_token("student-bob")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 1. User A uploads a markdown syllabus
    content = b"# Database Systems Syllabus\n\nUnit 1: Normalization & Functional Dependencies\nUnit 2: Indexing"
    files = {"file": ("syllabus.md", io.BytesIO(content), "text/markdown")}
    resp = client.post(
        "/api/v1/documents/upload",
        files=files,
        data={"title": "DBMS Syllabus"},
        headers=headers_a,
    )
    assert resp.status_code == 201
    doc_a = resp.json()
    assert doc_a["title"] == "DBMS Syllabus"
    assert doc_a["status"] == "indexed"
    assert doc_a["chunk_count"] >= 1
    doc_a_id = doc_a["id"]

    # 2. User A can view chunks
    resp_chunks = client.get(f"/api/v1/documents/{doc_a_id}/chunks", headers=headers_a)
    assert resp_chunks.status_code == 200
    chunks = resp_chunks.json()
    assert len(chunks) == doc_a["chunk_count"]
    assert "Normalization" in chunks[0]["content"]

    # 3. User B CANNOT see User A's document
    resp_b_list = client.get("/api/v1/documents", headers=headers_b)
    assert resp_b_list.status_code == 200
    assert not any(d["id"] == doc_a_id for d in resp_b_list.json())

    # 4. User B CANNOT fetch User A's document or chunks
    resp_b_get = client.get(f"/api/v1/documents/{doc_a_id}", headers=headers_b)
    assert resp_b_get.status_code == 404

    resp_b_chunks = client.get(f"/api/v1/documents/{doc_a_id}/chunks", headers=headers_b)
    assert resp_b_chunks.status_code == 404

    # 5. User A updates document title
    resp_patch = client.patch(
        f"/api/v1/documents/{doc_a_id}",
        json={"title": "Updated DBMS Syllabus"},
        headers=headers_a,
    )
    assert resp_patch.status_code == 200
    assert resp_patch.json()["title"] == "Updated DBMS Syllabus"

    # 6. User A retries document ingestion (idempotent - no duplicate chunks)
    resp_retry = client.post(f"/api/v1/documents/{doc_a_id}/retry", headers=headers_a)
    assert resp_retry.status_code == 200
    assert resp_retry.json()["status"] == "indexed"
    assert resp_retry.json()["chunk_count"] == len(chunks)

    # 7. User B CANNOT delete User A's document
    resp_b_del = client.delete(f"/api/v1/documents/{doc_a_id}", headers=headers_b)
    assert resp_b_del.status_code == 404

    # 8. User A deletes document
    resp_del = client.delete(f"/api/v1/documents/{doc_a_id}", headers=headers_a)
    assert resp_del.status_code == 204

    # 9. Verify document is gone
    resp_check = client.get(f"/api/v1/documents/{doc_a_id}", headers=headers_a)
    assert resp_check.status_code == 404


def test_upload_rejections():
    token = make_token("student-test")
    headers = {"Authorization": f"Bearer {token}"}

    # Unsupported format (.exe)
    resp = client.post(
        "/api/v1/documents/upload",
        files={"file": ("malware.exe", io.BytesIO(b"binary"), "application/x-msdownload")},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "Unsupported file format" in resp.json()["detail"]

    # Empty file
    resp_empty = client.post(
        "/api/v1/documents/upload",
        files={"file": ("empty.txt", io.BytesIO(b""), "text/plain")},
        headers=headers,
    )
    assert resp_empty.status_code == 400
    assert "empty" in resp_empty.json()["detail"].lower()
