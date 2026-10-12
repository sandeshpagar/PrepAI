import jwt
import pytest
from datetime import datetime, timedelta, timezone
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

def test_full_new_user_academic_journey():
    user_id = "new-freshman-student-journey"
    headers = {"Authorization": f"Bearer {make_token(user_id)}"}
    now = datetime.now(timezone.utc)
    today = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

    # 1. Health check & Initial Profile
    assert client.get("/health").status_code == 200
    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["id"] == user_id

    # 2. Configure Settings & Study Preferences
    sett_res = client.patch(
        "/api/v1/settings",
        json={"display_name": "Freshman Alex", "target_study_hours": 5.0, "preferred_session_duration": 45},
        headers=headers,
    )
    assert sett_res.status_code == 200

    # 3. Create Subject & Syllabus Topics
    s_res = client.post("/api/v1/subjects", json={"title": "Data Structures", "code": "CS201", "color": "#43E58B"}, headers=headers)
    assert s_res.status_code == 201
    subj_id = s_res.json()["id"]

    t1_res = client.post(f"/api/v1/subjects/{subj_id}/topics", json={"title": "AVL Trees & Rotations", "importance": 5, "difficulty": 4, "estimated_minutes": 45, "subject_id": subj_id}, headers=headers)
    assert t1_res.status_code == 201

    # 4. Create an Assessment (Exam in 5 days) & an Assignment Task
    a_res = client.post("/api/v1/assessments", json={"title": "CS201 Midterm", "subject_id": subj_id, "assessment_date": (today + timedelta(days=5)).isoformat(), "assessment_type": "exam", "weightage": 30.0}, headers=headers)
    assert a_res.status_code == 201

    task_res = client.post("/api/v1/tasks", json={"title": "AVL Tree Coding Assignment", "subject_id": subj_id, "due_date": (today + timedelta(days=2)).isoformat(), "priority": "high", "estimated_minutes": 90, "category": "assignment"}, headers=headers)
    assert task_res.status_code == 201
    task_id = task_res.json()["id"]

    # 5. Set Weekly Availability
    avail_rules = [{"day_of_week": dow, "start_time": "09:00:00", "end_time": "18:00:00", "is_active": True} for dow in range(7)]
    avail_res = client.put(
        "/api/v1/availability",
        json=avail_rules,
        headers=headers,
    )
    assert avail_res.status_code == 200

    # 6. Generate Study Plan Timetable & Apply It
    gen_res = client.post("/api/v1/planner/generate", json={"start_date": today.date().isoformat(), "horizon_days": 7, "session_duration_minutes": 45, "break_duration_minutes": 15}, headers=headers)
    assert gen_res.status_code == 200
    plan_preview = gen_res.json()
    assert len(plan_preview["planned_sessions"]) >= 1

    apply_res = client.post("/api/v1/planner/apply", json=plan_preview["planned_sessions"], headers=headers)
    assert apply_res.status_code == 201

    # 7. Start and Complete a Study Session
    sessions = client.get("/api/v1/sessions", headers=headers).json()
    assert len(sessions) >= 1
    target_session = sessions[0]
    upd_res = client.put(f"/api/v1/sessions/{target_session['id']}", json={"status": "completed", "start_time": now.isoformat()}, headers=headers)
    assert upd_res.status_code == 200

    # 8. Complete Assignment Task
    client.put(f"/api/v1/tasks/{task_id}", json={"status": "completed"}, headers=headers)

    # 9. Upload & Index Academic Document
    doc_upload = client.post(
        "/api/v1/documents/upload",
        files={"file": ("avl_trees_guide.txt", b"AVL trees are self-balancing binary search trees. The balance factor of any node is between -1 and 1.", "text/plain")},
        headers=headers,
    )
    assert doc_upload.status_code == 201

    # 10. Ask Grounded Question in RAG Assistant
    conv = client.post("/api/v1/conversations", json={"title": "AVL Study Chat"}, headers=headers).json()
    msg_res = client.post(
        f"/api/v1/conversations/{conv['id']}/messages",
        json={"content": "What is the balance factor in an AVL tree?"},
        headers=headers,
    )
    assert msg_res.status_code == 201
    asst_msg = msg_res.json()
    assert asst_msg["role"] == "assistant"
    assert len(asst_msg["content"]) > 0

    # 11. Verify Dashboard & Analytics are dynamically updated
    dash = client.get("/api/v1/dashboard/summary", headers=headers).json()
    assert dash["target_study_hours"] == 5.0
    assert dash["tasks_completed_count"] >= 1
    assert dash["upcoming_exams_count"] == 1

    analytics = client.get("/api/v1/analytics/overview?timeframe=week", headers=headers).json()
    assert analytics["total_completed_minutes"] >= 45
    assert analytics["tasks"]["completed"] >= 1

    # 12. Verify In-App Notifications generated
    notifs = client.get("/api/v1/notifications", headers=headers).json()
    assert notifs["unread_count"] >= 1
