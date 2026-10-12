from typing import Any, Dict
from fastapi import APIRouter, Depends, Query
from app.api.deps import get_current_user
from app.services.analytics import analytics_service
from app.schemas.analytics import AnalyticsOverviewResponse

router = APIRouter(prefix="/analytics", tags=["Analytics & Progress"])

@router.get("/overview", response_model=AnalyticsOverviewResponse)
async def get_analytics_overview(
    timeframe: str = Query(default="week", pattern="^(week|month)$"),
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
