from datetime import datetime, timezone
import json
import os
from typing import Any, Dict, List, Optional
import uuid


class ChatRepository:
    """
    User-scoped repository for Conversations and Chat Messages.
    Enforces strict user isolation: User A cannot read or modify User B's chats.
    Includes automatic disk persistence in local development mode.
    """

    def __init__(self):
        self.conversations: Dict[str, Dict[str, Any]] = {}
        self.messages: Dict[str, Dict[str, Any]] = {}
        self._store_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "dev_chat.json"
        )
        if not self._load_from_disk():
            self._seed_development_chat()

    def _now(self) -> datetime:
        return datetime.now(timezone.utc)

    def _save_to_disk(self):
        try:
            from app.core.config import settings
            if settings.ENVIRONMENT == "test":
                return
            os.makedirs(os.path.dirname(self._store_file), exist_ok=True)

            def serialize_val(v):
                if isinstance(v, datetime):
                    return v.isoformat()
                return v

            payload = {
                "conversations": {
                    k: {field: serialize_val(val) for field, val in conv.items()}
                    for k, conv in self.conversations.items()
                },
                "messages": {
                    k: {field: serialize_val(val) for field, val in msg.items()}
                    for k, msg in self.messages.items()
                },
            }
            with open(self._store_file, "w", encoding="utf-8") as f:
                json.dump(payload, f)
        except Exception:
            pass

    def _load_from_disk(self) -> bool:
        try:
            if os.path.exists(self._store_file):
                with open(self._store_file, "r", encoding="utf-8") as f:
                    payload = json.load(f)
                loaded_convs = payload.get("conversations", {})
                for k, conv in loaded_convs.items():
                    if "created_at" in conv and isinstance(conv["created_at"], str):
                        conv["created_at"] = datetime.fromisoformat(conv["created_at"])
                    if "updated_at" in conv and isinstance(conv["updated_at"], str):
                        conv["updated_at"] = datetime.fromisoformat(conv["updated_at"])
                    self.conversations[k] = conv
                loaded_msgs = payload.get("messages", {})
                for k, msg in loaded_msgs.items():
                    if "created_at" in msg and isinstance(msg["created_at"], str):
                        msg["created_at"] = datetime.fromisoformat(msg["created_at"])
                    self.messages[k] = msg
                return len(self.conversations) > 0
        except Exception:
            pass
        return False

    def _seed_development_chat(self):
        conv_id = "conv-dev-welcome"
        user_id = "dev-student-1"
        now = self._now()

        self.conversations[conv_id] = {
            "id": conv_id,
            "user_id": user_id,
            "title": "Getting Started with PrepAI Copilot",
            "document_ids": None,
            "created_at": now,
            "updated_at": now,
        }

        m1_id = "msg-dev-1"
        self.messages[m1_id] = {
            "id": m1_id,
            "conversation_id": conv_id,
            "user_id": user_id,
            "role": "user",
            "content": "How do you ground answers in my uploaded study materials?",
            "citations": [],
            "retrieval_metadata": {},
            "created_at": now,
        }

        m2_id = "msg-dev-2"
        self.messages[m2_id] = {
            "id": m2_id,
            "conversation_id": conv_id,
            "user_id": user_id,
            "role": "assistant",
            "content": "I retrieve relevant passages from your uploaded documents (PDFs, PPTX slides, DOCX files) using local 768-dimensional vector embeddings (`nomic-embed-text`). Every claim is cited directly with page or slide numbers so you can verify the source in one click.",
            "citations": [
                {
                    "chunk_id": "chunk-sample-1",
                    "document_id": "doc-sample-1",
                    "document_title": "Academic Syllabus Overview",
                    "page_or_slide": 1,
                    "quote": "PrepAI provides grounded citations derived from verified document chunks.",
                    "similarity_score": 0.92,
                }
            ],
            "retrieval_metadata": {"model": "llama3.2:latest", "chunks_retrieved": 1},
            "created_at": now,
        }

    # -------------------------------------------------------------------------
    # Conversations
    # -------------------------------------------------------------------------
    def get_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        user_convs = [c for c in self.conversations.values() if c["user_id"] == user_id]
        sorted_convs = sorted(user_convs, key=lambda x: x["updated_at"], reverse=True)
        result = []
        for c in sorted_convs:
            msgs = self.get_messages(user_id, c["id"])
            result.append({**c, "message_count": len(msgs)})
        return result

    def get_conversation(self, user_id: str, conversation_id: str) -> Optional[Dict[str, Any]]:
        c = self.conversations.get(conversation_id)
        if c and c["user_id"] == user_id:
            msgs = self.get_messages(user_id, conversation_id)
            return {**c, "message_count": len(msgs), "messages": msgs}
        return None

    def create_conversation(
        self, user_id: str, title: Optional[str] = None, document_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        item_id = str(uuid.uuid4())
        now = self._now()
        record = {
            "id": item_id,
            "user_id": user_id,
            "title": title.strip() if title and title.strip() else "New Conversation",
            "document_ids": document_ids,
            "created_at": now,
            "updated_at": now,
        }
        self.conversations[item_id] = record
        self._save_to_disk()
        return {**record, "message_count": 0, "messages": []}

    def update_conversation(
        self, user_id: str, conversation_id: str, title: str
    ) -> Optional[Dict[str, Any]]:
        c = self.conversations.get(conversation_id)
        if not c or c["user_id"] != user_id:
            return None
        c["title"] = title.strip()
        c["updated_at"] = self._now()
        self._save_to_disk()
        msgs = self.get_messages(user_id, conversation_id)
        return {**c, "message_count": len(msgs), "messages": msgs}

    def delete_conversation(self, user_id: str, conversation_id: str) -> bool:
        c = self.conversations.get(conversation_id)
        if not c or c["user_id"] != user_id:
            return False
        # Cascade delete messages
        to_del = [mid for mid, m in self.messages.items() if m["conversation_id"] == conversation_id]
        for mid in to_del:
            del self.messages[mid]
        del self.conversations[conversation_id]
        self._save_to_disk()
        return True

    # -------------------------------------------------------------------------
    # Messages
    # -------------------------------------------------------------------------
    def get_messages(self, user_id: str, conversation_id: str) -> List[Dict[str, Any]]:
        msgs = [
            m
            for m in self.messages.values()
            if m["conversation_id"] == conversation_id and m["user_id"] == user_id
        ]
        return sorted(msgs, key=lambda x: x["created_at"])

    def add_message(
        self,
        user_id: str,
        conversation_id: str,
        role: str,
        content: str,
        citations: Optional[List[Dict[str, Any]]] = None,
        retrieval_metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        item_id = str(uuid.uuid4())
        now = self._now()
        record = {
            "id": item_id,
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": role,
            "content": content,
            "citations": citations or [],
            "retrieval_metadata": retrieval_metadata or {},
            "created_at": now,
        }
        self.messages[item_id] = record

        # Touch conversation updated_at
        if conversation_id in self.conversations:
            self.conversations[conversation_id]["updated_at"] = now

        self._save_to_disk()
        return dict(record)


chat_repo = ChatRepository()
