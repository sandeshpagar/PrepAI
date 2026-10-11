from datetime import date, datetime, time
from typing import List, Literal, Optional
from pydantic import BaseModel, Field

# -----------------------------------------------------------------------------
# Subjects & Syllabus Topics
# -----------------------------------------------------------------------------
class TopicBase(BaseModel):
    title: str
    importance: int = Field(default=3, ge=1, le=5)
    estimated_minutes: int = Field(default=45, gt=0)
    difficulty: int = Field(default=3, ge=1, le=5)
    status: Literal["todo", "in_progress", "completed"] = "todo"
    order_index: int = 0

class TopicCreate(TopicBase):
    subject_id: str

class TopicUpdate(BaseModel):
    title: Optional[str] = None
    importance: Optional[int] = Field(default=None, ge=1, le=5)
    estimated_minutes: Optional[int] = Field(default=None, gt=0)
    difficulty: Optional[int] = Field(default=None, ge=1, le=5)
    status: Optional[Literal["todo", "in_progress", "completed"]] = None
    order_index: Optional[int] = None

class TopicResponse(TopicBase):
    id: str
    subject_id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

class SubjectBase(BaseModel):
    title: str
    code: Optional[str] = None
    color: str = "#43E58B"
    term: Optional[str] = None
    target_completion_date: Optional[date] = None

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    title: Optional[str] = None
    code: Optional[str] = None
    color: Optional[str] = None
    term: Optional[str] = None
    target_completion_date: Optional[date] = None

class SubjectResponse(SubjectBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    topics: List[TopicResponse] = []

# -----------------------------------------------------------------------------
# Tasks & Assessments
# -----------------------------------------------------------------------------
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    subject_id: Optional[str] = None
    topic_id: Optional[str] = None
    category: Literal["assignment", "revision", "practice", "reading", "exam_prep"] = "assignment"
    priority: Literal["low", "medium", "high", "urgent"] = "medium"
    estimated_duration_minutes: int = Field(default=45, gt=0)
    due_date: Optional[datetime] = None
    status: Literal["todo", "in_progress", "completed"] = "todo"

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject_id: Optional[str] = None
    topic_id: Optional[str] = None
    category: Optional[Literal["assignment", "revision", "practice", "reading", "exam_prep"]] = None
    priority: Optional[Literal["low", "medium", "high", "urgent"]] = None
    estimated_duration_minutes: Optional[int] = Field(default=None, gt=0)
    due_date: Optional[datetime] = None
    status: Optional[Literal["todo", "in_progress", "completed"]] = None

class TaskResponse(TaskBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

class AssessmentBase(BaseModel):
    subject_id: str
    title: str
    assessment_date: datetime
    notes: Optional[str] = None

class AssessmentCreate(AssessmentBase):
    pass

class AssessmentResponse(AssessmentBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

# -----------------------------------------------------------------------------
# Availability Rules
# -----------------------------------------------------------------------------
class AvailabilityRuleBase(BaseModel):
    day_of_week: int = Field(ge=0, le=6)  # 0=Monday, 6=Sunday
    start_time: time
    end_time: time
    is_active: bool = True

class AvailabilityRuleCreate(AvailabilityRuleBase):
    pass

class AvailabilityRuleResponse(AvailabilityRuleBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

# -----------------------------------------------------------------------------
# Study Sessions
# -----------------------------------------------------------------------------
class StudySessionBase(BaseModel):
    title: str
    subject_id: Optional[str] = None
    topic_id: Optional[str] = None
    task_id: Optional[str] = None
    assessment_id: Optional[str] = None
    start_time: datetime
    end_time: datetime
    duration_minutes: int = Field(gt=0)
    status: Literal["planned", "in_progress", "completed", "skipped"] = "planned"
    session_type: Literal["study", "revision", "practice"] = "study"
    priority_score: float = 0.0
    reasoning: Optional[str] = None

class StudySessionCreate(StudySessionBase):
    pass

class StudySessionUpdate(BaseModel):
    status: Optional[Literal["planned", "in_progress", "completed", "skipped"]] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    reasoning: Optional[str] = None

class StudySessionResponse(StudySessionBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

# -----------------------------------------------------------------------------
# Planner Engine Request & Preview DTOs
# -----------------------------------------------------------------------------
class PlanGenerateRequest(BaseModel):
    horizon_days: int = Field(default=7, ge=1, le=30)
    session_duration_minutes: int = Field(default=45, ge=15, le=180)
    break_duration_minutes: int = Field(default=15, ge=5, le=60)
    include_revisions: bool = True

class UnscheduledItem(BaseModel):
    id: str
    title: str
    reason: str
    estimated_minutes: int

class PlanPreviewResponse(BaseModel):
    planned_sessions: List[StudySessionBase]
    unscheduled_items: List[UnscheduledItem]
    total_planned_minutes: int
    total_available_minutes: int
    reasoning_summary: List[str]
