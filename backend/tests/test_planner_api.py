import jwt
from fastapi.testclient import TestClient
from app.main import app

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


def test_full_planner_workflow_api():
    token = make_token("student-test-1")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a subject
    resp_subj = client.post(
        "/api/v1/subjects",
        json={"title": "Computer Networks", "code": "CS305", "color": "#8B7CFF"},
        headers=headers,
    )
    assert resp_subj.status_code == 201
    subj_id = resp_subj.json()["id"]

    # 2. Add topic to subject
    resp_top = client.post(
        f"/api/v1/subjects/{subj_id}/topics",
        json={"title": "TCP Congestion Control", "importance": 5, "difficulty": 4, "estimated_minutes": 45, "subject_id": subj_id},
        headers=headers,
    )
    assert resp_top.status_code == 201

    # 3. Add a task
    resp_task = client.post(
        "/api/v1/tasks",
        json={"title": "Networks Lab 3", "subject_id": subj_id, "priority": "high", "estimated_duration_minutes": 45},
        headers=headers,
    )
    assert resp_task.status_code == 201
    task_id = resp_task.json()["id"]

    # 4. Set availability rules (Monday to Friday 09:00 - 13:00)
    avail_rules = [
        {"day_of_week": dow, "start_time": "09:00:00", "end_time": "13:00:00", "is_active": True}
        for dow in range(5)
    ]
    resp_avail = client.put("/api/v1/availability", json=avail_rules, headers=headers)
    assert resp_avail.status_code == 200
    assert len(resp_avail.json()) == 5

    # 5. Generate plan preview
    resp_plan = client.post(
        "/api/v1/planner/generate",
        json={"horizon_days": 5, "session_duration_minutes": 45, "break_duration_minutes": 15},
        headers=headers,
    )
    assert resp_plan.status_code == 200
    preview = resp_plan.json()
    assert len(preview["planned_sessions"]) >= 2

    # 6. Apply plan
    resp_apply = client.post(
        "/api/v1/planner/apply",
        json=preview["planned_sessions"],
        headers=headers,
    )
    assert resp_apply.status_code == 201
    created_sessions = resp_apply.json()
    assert len(created_sessions) >= 2
    first_session_id = created_sessions[0]["id"]

    # 7. Complete the first session
    resp_complete = client.put(
        f"/api/v1/sessions/{first_session_id}",
        json={"status": "completed"},
        headers=headers,
    )
    assert resp_complete.status_code == 200
    assert resp_complete.json()["status"] == "completed"

    # 8. Replan schedule — verify completed session remains intact
    resp_replan = client.post(
        "/api/v1/planner/replan",
        json={"horizon_days": 5, "session_duration_minutes": 45, "break_duration_minutes": 15},
        headers=headers,
    )
    assert resp_replan.status_code == 200

    # 9. Verify Calendar Events
    resp_cal = client.get("/api/v1/calendar/events", headers=headers)
    assert resp_cal.status_code == 200
    events = resp_cal.json()
    assert len(events) >= 1

    # 10. Verify Dashboard Summary
    resp_dash = client.get("/api/v1/dashboard/summary", headers=headers)
    assert resp_dash.status_code == 200
    summary = resp_dash.json()
    assert summary["target_study_hours"] == 4.0
    assert len(summary["subject_progress"]) >= 1
