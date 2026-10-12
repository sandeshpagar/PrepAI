import jwt
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)
TEST_SECRET = "super-secret-test-jwt-key-32-chars-long"

def make_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "email": f"{user_id}@university.edu",
        "role": "authenticated",
        "aud": "authenticated",
    }
    return jwt.encode(payload, TEST_SECRET, algorithm="HS256")

@pytest.fixture(autouse=True)
def setup_test_mode(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "test")
    monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", TEST_SECRET)

def test_complete_cross_user_data_isolation():
    alice_id = "alice-user-audit"
    bob_id = "bob-user-audit"
    alice_headers = {"Authorization": f"Bearer {make_token(alice_id)}"}
    bob_headers = {"Authorization": f"Bearer {make_token(bob_id)}"}

    # 1. Alice creates a subject
    resp = client.post("/api/v1/subjects", json={"title": "Alice Quantum Computing", "color": "#43E58B"}, headers=alice_headers)
    assert resp.status_code == 201
    alice_subj_id = resp.json()["id"]

    # Bob lists subjects -> MUST NOT see Alice's subject
    bob_subjs = client.get("/api/v1/subjects", headers=bob_headers).json()
    assert all(s["id"] != alice_subj_id for s in bob_subjs)

    # Bob attempts to get or update Alice's subject directly -> MUST be 404
    assert client.get(f"/api/v1/subjects/{alice_subj_id}", headers=bob_headers).status_code == 404
    assert client.put(f"/api/v1/subjects/{alice_subj_id}", json={"title": "Hacked"}, headers=bob_headers).status_code == 404
    assert client.delete(f"/api/v1/subjects/{alice_subj_id}", headers=bob_headers).status_code == 404

    # 2. Alice creates a task
    t_resp = client.post("/api/v1/tasks", json={"title": "Alice Secret Thesis", "subject_id": alice_subj_id, "priority": "high"}, headers=alice_headers)
    assert t_resp.status_code == 201
    alice_task_id = t_resp.json()["id"]

    # Bob cannot access or update Alice's task
    assert client.get(f"/api/v1/tasks/{alice_task_id}", headers=bob_headers).status_code == 404
    assert client.put(f"/api/v1/tasks/{alice_task_id}", json={"status": "completed"}, headers=bob_headers).status_code == 404

    # 3. Alice uploads a document
    doc_resp = client.post(
        "/api/v1/documents/upload",
        files={"file": ("alice_notes.txt", b"Alice confidential lecture notes on cryptography", "text/plain")},
        headers=alice_headers,
    )
    assert doc_resp.status_code == 201
    alice_doc_id = doc_resp.json()["id"]

    # Bob cannot list, view, or delete Alice's document
    bob_docs = client.get("/api/v1/documents", headers=bob_headers).json()
    assert all(d["id"] != alice_doc_id for d in bob_docs)
    assert client.get(f"/api/v1/documents/{alice_doc_id}", headers=bob_headers).status_code == 404
    assert client.delete(f"/api/v1/documents/{alice_doc_id}", headers=bob_headers).status_code == 404

    # 4. Alice creates a conversation
    conv_resp = client.post("/api/v1/conversations", json={"title": "Alice Private Research"}, headers=alice_headers)
    assert conv_resp.status_code == 201
    alice_conv_id = conv_resp.json()["id"]

    # Bob cannot read, send messages to, or delete Alice's conversation
    assert client.get(f"/api/v1/conversations/{alice_conv_id}", headers=bob_headers).status_code == 404
    assert client.post(f"/api/v1/conversations/{alice_conv_id}/messages", json={"content": "Spy query"}, headers=bob_headers).status_code == 404
    assert client.delete(f"/api/v1/conversations/{alice_conv_id}", headers=bob_headers).status_code == 404

    # 5. Alice settings and notifications
    client.patch("/api/v1/settings", json={"display_name": "Alice Wonderland", "target_study_hours": 7.5}, headers=alice_headers)
    bob_settings = client.get("/api/v1/settings", headers=bob_headers).json()
    assert bob_settings["display_name"] is None or bob_settings["display_name"] != "Alice Wonderland"
    assert bob_settings["target_study_hours"] == 4.0  # Bob retains his default
