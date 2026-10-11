from typing import Any, Dict
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me", summary="Get Current Authenticated User")
async def get_current_user_profile(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Returns the identity of the user derived from the validated Supabase Bearer token.
    """
    return {
        "id": current_user["id"],
        "email": current_user.get("email"),
        "role": current_user.get("role"),
    }
