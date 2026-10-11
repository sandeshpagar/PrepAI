from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from app.api.deps import get_current_user
from app.repositories.planner_repo import planner_repo

router = APIRouter(prefix="/calendar", tags=["Academic Calendar"])


@router.get("/events")
async def get_calendar_events(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """
    Aggregates study sessions, task deadlines, and exams into a unified timetable.
    """
    user_id = current_user["id"]
    events = []

    # 1. Study Sessions
    sessions = planner_repo.get_sessions(user_id, start_date=start_date, end_date=end_date)
    for s in sessions:
        events.append({
            "id": s["id"],
            "title": s["title"],
            "event_type": "study_session",
            "start_time": s["start_time"],
            "end_time": s["end_time"],
            "status": s["status"],
            "session_type": s["session_type"],
            "priority_score": s.get("priority_score"),
            "subject_id": s.get("subject_id"),
        })

    # 2. Tasks with due dates
    tasks = planner_repo.get_tasks(user_id)
    for t in tasks:
        due = t.get("due_date")
        if due:
            if start_date and due < start_date:
                continue
            if end_date and due > end_date:
                continue
            events.append({
                "id": t["id"],
                "title": f"Deadline: {t['title']}",
                "event_type": "task_deadline",
                "start_time": due,
                "end_time": due,
                "status": t["status"],
                "priority": t["priority"],
                "category": t["category"],
            })

    # 3. Assessments / Exams
    assessments = planner_repo.get_assessments(user_id)
    for a in assessments:
        adate = a["assessment_date"]
        if start_date and adate < start_date:
            continue
        if end_date and adate > end_date:
            continue
        events.append({
            "id": a["id"],
            "title": f"Exam: {a['title']}",
            "event_type": "assessment",
            "start_time": adate,
            "end_time": adate,
            "notes": a.get("notes"),
            "subject_id": a["subject_id"],
        })

    return sorted(events, key=lambda x: x["start_time"])
