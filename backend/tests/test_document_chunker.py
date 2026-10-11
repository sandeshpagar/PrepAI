from app.services.documents.chunker import chunk_sections
from app.services.documents.parser import ExtractedSection


def test_chunker_basic_and_metadata():
    sections = [
        ExtractedSection(content="Short introductory section.", page_or_slide=1),
        ExtractedSection(content="Second page with slightly more content.", page_or_slide=2),
    ]

    chunks = chunk_sections(sections, chunk_size=500, chunk_overlap=50)
    assert len(chunks) == 2
    assert chunks[0].chunk_index == 0
    assert chunks[0].page_or_slide == 1
    assert chunks[1].chunk_index == 1
    assert chunks[1].page_or_slide == 2


def test_chunker_sliding_window_with_overlap():
    long_text = "Word " * 300  # ~1500 chars
    sections = [ExtractedSection(content=long_text, page_or_slide=5)]

    chunks = chunk_sections(sections, chunk_size=400, chunk_overlap=100)
    assert len(chunks) > 1
    for c in chunks:
        assert c.page_or_slide == 5
        assert len(c.content) <= 450  # Bounded size
