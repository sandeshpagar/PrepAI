from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str  # 'exam_alert' | 'task_deadline' | 'session_reminder' | 'document_indexed'
    title: str
    message: str
    link_url: Optional[str] = None
    is_read: bool
    dedupe_key: str
    created_at: datetime

class NotificationsListResponse(BaseModel):
    notifications: List[NotificationResponse]
    unread_count: int
