from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class DailyStudyPoint(BaseModel):
    date: str
    day_name: str
    planned_minutes: int
    completed_minutes: int

class SubjectProgressMetric(BaseModel):
    id: str
    title: str
    code: Optional[str] = None
    color: str
    completed_minutes: int
    planned_minutes: int
    total_modules: int
    completed_modules: int
    percentage: int

class TaskCompletionMetric(BaseModel):
    total: int
    completed: int
    in_progress: int
    overdue: int
    completion_rate_pct: int

class SessionMetric(BaseModel):
    total: int
    completed: int
    planned: int
    total_duration_minutes: int

class ConsistencyMetric(BaseModel):
    current_streak_days: int
    longest_streak_days: int
    active_days_count: int

class ActivityEvent(BaseModel):
    id: str
    event_type: str
    title: str
    description: str
    timestamp: datetime
    link_url: Optional[str] = None

class AnalyticsOverviewResponse(BaseModel):
    timeframe: str
    total_planned_minutes: int
    total_completed_minutes: int
    completion_rate_pct: int
    daily_trend: List[DailyStudyPoint]
    subjects: List[SubjectProgressMetric]
    tasks: TaskCompletionMetric
    sessions: SessionMetric
    consistency: ConsistencyMetric
    recent_activity: List[ActivityEvent]
