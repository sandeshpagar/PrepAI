from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.repositories.chat_repo import chat_repo
from app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageResponse,
    ConversationCreate,
    ConversationDetailResponse,
    ConversationResponse,
    ConversationUpdate,
)
from app.services.chat.service import rag_service

router = APIRouter(tags=["Academic Assistant & RAG"])


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    return chat_repo.get_conversations(user_id=current_user["id"])


@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_conversation(
    payload: ConversationCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    return chat_repo.create_conversation(
        user_id=current_user["id"],
        title=payload.title,
        document_ids=payload.document_ids,
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    conv = chat_repo.get_conversation(user_id=current_user["id"], conversation_id=conversation_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return conv


@router.patch("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def update_conversation(
    conversation_id: str,
    payload: ConversationUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    conv = chat_repo.update_conversation(
        user_id=current_user["id"],
        conversation_id=conversation_id,
        title=payload.title,
    )
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return conv


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    success = chat_repo.delete_conversation(
        user_id=current_user["id"], conversation_id=conversation_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return None


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    conversation_id: str,
    payload: ChatMessageCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    user_id = current_user["id"]
    conv = chat_repo.get_conversation(user_id=user_id, conversation_id=conversation_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    question = payload.content.strip()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty",
        )

    # 1. Save student question
    chat_repo.add_message(
        user_id=user_id,
        conversation_id=conversation_id,
        role="user",
        content=question,
    )

    # Update conversation title if default
    if conv["title"] == "New Conversation":
        new_title = question[:35] + ("..." if len(question) > 35 else "")
        chat_repo.update_conversation(user_id, conversation_id, new_title)

    # Effective document filter
    active_docs = payload.document_ids if payload.document_ids is not None else conv.get("document_ids")

    # 2. Execute RAG pipeline
    answer, citations, meta = rag_service.answer_query(
        user_id=user_id,
        question=question,
        document_ids=active_docs,
    )

    # 3. Save assistant message
    asst_msg = chat_repo.add_message(
        user_id=user_id,
        conversation_id=conversation_id,
        role="assistant",
        content=answer,
        citations=[c.model_dump() for c in citations],
        retrieval_metadata=meta,
    )

    return asst_msg
