from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.api.deps import get_current_user
from app.repositories.planner_repo import planner_repo
from app.schemas.planner import TaskCreate, TaskResponse, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    return planner_repo.get_tasks(current_user["id"], status=status_filter)


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    return planner_repo.create_task(current_user["id"], payload.model_dump())


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    task = planner_repo.get_task(current_user["id"], task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    task = planner_repo.update_task(current_user["id"], task_id, payload.model_dump())
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    deleted = planner_repo.delete_task(current_user["id"], task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
