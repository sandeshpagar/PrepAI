from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.api.deps import get_current_user
from app.repositories.planner_repo import planner_repo
from app.schemas.planner import (
    StudySessionCreate,
    StudySessionResponse,
    StudySessionUpdate,
)

router = APIRouter(prefix="/sessions", tags=["Study Sessions"])


@router.get("", response_model=List[StudySessionResponse])
async def list_sessions(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    return planner_repo.get_sessions(current_user["id"], start_date=start_date, end_date=end_date)


@router.post("", response_model=StudySessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: StudySessionCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    return planner_repo.create_session(current_user["id"], payload.model_dump())


@router.put("/{session_id}", response_model=StudySessionResponse)
async def update_session(
    session_id: str,
    payload: StudySessionUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    updated = planner_repo.update_session(current_user["id"], session_id, payload.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="Study session not found")
    return updated


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    deleted = planner_repo.delete_session(current_user["id"], session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Study session not found")
