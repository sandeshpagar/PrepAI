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

def test_empty_analytics_for_new_user():
    headers = {"Authorization": f"Bearer {make_token('dev-new-user')}"}
    response = client.get("/api/v1/analytics/overview?timeframe=week", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["timeframe"] == "week"
    assert data["total_planned_minutes"] == 0
    assert data["total_completed_minutes"] == 0
    assert data["completion_rate_pct"] == 0
    assert len(data["daily_trend"]) == 7
    assert data["consistency"]["current_streak_days"] == 0
    assert data["tasks"]["total"] == 0

def test_analytics_calculation_with_sessions():
    user_id = "analytics-test-user"
    headers = {"Authorization": f"Bearer {make_token(user_id)}"}
    now = datetime.now(timezone.utc)

    # 1. Create 1 completed session and 1 planned session
    planner_repo.create_session(user_id, {
        "title": "Completed Study Block",
        "session_type": "study",
        "start_time": now - timedelta(hours=2),
        "end_time": now - timedelta(hours=1),
        "duration_minutes": 60,
        "status": "completed",
    })
    planner_repo.create_session(user_id, {
        "title": "Planned Study Block",
        "session_type": "revision",
        "start_time": now + timedelta(hours=1),
        "end_time": now + timedelta(hours=2),
        "duration_minutes": 60,
        "status": "planned",
    })

    response = client.get("/api/v1/analytics/overview?timeframe=week", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_completed_minutes"] == 60
    assert data["total_planned_minutes"] == 60
    assert data["completion_rate_pct"] == 50
    assert data["consistency"]["current_streak_days"] >= 1
