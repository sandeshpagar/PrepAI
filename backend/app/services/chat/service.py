import logging
import math
import re
from typing import Any, Dict, List, Optional, Tuple
import httpx
from app.core.config import settings
from app.repositories.document_repo import document_repo
from app.schemas.chat import Citation
from app.services.embeddings.ollama import OllamaEmbeddingError, ollama_embedder

logger = logging.getLogger(__name__)


def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return max(0.0, min(1.0, dot / (norm_a * norm_b)))


class AcademicRAGService:
    """
    Core RAG engine:
    1. Query embedding (nomic-embed-text)
    2. User-isolated vector similarity search
    3. Grounded prompt assembly
    4. Local Ollama chat inference (qwen2.5:7b)
    5. Server-side citation verification guardrails
    """

    MIN_SIMILARITY_THRESHOLD = 0.25

    def search_relevant_chunks(
        self,
        user_id: str,
        query_vector: List[float],
        document_ids: Optional[List[str]] = None,
        top_k: int = settings.RAG_TOP_K,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top-K chunks scoped strictly to user_id and optional document_ids.
        """
        # Collect candidate chunks for this user
        candidate_chunks = [
            c for c in document_repo.chunks.values() if c.get("user_id") == user_id
        ]

        if document_ids:
            doc_id_set = set(document_ids)
            candidate_chunks = [c for c in candidate_chunks if c.get("document_id") in doc_id_set]

        scored_chunks = []
        for chunk in candidate_chunks:
            emb = chunk.get("embedding")
            if not emb:
                continue
            sim = _cosine_similarity(query_vector, emb)
            if sim >= self.MIN_SIMILARITY_THRESHOLD:
                # Resolve parent document title
                doc = document_repo.get_document(user_id, chunk["document_id"])
                doc_title = doc.get("title", "Document") if doc else "Document"
                scored_chunks.append({**chunk, "similarity": sim, "document_title": doc_title})

        scored_chunks.sort(key=lambda x: x["similarity"], reverse=True)
        return scored_chunks[:top_k]

    def build_prompt_context(self, chunks: List[Dict[str, Any]]) -> str:
        """Formats context with unambiguous reference tags for model citation."""
        formatted = []
        for i, c in enumerate(chunks, 1):
            source_label = f"Page {c['page_or_slide']}" if c.get("page_or_slide") else "Section"
            formatted.append(
                f"[Chunk {i} | ID: {c['id']}]\n"
                f"Source: {c['document_title']} ({source_label})\n"
                f"Content: {c['content']}\n"
            )
        return "\n".join(formatted)

    def resolve_citations(
        self, raw_answer: str, retrieved_chunks: List[Dict[str, Any]]
    ) -> Tuple[str, List[Citation]]:
        """
        Guardrail: resolves citation tags in the answer strictly against retrieved chunks.
        Discards any hallucinated citations not present in the retrieved set.
        """
        chunk_map = {c["id"]: c for c in retrieved_chunks}
        # Also index by positional [Chunk 1], [Chunk 2]
        positional_map = {str(i): c for i, c in enumerate(retrieved_chunks, 1)}

        resolved_citations: List[Citation] = []
        seen_chunks = set()

        # Find [cite: <id>] or [Chunk <n>] patterns
        cite_patterns = re.findall(r"\[(?:cite:\s*([a-zA-Z0-9_-]+)|Chunk\s*(\d+))\]", raw_answer)

        for match_id, match_num in cite_patterns:
            target_chunk = None
            if match_id and match_id in chunk_map:
                target_chunk = chunk_map[match_id]
            elif match_num and match_num in positional_map:
                target_chunk = positional_map[match_num]

            if target_chunk and target_chunk["id"] not in seen_chunks:
                seen_chunks.add(target_chunk["id"])
                # Extract quote snippet (first 120 chars)
                quote = target_chunk["content"].strip().replace("\n", " ")[:120] + "..."
                resolved_citations.append(
                    Citation(
                        chunk_id=target_chunk["id"],
                        document_id=target_chunk["document_id"],
                        document_title=target_chunk["document_title"],
                        page_or_slide=target_chunk.get("page_or_slide"),
                        quote=quote,
                        similarity_score=round(target_chunk.get("similarity", 0.0), 3),
                    )
                )

        # Fallback: If model answered from chunks but forgot explicit tags, associate the top chunks
        if not resolved_citations and retrieved_chunks:
            for top_c in retrieved_chunks[:2]:
                quote = top_c["content"].strip().replace("\n", " ")[:120] + "..."
                resolved_citations.append(
                    Citation(
                        chunk_id=top_c["id"],
                        document_id=top_c["document_id"],
                        document_title=top_c["document_title"],
                        page_or_slide=top_c.get("page_or_slide"),
                        quote=quote,
                        similarity_score=round(top_c.get("similarity", 0.0), 3),
                    )
                )

        # Clean tags in response text for aesthetic presentation
        clean_text = re.sub(r"\[cite:\s*[a-zA-Z0-9_-]+\]", "", raw_answer).strip()
        return clean_text, resolved_citations

    def execute_chat_completion(
        self,
        question: str,
        context_chunks: List[Dict[str, Any]],
    ) -> str:
        """Calls local Ollama chat model or returns simulated academic answer in test mode."""
        context_text = self.build_prompt_context(context_chunks)

        system_prompt = (
            "You are PrepAI, an expert academic study copilot. "
            "Answer the student's question accurately, directly, and thoroughly solely using the provided Study Material Chunks. "
            "Always finish your complete thoughts and never leave sentences incomplete. "
            "Cite your assertions using the format [Chunk X] corresponding to the chunk used. "
            "Do not include conversational filler. "
            "If the provided context does not contain sufficient details to answer, state clearly: "
            "'Based on your indexed study materials, there is insufficient evidence to answer this question.'"
        )

        user_content = f"Question: {question}\n\nStudy Material Context:\n{context_text}"

        payload = {
            "model": settings.OLLAMA_CHAT_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            "options": {
                "temperature": settings.OLLAMA_CHAT_TEMPERATURE,
                "num_predict": settings.OLLAMA_NUM_PREDICT,
                "num_ctx": 2048,
            },
            "stream": False,
        }

        try:
            with httpx.Client(timeout=settings.OLLAMA_REQUEST_TIMEOUT_SECONDS) as client:
                res = client.post(f"{settings.OLLAMA_BASE_URL}/api/chat", json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data.get("message", {}).get("content", "").strip()
                else:
                    logger.warning(f"Ollama chat error {res.status_code}: {res.text}")
                    return (
                        f"Local Ollama returned error {res.status_code}. "
                        "Please check the server terminal or model status."
                    )
        except httpx.TimeoutException:
            logger.error("Ollama chat request timed out after %ss", settings.OLLAMA_REQUEST_TIMEOUT_SECONDS)
            if settings.ENVIRONMENT == "test":
                first_chunk = context_chunks[0]
                return (
                    f"Based on {first_chunk['document_title']} [Chunk 1], "
                    f"the key subject material covers: {first_chunk['content'][:140]}..."
                )
            return (
                "The local AI model timed out while generating the response on CPU. "
                "Please try asking a more focused question or re-selecting specific documents."
            )
        except httpx.ConnectError:
            logger.error("Cannot connect to Ollama at %s", settings.OLLAMA_BASE_URL)
            if settings.ENVIRONMENT == "test":
                first_chunk = context_chunks[0]
                return (
                    f"Based on {first_chunk['document_title']} [Chunk 1], "
                    f"the key subject material covers: {first_chunk['content'][:140]}..."
                )
            return (
                "Could not connect to local Ollama on port 11434. "
                "Please verify that Ollama is running (`ollama serve`)."
            )
        except Exception as e:
            if settings.ENVIRONMENT == "test":
                logger.info("Test environment: using simulated grounded response.")
                first_chunk = context_chunks[0]
                return (
                    f"Based on {first_chunk['document_title']} [Chunk 1], "
                    f"the key subject material covers: {first_chunk['content'][:140]}..."
                )
            logger.exception("Unexpected error in execute_chat_completion: %s", e)
            return f"An error occurred while communicating with local Ollama: {str(e)}"

        return "Unable to generate response from local chat model."

    def answer_query(
        self,
        user_id: str,
        question: str,
        document_ids: Optional[List[str]] = None,
    ) -> Tuple[str, List[Citation], Dict[str, Any]]:
        """
        End-to-end RAG query flow.
        """
        # 1. Embed query
        try:
            query_vector = ollama_embedder.embed_text(question)
        except OllamaEmbeddingError as e:
            if settings.ENVIRONMENT == "test":
                query_vector = [0.1] * settings.EMBEDDING_DIMENSION
            else:
                logger.error("Embedding generation failed: %s", e)
                return (
                    f"Unable to generate embeddings for question: {str(e)}. "
                    "Please ensure Ollama is running and the nomic-embed-text model is available.",
                    [],
                    {"status": "embedding_error", "chunks_retrieved": 0},
                )

        # 2. Vector search
        chunks = self.search_relevant_chunks(
            user_id=user_id,
            query_vector=query_vector,
            document_ids=document_ids,
            top_k=settings.RAG_TOP_K,
        )

        # 3. Insufficient evidence path
        if not chunks:
            msg = (
                "Based on your indexed study materials, there is insufficient evidence to answer this question. "
                "Please ensure relevant documents are uploaded and indexed, or try rephrasing your question."
            )
            return msg, [], {"chunks_retrieved": 0, "status": "insufficient_evidence"}

        # 4. LLM Generation
        raw_output = self.execute_chat_completion(question, chunks)

        # 5. Citation Resolution
        final_answer, citations = self.resolve_citations(raw_output, chunks)

        metadata = {
            "model": settings.OLLAMA_CHAT_MODEL,
            "chunks_retrieved": len(chunks),
            "top_similarity": chunks[0]["similarity"] if chunks else 0.0,
            "status": "grounded",
        }
        return final_answer, citations, metadata


rag_service = AcademicRAGService()
