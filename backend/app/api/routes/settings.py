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
