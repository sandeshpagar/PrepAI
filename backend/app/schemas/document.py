from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


DocumentStatus = Literal["queued", "processing", "indexed", "failed"]
DocumentFileType = Literal["pdf", "docx", "pptx", "txt", "md"]


class DocumentBase(BaseModel):
    title: str
    subject_id: Optional[str] = None


class DocumentCreate(DocumentBase):
    original_filename: str
    file_type: DocumentFileType
    file_size_bytes: int
    storage_path: str


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    subject_id: Optional[str] = None


class DocumentResponse(DocumentBase):
    id: str
    user_id: str
    original_filename: str
    file_type: DocumentFileType
    file_size_bytes: int
    storage_path: str
    status: DocumentStatus
    error_message: Optional[str] = None
    page_count: Optional[int] = None
    chunk_count: int = 0
    created_at: datetime
    updated_at: datetime


class DocumentChunkResponse(BaseModel):
    id: str
    document_id: str
    chunk_index: int
    content: str
    page_or_slide: Optional[int] = None
    token_count: Optional[int] = None
    created_at: datetime
