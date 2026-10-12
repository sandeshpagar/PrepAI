# Phase 5 — Analytics, Dashboard Completion, Notifications, Settings, and Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Phase 5: Build the academic analytics engine, in-app notifications system, user settings/preferences, dashboard polish with real calculated metrics (no hardcoded streaks or fake targets), complete the Progress & Analytics page, and ensure visual consistency across all 9 screens.

**Architecture:** 
- Analytics calculations derive strictly from persisted records in `planner_repo` (`study_sessions`, `tasks`, `subjects`, `assessments`) and `document_repo`.
- User settings store study preferences (daily study target, preferred duration) and notification preferences, which directly feed the dashboard and notification engine.
- Notifications are dynamically synchronized with upcoming deadlines, exams, and session schedules using idempotent deduplication keys.
- Frontend delivers responsive Glassmorphism dashboards and analytics charts matching `design.md` tokens without nested blurs.

**Architecture Diagram:**

```mermaid
graph TD
    subgraph "Frontend (React + TS)"
        TopBar["TopBar + NotificationDropdown"]
        Dashboard["DashboardPage (Weekly Chart + Activity Feed)"]
        Analytics["AnalyticsPage (7d/30d Trends + Subject Mastery)"]
        Settings["SettingsPage (Preferences + Profile)"]
    end

    subgraph "Backend API (FastAPI)"
        R_Dash["/api/v1/dashboard/summary"]
        R_Analytics["/api/v1/analytics/overview"]
        R_Notif["/api/v1/notifications"]
        R_Settings["/api/v1/settings"]
    end

    subgraph "Services & Repositories"
        AnalyticsSvc["AnalyticsService"]
        NotifRepo["NotificationRepository"]
        SettingsRepo["SettingsRepository"]
        PlannerRepo["PlannerRepository"]
        DocRepo["DocumentRepository"]
    end

    TopBar -->|GET /notifications| R_Notif
    Dashboard -->|GET /dashboard/summary| R_Dash
    Analytics -->|GET /analytics/overview| R_Analytics
    Settings -->|GET/PATCH /settings| R_Settings

    R_Dash --> SettingsRepo
    R_Dash --> AnalyticsSvc
    R_Analytics --> AnalyticsSvc
    R_Notif --> NotifRepo
    R_Settings --> SettingsRepo

    AnalyticsSvc --> PlannerRepo
    AnalyticsSvc --> DocRepo
    NotifRepo --> PlannerRepo
    NotifRepo --> DocRepo
```

**Tech Stack:**
- Backend: Python 3.13, FastAPI, Pydantic v2, Pytest
- Frontend: React 18, TypeScript, Tailwind CSS, Lucide React, date-fns, Vite
- Storage: Supabase Postgres / Dev JSON Store with strict user isolation

**Spec:** `phasewiseprompt.md` (Phase 5), `prd.md` (FR-09, FR-10, FR-11), `design.md`

## Global Constraints

- No fabricated statistics in authenticated mode; empty states must be honest when data is absent.
- No nested `backdrop-filter` blurs (inner surfaces use flat translucent backgrounds per `design.md`).
- Strict user data isolation: all analytics, notifications, and settings must be scoped to `current_user["id"]`.
- Maintain all 29 existing passing backend tests while adding new test coverage for Phase 5.
- Ensure frontend compiles with zero TypeScript errors (`npm run build`).

---

### Task 1: Analytics & Consistency Service & Endpoints

**Files:**
- Create: `backend/app/schemas/analytics.py`
- Create: `backend/app/services/analytics/service.py`
- Create: `backend/app/api/routes/analytics.py`
- Modify: `backend/app/api/v1/api.py`
- Test: `backend/tests/test_analytics.py`

**Interfaces:**
- Consumes: `planner_repo` (`get_sessions`, `get_tasks`, `get_subjects`, `get_assessments`), `document_repo` (`get_all`)
- Produces: `GET /api/v1/analytics/overview?timeframe=week|month`, `GET /api/v1/analytics/streak`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_analytics.py`:
```python
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.repositories.planner_repo import planner_repo

client = TestClient(app)

def test_empty_analytics_for_new_user():
    headers = {"Authorization": "Bearer dev-new-user-token"}
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
    token = f"dev-{user_id}-token"
    headers = {"Authorization": f"Bearer {token}"}
    now = datetime.now(timezone.utc)

    # Create 1 completed session and 1 planned session
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `.\backend\.venv\Scripts\python.exe -m pytest backend/tests/test_analytics.py -v`  
Expected: FAIL with 404 Not Found (route `/api/v1/analytics/overview` not yet defined).

- [ ] **Step 3: Write minimal implementation**

1. Create `backend/app/schemas/analytics.py`:
```python
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class DailyStudyPoint(BaseModel):
    date: str
    day_name: str
    planned_minutes: int
    completed_minutes: int

class SubjectProgressMetric(BaseModel):
    id: str
    title: str
    code: Optional[str] = None
    color: str
    completed_minutes: int
    planned_minutes: int
    total_modules: int
    completed_modules: int
    percentage: int

class TaskCompletionMetric(BaseModel):
    total: int
    completed: int
    in_progress: int
    overdue: int
    completion_rate_pct: int

class SessionMetric(BaseModel):
    total: int
    completed: int
    planned: int
    total_duration_minutes: int

class ConsistencyMetric(BaseModel):
    current_streak_days: int
    longest_streak_days: int
    active_days_count: int

class ActivityEvent(BaseModel):
    id: str
    event_type: str
    title: str
    description: str
    timestamp: datetime
    link_url: Optional[str] = None

class AnalyticsOverviewResponse(BaseModel):
    timeframe: str
    total_planned_minutes: int
    total_completed_minutes: int
    completion_rate_pct: int
    daily_trend: List[DailyStudyPoint]
    subjects: List[SubjectProgressMetric]
    tasks: TaskCompletionMetric
    sessions: SessionMetric
    consistency: ConsistencyMetric
    recent_activity: List[ActivityEvent]
```

2. Create `backend/app/services/analytics/service.py`:
```python
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List
from app.repositories.planner_repo import planner_repo
from app.repositories.document_repo import document_repo

class AnalyticsService:
    def calculate_streak(self, user_id: str) -> Dict[str, int]:
        sessions = planner_repo.get_sessions(user_id)
        completed_sessions = [s for s in sessions if s.get("status") == "completed"]
        if not completed_sessions:
            return {"current_streak_days": 0, "longest_streak_days": 0}

        # Collect unique active dates
        active_dates = {
            s["start_time"].astimezone(timezone.utc).date()
            for s in completed_sessions if "start_time" in s
        }

        today = datetime.now(timezone.utc).date()
        yesterday = today - timedelta(days=1)

        # Current streak: checks today or yesterday as start
        current_streak = 0
        check_date = today if today in active_dates else (yesterday if yesterday in active_dates else None)

        if check_date:
            while check_date in active_dates:
                current_streak += 1
                check_date -= timedelta(days=1)

        # Longest streak calculation
        sorted_dates = sorted(active_dates)
        longest_streak = 0
        temp_streak = 0
        prev_date = None

        for d in sorted_dates:
            if prev_date is None or d == prev_date + timedelta(days=1):
                temp_streak += 1
            else:
                temp_streak = 1
            longest_streak = max(longest_streak, temp_streak)
            prev_date = d

        return {
            "current_streak_days": current_streak,
            "longest_streak_days": max(longest_streak, current_streak),
        }

    def get_recent_activity(self, user_id: str, limit: int = 8) -> List[Dict[str, Any]]:
        activities: List[Dict[str, Any]] = []

        # 1. Sessions completed or planned
        for s in planner_repo.get_sessions(user_id):
            if s.get("status") == "completed":
                activities.append({
                    "id": f"act_session_{s['id']}",
                    "event_type": "session_completed",
                    "title": f"Completed study session: {s.get('title', 'Study block')}",
                    "description": f"Studied for {s.get('duration_minutes', 0)} mins",
                    "timestamp": s.get("updated_at", s.get("created_at")),
                    "link_url": "/planner",
                })

        # 2. Tasks completed
        for t in planner_repo.get_tasks(user_id):
            if t.get("status") == "completed":
                activities.append({
                    "id": f"act_task_{t['id']}",
                    "event_type": "task_completed",
                    "title": f"Completed task: {t.get('title', 'Task')}",
                    "description": f"Priority: {t.get('priority', 'medium').capitalize()}",
                    "timestamp": t.get("updated_at", t.get("created_at")),
                    "link_url": "/tasks",
                })

        # 3. Documents indexed
        for d in document_repo.get_all(user_id):
            if d.get("status") == "indexed":
                activities.append({
                    "id": f"act_doc_{d['id']}",
                    "event_type": "document_indexed",
                    "title": f"Indexed document: {d.get('filename')}",
                    "description": f"{d.get('chunk_count', 0)} chunks ready for RAG assistant",
                    "timestamp": d.get("updated_at", d.get("created_at")),
                    "link_url": "/documents",
                })

        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        return activities[:limit]

    def calculate_overview(self, user_id: str, timeframe: str = "week") -> Dict[str, Any]:
        num_days = 30 if timeframe == "month" else 7
        now = datetime.now(timezone.utc)
        today = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
        start_date = today - timedelta(days=num_days - 1)
        end_date = today + timedelta(days=1)

        sessions = planner_repo.get_sessions(user_id)
        period_sessions = [
            s for s in sessions if start_date <= s["start_time"].astimezone(timezone.utc) < end_date
        ]

        # Daily Trend
        daily_trend = []
        for i in range(num_days):
            day_cursor = start_date + timedelta(days=i)
            next_cursor = day_cursor + timedelta(days=1)
            day_sessions = [
                s for s in period_sessions
                if day_cursor <= s["start_time"].astimezone(timezone.utc) < next_cursor
            ]
            planned_mins = sum(s.get("duration_minutes", 0) for s in day_sessions if s.get("status") == "planned")
            completed_mins = sum(s.get("duration_minutes", 0) for s in day_sessions if s.get("status") == "completed")

            daily_trend.append({
                "date": day_cursor.strftime("%Y-%m-%d"),
                "day_name": day_cursor.strftime("%a"),
                "planned_minutes": planned_mins,
                "completed_minutes": completed_mins,
            })

        total_planned = sum(d["planned_minutes"] for d in daily_trend)
        total_completed = sum(d["completed_minutes"] for d in daily_trend)
        total_tracked = total_planned + total_completed
        completion_pct = int((total_completed / total_tracked) * 100) if total_tracked > 0 else 0

        # Subject Metrics
        subjects_data = planner_repo.get_subjects(user_id)
        subject_metrics = []
        for s in subjects_data:
            top_list = s.get("topics", [])
            total_top = len(top_list)
            done_top = len([t for t in top_list if t.get("status") == "completed"])
            pct = int((done_top / total_top) * 100) if total_top > 0 else 0

            # Session minutes spent on this subject
            subj_sessions = [sess for sess in period_sessions if sess.get("subject_id") == s["id"]]
            c_mins = sum(sess.get("duration_minutes", 0) for sess in subj_sessions if sess.get("status") == "completed")
            p_mins = sum(sess.get("duration_minutes", 0) for sess in subj_sessions if sess.get("status") == "planned")

            subject_metrics.append({
                "id": s["id"],
                "title": s["title"],
                "code": s.get("code"),
                "color": s.get("color", "#43E58B"),
                "completed_minutes": c_mins,
                "planned_minutes": p_mins,
                "total_modules": total_top,
                "completed_modules": done_top,
                "percentage": pct,
            })

        # Task Metrics
        tasks = planner_repo.get_tasks(user_id)
        completed_tasks = len([t for t in tasks if t.get("status") == "completed"])
        in_progress_tasks = len([t for t in tasks if t.get("status") == "in_progress"])
        overdue_tasks = len([
            t for t in tasks
            if t.get("status") != "completed" and t.get("due_date") and t["due_date"] < today
        ])
        task_completion_pct = int((completed_tasks / len(tasks)) * 100) if tasks else 0

        # Session Metrics
        session_metrics = {
            "total": len(period_sessions),
            "completed": len([s for s in period_sessions if s.get("status") == "completed"]),
            "planned": len([s for s in period_sessions if s.get("status") == "planned"]),
            "total_duration_minutes": sum(s.get("duration_minutes", 0) for s in period_sessions),
        }

        # Consistency
        streaks = self.calculate_streak(user_id)
        active_days = len({
            d["date"] for d in daily_trend if d["completed_minutes"] > 0
        })

        return {
            "timeframe": timeframe,
            "total_planned_minutes": total_planned,
            "total_completed_minutes": total_completed,
            "completion_rate_pct": completion_pct,
            "daily_trend": daily_trend,
            "subjects": subject_metrics,
            "tasks": {
                "total": len(tasks),
                "completed": completed_tasks,
                "in_progress": in_progress_tasks,
                "overdue": overdue_tasks,
                "completion_rate_pct": task_completion_pct,
            },
            "sessions": session_metrics,
            "consistency": {
                "current_streak_days": streaks["current_streak_days"],
                "longest_streak_days": streaks["longest_streak_days"],
                "active_days_count": active_days,
            },
            "recent_activity": self.get_recent_activity(user_id),
        }

analytics_service = AnalyticsService()
```

3. Create `backend/app/api/routes/analytics.py`:
```python
from typing import Any, Dict
from fastapi import APIRouter, Depends, Query
from app.api.deps import get_current_user
from app.services.analytics.service import analytics_service
from app.schemas.analytics import AnalyticsOverviewResponse

router = APIRouter(prefix="/analytics", tags=["Analytics & Progress"])

@router.get("/overview", response_model=AnalyticsOverviewResponse)
async def get_analytics_overview(
    timeframe: str = Query(default="week", regex="^(week|month)$"),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    return analytics_service.calculate_overview(current_user["id"], timeframe=timeframe)

@router.get("/streak")
async def get_streak(current_user: Dict[str, Any] = Depends(get_current_user)):
    return analytics_service.calculate_streak(current_user["id"])

@router.get("/activity")
async def get_recent_activity(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    return analytics_service.get_recent_activity(current_user["id"], limit=limit)
```

4. Register `analytics.router` in `backend/app/api/v1/api.py`.

- [ ] **Step 4: Run test to verify it passes**

Run: `.\backend\.venv\Scripts\python.exe -m pytest backend/tests/test_analytics.py -v`  
Expected: PASS (2 tests pass).

- [ ] **Step 5: Commit**

```bash
git add backend/app/schemas/analytics.py backend/app/services/analytics/service.py backend/app/api/routes/analytics.py backend/app/api/v1/api.py backend/tests/test_analytics.py
git commit -m "feat(analytics): add real analytics engine and overview endpoints"
```

---

### Task 2: User Settings & Academic Preferences System

**Files:**
- Create: `backend/app/schemas/settings.py`
- Create: `backend/app/repositories/settings_repo.py`
- Create: `backend/app/api/routes/settings.py`
- Modify: `backend/app/api/routes/dashboard.py`
- Modify: `backend/app/api/v1/api.py`
- Test: `backend/tests/test_settings_and_dashboard.py`

**Interfaces:**
- Consumes: `settings_repo`, `get_current_user`
- Produces: `GET /api/v1/settings`, `PATCH /api/v1/settings`, updated `/api/v1/dashboard/summary`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_settings_and_dashboard.py`:
```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_settings_lifecycle_and_dashboard_integration():
    headers = {"Authorization": "Bearer dev-student-settings"}
    
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

    # 3. Verify dashboard summary reflects updated target_study_hours
    dash_res = client.get("/api/v1/dashboard/summary", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["target_study_hours"] == 6.0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `.\backend\.venv\Scripts\python.exe -m pytest backend/tests/test_settings_and_dashboard.py -v`  
Expected: FAIL with 404 Not Found.

- [ ] **Step 3: Write minimal implementation**

1. Create `backend/app/schemas/settings.py`:
```python
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class UserSettingsBase(BaseModel):
    target_study_hours: float = Field(default=4.0, ge=0.5, le=16.0)
    preferred_session_duration: int = Field(default=45, ge=15, le=180)
    exam_alert_lead_days: int = Field(default=7, ge=1, le=30)
    notify_upcoming_deadlines: bool = True
    notify_session_reminders: bool = True
    notify_document_indexing: bool = True
    display_name: Optional[str] = None
    university: Optional[str] = None
    major: Optional[str] = None

class UserSettingsUpdate(BaseModel):
    target_study_hours: Optional[float] = Field(default=None, ge=0.5, le=16.0)
    preferred_session_duration: Optional[int] = Field(default=None, ge=15, le=180)
    exam_alert_lead_days: Optional[int] = Field(default=None, ge=1, le=30)
    notify_upcoming_deadlines: Optional[bool] = None
    notify_session_reminders: Optional[bool] = None
    notify_document_indexing: Optional[bool] = None
    display_name: Optional[str] = None
    university: Optional[str] = None
    major: Optional[str] = None

class UserSettingsResponse(UserSettingsBase):
    user_id: str
    updated_at: datetime
```

2. Create `backend/app/repositories/settings_repo.py`:
```python
from datetime import datetime, timezone
from typing import Any, Dict

class SettingsRepository:
    def __init__(self):
        self._settings: Dict[str, Dict[str, Any]] = {}

    def get_settings(self, user_id: str) -> Dict[str, Any]:
        if user_id not in self._settings:
            self._settings[user_id] = {
                "user_id": user_id,
                "target_study_hours": 4.0,
                "preferred_session_duration": 45,
                "exam_alert_lead_days": 7,
                "notify_upcoming_deadlines": True,
                "notify_session_reminders": True,
                "notify_document_indexing": True,
                "display_name": None,
                "university": None,
                "major": None,
                "updated_at": datetime.now(timezone.utc),
            }
        return self._settings[user_id]

    def update_settings(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        current = self.get_settings(user_id)
        clean_updates = {k: v for k, v in updates.items() if v is not None}
        current.update(clean_updates)
        current["updated_at"] = datetime.now(timezone.utc)
        return current

settings_repo = SettingsRepository()
```

3. Create `backend/app/api/routes/settings.py`:
```python
from typing import Any, Dict
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.repositories.settings_repo import settings_repo
from app.schemas.settings import UserSettingsResponse, UserSettingsUpdate

router = APIRouter(prefix="/settings", tags=["User Settings"])

@router.get("", response_model=UserSettingsResponse)
async def get_settings(current_user: Dict[str, Any] = Depends(get_current_user)):
    return settings_repo.get_settings(current_user["id"])

@router.patch("", response_model=UserSettingsResponse)
async def update_settings(
    payload: UserSettingsUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    return settings_repo.update_settings(
        current_user["id"],
        payload.model_dump(exclude_unset=True),
    )
```

4. Update `backend/app/api/routes/dashboard.py`:
   - Replace hardcoded `target_study_hours: 4.0` with `settings_repo.get_settings(user_id)["target_study_hours"]`.
   - Replace hardcoded `streak_days: 7` with `analytics_service.calculate_streak(user_id)["current_streak_days"]`.

5. Register `settings.router` in `backend/app/api/v1/api.py`.

- [ ] **Step 4: Run test to verify it passes**

Run: `.\backend\.venv\Scripts\python.exe -m pytest backend/tests/test_settings_and_dashboard.py -v`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/schemas/settings.py backend/app/repositories/settings_repo.py backend/app/api/routes/settings.py backend/app/api/routes/dashboard.py backend/app/api/v1/api.py backend/tests/test_settings_and_dashboard.py
git commit -m "feat(settings): add user settings persistence and integrate into dashboard summary"
```

---

### Task 3: In-App Notifications Engine & Endpoints

**Files:**
- Create: `backend/app/schemas/notification.py`
- Create: `backend/app/repositories/notification_repo.py`
- Create: `backend/app/api/routes/notifications.py`
- Modify: `backend/app/api/v1/api.py`
- Test: `backend/tests/test_notifications.py`

**Interfaces:**
- Consumes: `planner_repo`, `document_repo`, `settings_repo`
- Produces: `GET /api/v1/notifications`, `PATCH /api/v1/notifications/{id}/read`, `POST /api/v1/notifications/mark-all-read`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_notifications.py`:
```python
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.repositories.planner_repo import planner_repo

client = TestClient(app)

def test_notification_sync_and_deduplication():
    user_id = "notif-user-1"
    headers = {"Authorization": f"Bearer dev-{user_id}-token"}
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `.\backend\.venv\Scripts\python.exe -m pytest backend/tests/test_notifications.py -v`  
Expected: FAIL with 404 Not Found.

- [ ] **Step 3: Write minimal implementation**

1. Create `backend/app/schemas/notification.py`:
```python
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str  # 'exam_alert' | 'task_deadline' | 'session_reminder' | 'document_indexed'
    title: str
    message: str
    link_url: Optional[str] = None
    is_read: bool
    dedupe_key: str
    created_at: datetime

class NotificationsListResponse(BaseModel):
    notifications: List[NotificationResponse]
    unread_count: int
```

2. Create `backend/app/repositories/notification_repo.py`:
```python
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from app.repositories.planner_repo import planner_repo
from app.repositories.document_repo import document_repo
from app.repositories.settings_repo import settings_repo

class NotificationRepository:
    def __init__(self):
        self._notifications: Dict[str, Dict[str, Any]] = {}

    def _now(self) -> datetime:
        return datetime.now(timezone.utc)

    def sync_notifications(self, user_id: str):
        settings = settings_repo.get_settings(user_id)
        now = self._now()
        today = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

        # 1. Upcoming exams
        if settings.get("notify_upcoming_deadlines", True):
            lead_days = settings.get("exam_alert_lead_days", 7)
            assessments = planner_repo.get_assessments(user_id)
            for a in assessments:
                a_date = a["assessment_date"].astimezone(timezone.utc)
                if today <= a_date <= today + timedelta(days=lead_days):
                    days_left = max(0, (a_date.date() - today.date()).days)
                    dedupe_key = f"exam_{a['id']}_{a_date.strftime('%Y-%m-%d')}"
                    self._create_if_not_exists(
                        user_id=user_id,
                        dedupe_key=dedupe_key,
                        notif_type="exam_alert",
                        title=f"Upcoming Exam: {a['title']}",
                        message=f"Scheduled in {days_left} days ({a_date.strftime('%b %d')}).",
                        link_url="/calendar",
                    )

        # 2. Upcoming tasks
        if settings.get("notify_upcoming_deadlines", True):
            tasks = planner_repo.get_tasks(user_id)
            for t in tasks:
                if t.get("status") != "completed" and t.get("due_date"):
                    due_date = t["due_date"].astimezone(timezone.utc)
                    if today <= due_date <= today + timedelta(days=2):
                        dedupe_key = f"task_{t['id']}_{due_date.strftime('%Y-%m-%d')}"
                        self._create_if_not_exists(
                            user_id=user_id,
                            dedupe_key=dedupe_key,
                            notif_type="task_deadline",
                            title=f"Task Due Soon: {t['title']}",
                            message=f"Due on {due_date.strftime('%b %d')}. Priority: {t.get('priority', 'medium').capitalize()}.",
                            link_url="/tasks",
                        )

        # 3. Documents indexed
        if settings.get("notify_document_indexing", True):
            docs = document_repo.get_all(user_id)
            for d in docs:
                if d.get("status") == "indexed":
                    dedupe_key = f"doc_{d['id']}_indexed"
                    self._create_if_not_exists(
                        user_id=user_id,
                        dedupe_key=dedupe_key,
                        notif_type="document_indexed",
                        title=f"Document Indexed: {d.get('filename')}",
                        message=f"Indexed successfully into {d.get('chunk_count', 0)} chunks for AI chat.",
                        link_url="/documents",
                    )

    def _create_if_not_exists(
        self,
        user_id: str,
        dedupe_key: str,
        notif_type: str,
        title: str,
        message: str,
        link_url: Optional[str] = None,
    ):
        for n in self._notifications.values():
            if n["user_id"] == user_id and n["dedupe_key"] == dedupe_key:
                return
        notif_id = str(uuid.uuid4())
        self._notifications[notif_id] = {
            "id": notif_id,
            "user_id": user_id,
            "type": notif_type,
            "title": title,
            "message": message,
            "link_url": link_url,
            "is_read": False,
            "dedupe_key": dedupe_key,
            "created_at": self._now(),
        }

    def get_notifications(self, user_id: str) -> List[Dict[str, Any]]:
        self.sync_notifications(user_id)
        user_notifs = [n for n in self._notifications.values() if n["user_id"] == user_id]
        return sorted(user_notifs, key=lambda x: x["created_at"], reverse=True)

    def mark_read(self, user_id: str, notification_id: str) -> Optional[Dict[str, Any]]:
        notif = self._notifications.get(notification_id)
        if not notif or notif["user_id"] != user_id:
            return None
        notif["is_read"] = True
        return notif

    def mark_all_read(self, user_id: str) -> int:
        count = 0
        for n in self._notifications.values():
            if n["user_id"] == user_id and not n["is_read"]:
                n["is_read"] = True
                count += 1
        return count

notification_repo = NotificationRepository()
```

3. Create `backend/app/api/routes/notifications.py`:
```python
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.repositories.notification_repo import notification_repo
from app.schemas.notification import NotificationResponse, NotificationsListResponse

router = APIRouter(prefix="/notifications", tags=["In-App Notifications"])

@router.get("", response_model=NotificationsListResponse)
async def list_notifications(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["id"]
    notifs = notification_repo.get_notifications(user_id)
    unread = len([n for n in notifs if not n["is_read"]])
    return {"notifications": notifs, "unread_count": unread}

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    notif = notification_repo.mark_read(current_user["id"], notification_id)
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return notif

@router.post("/mark-all-read")
async def mark_all_notifications_read(current_user: Dict[str, Any] = Depends(get_current_user)):
    notification_repo.mark_all_read(current_user["id"])
    return {"status": "success", "unread_count": 0}
```

4. Register `notifications.router` in `backend/app/api/v1/api.py`.

- [ ] **Step 4: Run test to verify it passes**

Run: `.\backend\.venv\Scripts\python.exe -m pytest backend/tests/test_notifications.py -v`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/schemas/notification.py backend/app/repositories/notification_repo.py backend/app/api/routes/notifications.py backend/app/api/v1/api.py backend/tests/test_notifications.py
git commit -m "feat(notifications): add in-app notifications engine with deduplication"
```

---

### Task 4: Frontend Types & Notification Dropdown in TopBar

**Files:**
- Create: `frontend/src/types/analytics.ts`
- Create: `frontend/src/types/notification.ts`
- Create: `frontend/src/types/settings.ts`
- Create: `frontend/src/components/layout/NotificationDropdown.tsx`
- Modify: `frontend/src/components/layout/TopBar.tsx`

**Interfaces:**
- Consumes: `/api/v1/notifications`, `/api/v1/notifications/{id}/read`, `/api/v1/notifications/mark-all-read`
- Produces: Interactive notification badge & dropdown in TopBar

- [ ] **Step 1: Write TypeScript interfaces**

1. Create `frontend/src/types/notification.ts`:
```typescript
export interface AppNotification {
  id: string;
  user_id: string;
  type: 'exam_alert' | 'task_deadline' | 'session_reminder' | 'document_indexed';
  title: string;
  message: string;
  link_url?: string;
  is_read: boolean;
  dedupe_key: string;
  created_at: string;
}

export interface NotificationsListResponse {
  notifications: AppNotification[];
  unread_count: number;
}
```

2. Create `frontend/src/types/settings.ts`:
```typescript
export interface UserSettings {
  user_id: string;
  target_study_hours: number;
  preferred_session_duration: number;
  exam_alert_lead_days: number;
  notify_upcoming_deadlines: boolean;
  notify_session_reminders: boolean;
  notify_document_indexing: boolean;
  display_name: string | null;
  university: string | null;
  major: string | null;
  updated_at: string;
}
```

3. Create `frontend/src/types/analytics.ts`:
```typescript
export interface DailyStudyPoint {
  date: string;
  day_name: string;
  planned_minutes: int;
  completed_minutes: int;
}

export interface SubjectProgressMetric {
  id: string;
  title: string;
  code?: string;
  color: string;
  completed_minutes: number;
  planned_minutes: number;
  total_modules: number;
  completed_modules: number;
  percentage: number;
}

export interface TaskCompletionMetric {
  total: number;
  completed: number;
  in_progress: number;
  overdue: number;
  completion_rate_pct: number;
}

export interface ConsistencyMetric {
  current_streak_days: number;
  longest_streak_days: number;
  active_days_count: number;
}

export interface ActivityEvent {
  id: string;
  event_type: string;
  title: string;
  description: string;
  timestamp: string;
  link_url?: string;
}

export interface AnalyticsOverview {
  timeframe: 'week' | 'month';
  total_planned_minutes: number;
  total_completed_minutes: number;
  completion_rate_pct: number;
  daily_trend: DailyStudyPoint[];
  subjects: SubjectProgressMetric[];
  tasks: TaskCompletionMetric;
  sessions: {
    total: number;
    completed: number;
    planned: number;
    total_duration_minutes: number;
  };
  consistency: ConsistencyMetric;
  recent_activity: ActivityEvent[];
}
```

- [ ] **Step 2: Implement NotificationDropdown component**

Create `frontend/src/components/layout/NotificationDropdown.tsx`:
- Fetches `/notifications` on mount.
- Renders Bell button with pulsating unread counter badge if `unread_count > 0`.
- Renders Glassmorphism dropdown card with list of notifications.
- Displays appropriate icons (AlertCircle for exams, CheckSquare for tasks, BookOpen for docs).
- Provides "Mark all as read" button.
- Clicking an item marks it read via `PATCH /notifications/{id}/read` and navigates to `link_url`.

- [ ] **Step 3: Integrate NotificationDropdown into TopBar**

Update `frontend/src/components/layout/TopBar.tsx`:
- Replace the static Bell button with `<NotificationDropdown />`.

- [ ] **Step 4: Verify frontend builds cleanly**

Run: `npm run build` in `frontend/`  
Expected: Clean build without TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/ frontend/src/components/layout/NotificationDropdown.tsx frontend/src/components/layout/TopBar.tsx
git commit -m "feat(ui): add notifications dropdown in TopBar with unread badge and routing"
```

---

### Task 5: Frontend Dashboard Completion & Recent Activity

**Files:**
- Create: `frontend/src/features/dashboard/components/WeeklyStudyChart.tsx`
- Create: `frontend/src/features/dashboard/components/RecentActivityFeed.tsx`
- Modify: `frontend/src/features/dashboard/DashboardPage.tsx`

**Interfaces:**
- Consumes: `/api/v1/dashboard/summary`, `/api/v1/analytics/overview`
- Produces: Polished dashboard showing real weekly study hours chart, real streak, real target hours, and recent activity feed.

- [ ] **Step 1: Create WeeklyStudyChart component**

Create `frontend/src/features/dashboard/components/WeeklyStudyChart.tsx`:
- Accepts `dailyTrend: DailyStudyPoint[]`.
- Visualizes 7 days with planned vs completed hours using Glassmorphism styled vertical bars with emerald accent (`#43E58B`) for completed and indigo (`#8353E2`) for planned.
- Shows day labels (Mon, Tue...) and hover values in hours/minutes.
- Handles empty state when no study hours are recorded yet.

- [ ] **Step 2: Create RecentActivityFeed component**

Create `frontend/src/features/dashboard/components/RecentActivityFeed.tsx`:
- Accepts `activities: ActivityEvent[]`.
- Displays recent study milestones, task completions, and indexed documents with relative timestamps and clickable links.
- Shows empty state ("No recent activity recorded. Complete a study session or task to see your progress!").

- [ ] **Step 3: Update DashboardPage.tsx**

Modify `frontend/src/features/dashboard/DashboardPage.tsx`:
- Fetch both `/dashboard/summary` and `/analytics/overview?timeframe=week`.
- Pass real `analytics.daily_trend` to `<WeeklyStudyChart />`.
- Pass real `analytics.recent_activity` to `<RecentActivityFeed />`.
- Connect Quick Ask input with deep link navigation to `/assistant?q=...`.
- Ensure all cards use `design.md` tokens (Level 1/2, flat inner translucent panels, high contrast).

- [ ] **Step 4: Verify frontend build**

Run: `npm run build` in `frontend/`  
Expected: Clean build.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/dashboard/components/ frontend/src/features/dashboard/DashboardPage.tsx
git commit -m "feat(dashboard): integrate weekly study chart, real streaks, and recent activity"
```

---

### Task 6: Frontend Progress & Analytics Page Implementation

**Files:**
- Modify: `frontend/src/features/analytics/AnalyticsPage.tsx`
- Create: `frontend/src/features/analytics/components/AnalyticsTrendChart.tsx`
- Create: `frontend/src/features/analytics/components/SubjectProgressCard.tsx`

**Interfaces:**
- Consumes: `GET /api/v1/analytics/overview?timeframe=week|month`
- Produces: Complete Progress & Analytics screen with real filters, progress bars, and consistency metrics.

- [ ] **Step 1: Create AnalyticsTrendChart component**

Create `frontend/src/features/analytics/components/AnalyticsTrendChart.tsx`:
- Displays interactive daily study hours comparison (planned vs completed) across the selected timeframe (7 days or 30 days).
- Glassmorphism bar graph with tooltip on hover displaying date, planned hours, and completed hours.
- Honest empty state when no hours have been logged yet.

- [ ] **Step 2: Create SubjectProgressCard component**

Create `frontend/src/features/analytics/components/SubjectProgressCard.tsx`:
- Displays subject-by-subject curriculum progress bars, completed modules count, and study hours spent.

- [ ] **Step 3: Implement full AnalyticsPage**

Replace placeholder in `frontend/src/features/analytics/AnalyticsPage.tsx`:
- State for `timeframe` ('week' | 'month').
- Header with toggle buttons (Last 7 Days / Last 30 Days).
- 4 top summary metric cards:
  1. Completed Study Time (with planned hours and completion %).
  2. Task Completion Rate (completed vs total tasks, overdue count).
  3. Study Consistency Streak (current streak and longest streak in days).
  4. Active Study Days (number of active days in timeframe).
- Central grid:
  - Left column: `<AnalyticsTrendChart />` and `<SubjectProgressCard />`.
  - Right column: Task Distribution breakdown (completed, in progress, overdue) and Academic Milestones (upcoming exams / deadlines).
- Responsive layout supporting mobile and desktop.

- [ ] **Step 4: Verify frontend build**

Run: `npm run build` in `frontend/`  
Expected: Clean build.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/analytics/
git commit -m "feat(analytics-ui): complete progress and analytics screen with real metrics"
```

---

### Task 7: Frontend Settings Page Implementation

**Files:**
- Modify: `frontend/src/features/settings/SettingsPage.tsx`

**Interfaces:**
- Consumes: `GET /api/v1/settings`, `PATCH /api/v1/settings`
- Produces: Complete settings screen allowing users to edit study preferences, profile, and notification toggles with persistent save.

- [ ] **Step 1: Implement full SettingsPage**

Update `frontend/src/features/settings/SettingsPage.tsx`:
- Load user settings from `/settings` on mount.
- Section 1: Profile & Academic Info
  - Display Name, University / College, Major / Specialization.
- Section 2: Study Habits & Targets
  - Target Study Hours per Day (numeric input or stepper: 1h to 12h).
  - Preferred Session Duration (interactive pills: 25m Pomodoro, 45m Standard, 60m Deep Work, 90m Extended).
- Section 3: In-App Reminder Preferences
  - Toggles for Upcoming Exam Alerts, Task Deadlines, Study Session Reminders.
  - Exam Alert Lead Time selector (3, 7, 14 days).
- Section 4: Security & Privacy
  - Details regarding Supabase RLS isolation and local Ollama privacy.
- Sticky or prominent "Save Changes" button with loading state and success feedback toast.

- [ ] **Step 2: Verify frontend build**

Run: `npm run build` in `frontend/`  
Expected: Clean build.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/settings/SettingsPage.tsx
git commit -m "feat(settings-ui): complete account and study settings screen with API persistence"
```

---

### Task 8: End-to-End Verification, Responsive QA, and Documentation

**Files:**
- Modify: `progress.md`

**Interfaces:**
- Comprehensive QA testing all Phase 5 exit criteria.

- [ ] **Step 1: Run all backend tests**

Run: `.\backend\.venv\Scripts\python.exe -m pytest -c backend/pytest.ini backend/tests -v`  
Expected: All tests pass (including existing 29 tests + new analytics, settings, and notification tests).

- [ ] **Step 2: Run frontend production build**

Run: `npm run build` in `frontend/`  
Expected: Production build passes with 0 errors.

- [ ] **Step 3: Verify responsive viewports and visual polish**

Verify that all 9 screens render cleanly at:
- 1440px (Desktop)
- 1024px (Tablet Landscape)
- 768px (Tablet Portrait)
- 390px (Mobile)
Ensure no overlapping cards, clipping, or nested blur artifacts.

- [ ] **Step 4: Update progress.md**

Document Phase 5 completion, verified test commands, and exact evidence.

- [ ] **Step 5: Commit**

```bash
git add progress.md
git commit -m "docs: mark Phase 5 complete with verification evidence"
```
