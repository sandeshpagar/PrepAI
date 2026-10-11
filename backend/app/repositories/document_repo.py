from datetime import datetime, timezone
import uuid
from typing import Any, Dict, List, Optional


class DocumentRepository:
    """
    User-scoped repository for Academic Documents and pgvector Chunks.
    Enforces strict user isolation: User A cannot read, query, or delete User B's documents or chunks.
    """

    def __init__(self):
        self.documents: Dict[str, Dict[str, Any]] = {}
        self.chunks: Dict[str, Dict[str, Any]] = {}
        self.file_storage: Dict[str, bytes] = {}  # storage_path -> file_bytes

    def _now(self) -> datetime:
        return datetime.now(timezone.utc)

    # -------------------------------------------------------------------------
    # Document Records
    # -------------------------------------------------------------------------
    def get_documents(
        self,
        user_id: str,
        status: Optional[str] = None,
        subject_id: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        docs = [d for d in self.documents.values() if d["user_id"] == user_id]

        if status:
            docs = [d for d in docs if d["status"] == status]
        if subject_id:
            docs = [d for d in docs if d.get("subject_id") == subject_id]
        if search:
            q = search.lower().strip()
            docs = [d for d in docs if q in d["title"].lower() or q in d["original_filename"].lower()]

        return sorted(docs, key=lambda x: x["created_at"], reverse=True)

    def get_document(self, user_id: str, document_id: str) -> Optional[Dict[str, Any]]:
        doc = self.documents.get(document_id)
        if doc and doc["user_id"] == user_id:
            return dict(doc)
        return None

    def create_document(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        item_id = str(uuid.uuid4())
        record = {
            "id": item_id,
            "user_id": user_id,
            "status": "queued",
            "error_message": None,
            "page_count": None,
            "chunk_count": 0,
            "created_at": self._now(),
            "updated_at": self._now(),
            **data,
        }
        self.documents[item_id] = record
        return dict(record)

    def update_document(
        self, user_id: str, document_id: str, data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        record = self.documents.get(document_id)
        if not record or record["user_id"] != user_id:
            return None
        clean_data = {k: v for k, v in data.items() if v is not None}
        record.update(clean_data)
        record["updated_at"] = self._now()
        return dict(record)

    def delete_document(self, user_id: str, document_id: str) -> bool:
        record = self.documents.get(document_id)
        if not record or record["user_id"] != user_id:
            return False

        # 1. Delete associated chunks
        self.delete_chunks_by_document(user_id, document_id)

        # 2. Delete file from storage
        storage_path = record.get("storage_path")
        if storage_path and storage_path in self.file_storage:
            del self.file_storage[storage_path]

        # 3. Delete document row
        del self.documents[document_id]
        return True

    # -------------------------------------------------------------------------
    # Document Chunks & Vector Store
    # -------------------------------------------------------------------------
    def get_chunks(self, user_id: str, document_id: str) -> List[Dict[str, Any]]:
        doc = self.get_document(user_id, document_id)
        if not doc:
            return []
        chunks = [
            c for c in self.chunks.values()
            if c["document_id"] == document_id and c["user_id"] == user_id
        ]
        return sorted(chunks, key=lambda x: x["chunk_index"])

    def create_chunks(
        self, user_id: str, document_id: str, chunks_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        created_chunks = []
        for c in chunks_data:
            chunk_id = str(uuid.uuid4())
            record = {
                "id": chunk_id,
                "document_id": document_id,
                "user_id": user_id,
                "created_at": self._now(),
                **c,
            }
            self.chunks[chunk_id] = record
            created_chunks.append(dict(record))

        # Update document chunk_count
        if document_id in self.documents:
            self.documents[document_id]["chunk_count"] = len(self.get_chunks(user_id, document_id))
            self.documents[document_id]["updated_at"] = self._now()

        return created_chunks

    def delete_chunks_by_document(self, user_id: str, document_id: str) -> int:
        to_delete = [
            k for k, v in self.chunks.items()
            if v["document_id"] == document_id and v["user_id"] == user_id
        ]
        for k in to_delete:
            del self.chunks[k]

        if document_id in self.documents:
            self.documents[document_id]["chunk_count"] = 0
            self.documents[document_id]["updated_at"] = self._now()

        return len(to_delete)

    # -------------------------------------------------------------------------
    # Binary File Storage
    # -------------------------------------------------------------------------
    def save_file(self, storage_path: str, file_bytes: bytes) -> str:
        self.file_storage[storage_path] = file_bytes
        return storage_path

    def get_file(self, storage_path: str) -> Optional[bytes]:
        return self.file_storage.get(storage_path)

    def delete_file(self, storage_path: str) -> bool:
        if storage_path in self.file_storage:
            del self.file_storage[storage_path]
            return True
        return False


document_repo = DocumentRepository()
