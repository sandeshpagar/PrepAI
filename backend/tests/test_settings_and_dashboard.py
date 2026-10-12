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

def test_settings_lifecycle_and_dashboard_integration():
    headers = {"Authorization": f"Bearer {make_token('dev-student-settings')}"}

    # 1. Fetch default settings
    res = client.get("/api/v1/settings", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["target_study_hours"] == 4.0
    assert data["preferred_session_duration"] == 45
    assert data["notify_upcoming_deadlines"] is True

    # 2. Update settings
    update_res = client.patch(
        "/api/v1/settings",
        json={
            "target_study_hours": 6.0,
            "display_name": "Elena Vance",
            "preferred_session_duration": 60,
        },
        headers=headers,
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["target_study_hours"] == 6.0
    assert updated["display_name"] == "Elena Vance"
    assert updated["preferred_session_duration"] == 60

    # 3. Verify dashboard summary reflects updated target_study_hours
    dash_res = client.get("/api/v1/dashboard/summary", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["target_study_hours"] == 6.0
