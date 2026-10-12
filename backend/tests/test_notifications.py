import jwt
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.repositories.planner_repo import planner_repo

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

def test_notification_sync_and_deduplication():
    user_id = "notif-user-1"
    headers = {"Authorization": f"Bearer {make_token(user_id)}"}
    now = datetime.now(timezone.utc)

    # 1. Add upcoming assessment in 3 days
    planner_repo.create_assessment(user_id, {
        "title": "Algorithms Midterm Exam",
        "assessment_type": "exam",
        "assessment_date": now + timedelta(days=3),
        "weightage": 30.0,
    })

    # 2. Fetch notifications - should auto-generate exam alert
    res = client.get("/api/v1/notifications", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["unread_count"] >= 1
    notif = data["notifications"][0]
    assert "Algorithms Midterm Exam" in notif["title"] or "Algorithms Midterm Exam" in notif["message"]
    assert notif["is_read"] is False

    # 3. Fetch again - must not duplicate notifications
    res2 = client.get("/api/v1/notifications", headers=headers)
    assert res2.status_code == 200
    assert len(res2.json()["notifications"]) == len(data["notifications"])

    # 4. Mark notification read
    mark_res = client.patch(f"/api/v1/notifications/{notif['id']}/read", headers=headers)
    assert mark_res.status_code == 200
    assert mark_res.json()["is_read"] is True

    # 5. Mark all read
    all_res = client.post("/api/v1/notifications/mark-all-read", headers=headers)
    assert all_res.status_code == 200
    assert all_res.json()["unread_count"] == 0
