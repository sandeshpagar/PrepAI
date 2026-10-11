from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.repositories.planner_repo import planner_repo
from app.schemas.planner import AvailabilityRuleCreate, AvailabilityRuleResponse

router = APIRouter(prefix="/availability", tags=["Availability Rules"])


@router.get("", response_model=List[AvailabilityRuleResponse])
async def get_availability(current_user: Dict[str, Any] = Depends(get_current_user)):
    return planner_repo.get_availability(current_user["id"])


@router.put("", response_model=List[AvailabilityRuleResponse])
async def set_availability(
    rules: List[AvailabilityRuleCreate],
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    rules_data = [r.model_dump() for r in rules]
    return planner_repo.set_availability(current_user["id"], rules_data)
