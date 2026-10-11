from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.repositories.planner_repo import planner_repo
from app.schemas.planner import (
    SubjectCreate,
    SubjectResponse,
    SubjectUpdate,
    TopicCreate,
    TopicResponse,
    TopicUpdate,
)

router = APIRouter(prefix="/subjects", tags=["Subjects & Syllabus"])


@router.get("", response_model=List[SubjectResponse])
async def list_subjects(current_user: Dict[str, Any] = Depends(get_current_user)):
    return planner_repo.get_subjects(current_user["id"])


@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
async def create_subject(
    payload: SubjectCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    return planner_repo.create_subject(current_user["id"], payload.model_dump())


@router.get("/{subject_id}", response_model=SubjectResponse)
async def get_subject(
    subject_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    subj = planner_repo.get_subject(current_user["id"], subject_id)
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subj


@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: str,
    payload: SubjectUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    subj = planner_repo.update_subject(current_user["id"], subject_id, payload.model_dump())
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subj


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    deleted = planner_repo.delete_subject(current_user["id"], subject_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Subject not found")


@router.post("/{subject_id}/topics", response_model=TopicResponse, status_code=status.HTTP_201_CREATED)
async def create_topic(
    subject_id: str,
    payload: TopicCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    data = payload.model_dump()
    data["subject_id"] = subject_id
    topic = planner_repo.create_topic(current_user["id"], data)
    if not topic:
        raise HTTPException(status_code=404, detail="Subject not found")
    return topic


@router.put("/{subject_id}/topics/{topic_id}", response_model=TopicResponse)
async def update_topic(
    subject_id: str,
    topic_id: str,
    payload: TopicUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    topic = planner_repo.update_topic(current_user["id"], topic_id, payload.model_dump())
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


@router.delete("/{subject_id}/topics/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_topic(
    subject_id: str,
    topic_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    deleted = planner_repo.delete_topic(current_user["id"], topic_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Topic not found")
