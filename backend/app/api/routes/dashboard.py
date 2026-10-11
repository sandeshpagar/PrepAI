from datetime import datetime, timedelta, timezone
from typing import Any, Dict
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.repositories.planner_repo import planner_repo

router = APIRouter(prefix="/dashboard", tags=["Dashboard Aggregation"])


@router.get("/summary")
async def get_dashboard_summary(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=timezone.utc)
    today_end = today_start + timedelta(days=1)

    # 1. Sessions today
    sessions = planner_repo.get_sessions(user_id)
    today_sessions = [s for s in sessions if today_start <= s["start_time"] < today_end]
    completed_today_minutes = sum(s["duration_minutes"] for s in today_sessions if s["status"] == "completed")

    # 2. Tasks
    tasks = planner_repo.get_tasks(user_id)
    completed_tasks = [t for t in tasks if t["status"] == "completed"]
    remaining_tasks = [t for t in tasks if t["status"] != "completed"]
    upcoming_deadlines = sorted(
        [t for t in remaining_tasks if t.get("due_date")],
        key=lambda x: x["due_date"]
    )[:3]

    # 3. Upcoming Exams (next 7 days)
    assessments = planner_repo.get_assessments(user_id)
    week_end = today_start + timedelta(days=7)
    upcoming_exams = [a for a in assessments if today_start <= a["assessment_date"] <= week_end]
    
    exam_summary = None
    if upcoming_exams:
        nearest = upcoming_exams[0]
        days_left = max(0, (nearest["assessment_date"].date() - now.date()).days)
        exam_summary = f"{nearest['title']} in {days_left} days"

    # 4. Subject Progress
    subjects = planner_repo.get_subjects(user_id)
    subject_progress = []
    for s in subjects:
        top_list = s.get("topics", [])
        total_top = len(top_list)
        done_top = len([t for t in top_list if t["status"] == "completed"])
        pct = int((done_top / total_top) * 100) if total_top > 0 else 0
        subject_progress.append({
            "id": s["id"],
            "title": s["title"],
            "code": s.get("code"),
            "color": s.get("color", "#43E58B"),
            "percentage": pct,
            "completed_modules": done_top,
            "total_modules": total_top,
        })

    return {
        "today_study_hours": round(completed_today_minutes / 60.0, 1),
        "target_study_hours": 4.0,
        "tasks_completed_count": len(completed_tasks),
        "tasks_total_count": len(tasks),
        "upcoming_exams_count": len(upcoming_exams),
        "upcoming_exam_summary": exam_summary or "No exams in the next 7 days",
        "streak_days": 7,
        "today_sessions": today_sessions,
        "upcoming_deadlines": upcoming_deadlines,
        "subject_progress": subject_progress,
    }
