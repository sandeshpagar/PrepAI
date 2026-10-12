from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.repositories.notification_repo import notification_repo
from app.schemas.notification import NotificationResponse, NotificationsListResponse

router = APIRouter(prefix="/notifications", tags=["In-App Notifications"])

@router.get("", response_model=NotificationsListResponse)
async def list_notifications(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["id"]
    notifs = notification_repo.get_notifications(user_id)
    unread = len([n for n in notifs if not n["is_read"]])
    return {"notifications": notifs, "unread_count": unread}

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    notif = notification_repo.mark_read(current_user["id"], notification_id)
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return notif

@router.post("/mark-all-read")
async def mark_all_notifications_read(current_user: Dict[str, Any] = Depends(get_current_user)):
    notification_repo.mark_all_read(current_user["id"])
    return {"status": "success", "unread_count": 0}
