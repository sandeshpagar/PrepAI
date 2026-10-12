from datetime import datetime
from typing import Any, Literal, Optional
from pydantic import BaseModel, Field, model_validator


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
    file_size_bytes: int = Field(default=0)
    storage_path: str = Field(default="")
    status: DocumentStatus
    error_message: Optional[str] = None
    page_count: Optional[int] = None
    chunk_count: int = 0
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "file_size_bytes" not in data and "file_size" in data:
                data["file_size_bytes"] = data["file_size"]
            elif "file_size_bytes" not in data:
                data["file_size_bytes"] = 0
            if "storage_path" not in data:
                data["storage_path"] = ""
        return data


class DocumentChunkResponse(BaseModel):
    id: str
    document_id: str
    chunk_index: int
    content: str
    page_or_slide: Optional[int] = None
    token_count: Optional[int] = None
    created_at: datetime
