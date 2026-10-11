from datetime import datetime, timezone
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, status
from app.api.deps import get_current_user
from app.repositories.planner_repo import planner_repo
from app.schemas.planner import (
    PlanGenerateRequest,
    PlanPreviewResponse,
    StudySessionBase,
    StudySessionResponse,
)
from app.services.planner.scheduler import generate_study_plan

router = APIRouter(prefix="/planner", tags=["Study Planner Engine"])


@router.post("/generate", response_model=PlanPreviewResponse)
async def generate_plan_preview(
    request: PlanGenerateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    user_id = current_user["id"]
    availability = planner_repo.get_availability(user_id)
    tasks = planner_repo.get_tasks(user_id)
    
    # Flatten syllabus topics
    subjects = planner_repo.get_subjects(user_id)
    topics = []
    for s in subjects:
        topics.extend(s.get("topics", []))

    existing_sessions = planner_repo.get_sessions(user_id)

    return generate_study_plan(
        availability_rules=availability,
        tasks=tasks,
        topics=topics,
        existing_sessions=existing_sessions,
        horizon_days=request.horizon_days,
        session_duration_minutes=request.session_duration_minutes,
        break_duration_minutes=request.break_duration_minutes,
    )


@router.post("/apply", response_model=List[StudySessionResponse], status_code=status.HTTP_201_CREATED)
async def apply_plan(
    sessions: List[StudySessionBase],
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    user_id = current_user["id"]
    created_sessions = []
    for s in sessions:
        created = planner_repo.create_session(user_id, s.model_dump())
        created_sessions.append(created)
    return created_sessions


@router.post("/replan", response_model=PlanPreviewResponse)
async def replan_schedule(
    request: PlanGenerateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)

    # 1. Clear future uncompleted 'planned' sessions; completed sessions are strictly preserved!
    planner_repo.clear_planned_sessions(user_id, from_time=now)

    availability = planner_repo.get_availability(user_id)
    tasks = planner_repo.get_tasks(user_id)
    subjects = planner_repo.get_subjects(user_id)
    topics = []
    for s in subjects:
        topics.extend(s.get("topics", []))

    # Keep completed sessions for overlap avoidance
    existing_sessions = planner_repo.get_sessions(user_id)

    # 2. Re-run deterministic scheduler
    preview = generate_study_plan(
        availability_rules=availability,
        tasks=tasks,
        topics=topics,
        existing_sessions=existing_sessions,
        horizon_days=request.horizon_days,
        session_duration_minutes=request.session_duration_minutes,
        break_duration_minutes=request.break_duration_minutes,
        reference_time=now,
    )

    # 3. Automatically persist new sessions for replan
    for s in preview.planned_sessions:
        planner_repo.create_session(user_id, s.model_dump())

    return preview
