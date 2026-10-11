from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.repositories.planner_repo import planner_repo
from app.schemas.planner import AssessmentCreate, AssessmentResponse

router = APIRouter(prefix="/assessments", tags=["Assessments & Exams"])


@router.get("", response_model=List[AssessmentResponse])
async def list_assessments(current_user: Dict[str, Any] = Depends(get_current_user)):
    return planner_repo.get_assessments(current_user["id"])


@router.post("", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assessment(
    payload: AssessmentCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    return planner_repo.create_assessment(current_user["id"], payload.model_dump())


@router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assessment(
    assessment_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    deleted = planner_repo.delete_assessment(current_user["id"], assessment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Assessment not found")
