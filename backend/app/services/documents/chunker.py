from dataclasses import dataclass
from typing import List, Optional
from app.services.documents.parser import ExtractedSection


@dataclass
class DocumentChunkData:
    chunk_index: int
    content: str
    page_or_slide: Optional[int]
    token_count: int


def chunk_sections(
    sections: List[ExtractedSection],
    chunk_size: int = 900,
    chunk_overlap: int = 150,
) -> List[DocumentChunkData]:
    """
    Chunks extracted sections into bounded character blocks while preserving
    page/slide metadata and maintaining an overlapping sliding window.
    """
    if chunk_size <= chunk_overlap:
        raise ValueError("chunk_size must be strictly greater than chunk_overlap.")

    chunks: List[DocumentChunkData] = []
    chunk_index = 0

    for sec in sections:
        text = sec.content.strip()
        if not text:
            continue

        # If section text is smaller than chunk_size, emit as a single chunk
        if len(text) <= chunk_size:
            chunks.append(
                DocumentChunkData(
                    chunk_index=chunk_index,
                    content=text,
                    page_or_slide=sec.page_or_slide,
                    token_count=max(1, len(text.split())),
                )
            )
            chunk_index += 1
            continue

        # Sliding window with overlap
        start = 0
        step = chunk_size - chunk_overlap

        while start < len(text):
            end = start + chunk_size
            chunk_text = text[start:end]

            # Try to break cleanly at paragraph or sentence boundary if not at the very end
            if end < len(text):
                last_newline = chunk_text.rfind("\n")
                last_period = chunk_text.rfind(". ")
                break_point = max(last_newline, last_period)
                if break_point > chunk_size // 2:
                    chunk_text = chunk_text[: break_point + 1]
                    # Advance start to the break point minus overlap
                    start = start + len(chunk_text) - chunk_overlap
                else:
                    start += step
            else:
                start += step

            cleaned = chunk_text.strip()
            if cleaned:
                chunks.append(
                    DocumentChunkData(
                        chunk_index=chunk_index,
                        content=cleaned,
                        page_or_slide=sec.page_or_slide,
                        token_count=max(1, len(cleaned.split())),
                    )
                )
                chunk_index += 1

    return chunks
