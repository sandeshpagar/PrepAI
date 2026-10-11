import jwt
from fastapi.testclient import TestClient
from app.main import app
from app.repositories.planner_repo import planner_repo

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


def test_two_user_data_isolation():
    user_a_token = make_token("user-alpha")
    user_b_token = make_token("user-beta")

    headers_a = {"Authorization": f"Bearer {user_a_token}"}
    headers_b = {"Authorization": f"Bearer {user_b_token}"}

    # 1. User A creates a subject
    resp = client.post(
        "/api/v1/subjects",
        json={"title": "Algorithms", "code": "CS201", "color": "#43E58B"},
        headers=headers_a,
    )
    assert resp.status_code == 201
    subj_a_id = resp.json()["id"]

    # 2. User B cannot see User A's subject
    resp_b = client.get("/api/v1/subjects", headers=headers_b)
    assert resp_b.status_code == 200
    assert not any(s["id"] == subj_a_id for s in resp_b.json())

    # 3. User B cannot access User A's subject directly
    resp_b_direct = client.get(f"/api/v1/subjects/{subj_a_id}", headers=headers_b)
    assert resp_b_direct.status_code == 404

    # 4. User B cannot mutate User A's subject
    resp_b_update = client.put(
        f"/api/v1/subjects/{subj_a_id}",
        json={"title": "Hacked Title"},
        headers=headers_b,
    )
    assert resp_b_update.status_code == 404

    # 5. User A creates a task
    resp_task = client.post(
        "/api/v1/tasks",
        json={"title": "Homework 1", "priority": "high"},
        headers=headers_a,
    )
    assert resp_task.status_code == 201
    task_a_id = resp_task.json()["id"]

    # 6. User B cannot see or delete User A's task
    resp_b_tasks = client.get("/api/v1/tasks", headers=headers_b)
    assert not any(t["id"] == task_a_id for t in resp_b_tasks.json())

    resp_b_del = client.delete(f"/api/v1/tasks/{task_a_id}", headers=headers_b)
    assert resp_b_del.status_code == 404
