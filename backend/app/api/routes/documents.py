from typing import Any, Dict, List, Optional
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from app.api.deps import get_current_user
from app.repositories.document_repo import document_repo
from app.schemas.document import (
    DocumentChunkResponse,
    DocumentResponse,
    DocumentUpdate,
)
from app.services.documents.pipeline import run_document_ingestion

router = APIRouter(prefix="/documents", tags=["Academic Documents"])

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25MB
ALLOWED_EXTENSIONS = {"pdf", "docx", "pptx", "txt", "md"}


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    subject_id: Optional[str] = Form(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    user_id = current_user["id"]
    filename = file.filename or "uploaded_document"
    ext = filename.split(".")[-1].lower() if "." in filename else ""

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '.{ext}'. Supported formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}.",
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes).",
        )

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds maximum allowed limit of 25MB.",
        )

    doc_title = title.strip() if title and title.strip() else filename.rsplit(".", 1)[0]

    # Create document record first to obtain ID
    doc_data = {
        "title": doc_title,
        "subject_id": subject_id if subject_id else None,
        "original_filename": filename,
        "file_type": ext,
        "file_size_bytes": len(file_bytes),
        "storage_path": "",
    }
    created_doc = document_repo.create_document(user_id, doc_data)
    doc_id = created_doc["id"]

    # Save to storage path
    storage_path = f"{user_id}/{doc_id}/{filename}"
    document_repo.save_file(storage_path, file_bytes)
    document_repo.update_document(user_id, doc_id, {"storage_path": storage_path})

    # Run ingestion pipeline
    ingested_doc = run_document_ingestion(
        user_id=user_id,
        document_id=doc_id,
        file_bytes=file_bytes,
        file_type=ext,
    )

    return ingested_doc


@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    status: Optional[str] = Query(None),
    subject_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    return document_repo.get_documents(
        user_id=current_user["id"],
        status=status,
        subject_id=subject_id,
        search=search,
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    doc = document_repo.get_document(current_user["id"], document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc


@router.get("/{document_id}/chunks", response_model=List[DocumentChunkResponse])
async def get_document_chunks(
    document_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    doc = document_repo.get_document(current_user["id"], document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return document_repo.get_chunks(current_user["id"], document_id)


@router.patch("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    payload: DocumentUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    updated = document_repo.update_document(
        current_user["id"],
        document_id,
        payload.model_dump(exclude_unset=True),
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Document not found.")
    return updated


@router.post("/{document_id}/retry", response_model=DocumentResponse)
async def retry_document_ingestion(
    document_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    user_id = current_user["id"]
    doc = document_repo.get_document(user_id, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    storage_path = doc.get("storage_path")
    file_bytes = document_repo.get_file(storage_path) if storage_path else None
    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="Document source file could not be retrieved from storage for retry.",
        )

    ingested = run_document_ingestion(
        user_id=user_id,
        document_id=document_id,
        file_bytes=file_bytes,
        file_type=doc["file_type"],
    )
    return ingested


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    deleted = document_repo.delete_document(current_user["id"], document_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found.")
