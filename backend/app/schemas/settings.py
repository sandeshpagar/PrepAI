from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class UserSettingsBase(BaseModel):
    target_study_hours: float = Field(default=4.0, ge=0.5, le=16.0)
    preferred_session_duration: int = Field(default=45, ge=15, le=180)
    exam_alert_lead_days: int = Field(default=7, ge=1, le=30)
    notify_upcoming_deadlines: bool = True
    notify_session_reminders: bool = True
    notify_document_indexing: bool = True
    display_name: Optional[str] = None
    university: Optional[str] = None
    major: Optional[str] = None

class UserSettingsUpdate(BaseModel):
    target_study_hours: Optional[float] = Field(default=None, ge=0.5, le=16.0)
    preferred_session_duration: Optional[int] = Field(default=None, ge=15, le=180)
    exam_alert_lead_days: Optional[int] = Field(default=None, ge=1, le=30)
    notify_upcoming_deadlines: Optional[bool] = None
    notify_session_reminders: Optional[bool] = None
    notify_document_indexing: Optional[bool] = None
    display_name: Optional[str] = None
    university: Optional[str] = None
    major: Optional[str] = None

class UserSettingsResponse(UserSettingsBase):
    user_id: str
    updated_at: datetime
