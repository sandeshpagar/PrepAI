from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class Citation(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    page_or_slide: Optional[int] = None
    quote: str
    similarity_score: float = Field(default=0.0, ge=0.0, le=1.0)


class ChatMessageCreate(BaseModel):
    content: str
    document_ids: Optional[List[str]] = None


class ChatMessageResponse(BaseModel):
    id: str
    conversation_id: str
    user_id: str
    role: Literal["user", "assistant", "system"]
    content: str
    citations: List[Citation] = Field(default_factory=list)
    retrieval_metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class ConversationCreate(BaseModel):
    title: Optional[str] = None
    document_ids: Optional[List[str]] = None


class ConversationUpdate(BaseModel):
    title: str


class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    document_ids: Optional[List[str]] = None
    message_count: int = 0
    created_at: datetime
    updated_at: datetime


class ConversationDetailResponse(ConversationResponse):
    messages: List[ChatMessageResponse] = Field(default_factory=list)
