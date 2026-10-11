import io
import pytest
import pypdf
from docx import Document as DocxDocument
from pptx import Presentation as PptxPresentation
from pptx.util import Inches
from app.services.documents.parser import DocumentParser


def test_pdf_parsing():
    # Create in-memory PDF with 2 pages
    writer = pypdf.PdfWriter()
    writer.add_blank_page(width=72, height=72)
    # Note: pypdf blank pages don't have text; let's test empty PDF detection
    buf = io.BytesIO()
    writer.write(buf)
    
    with pytest.raises(ValueError, match="Scanned PDF or no selectable text found"):
        DocumentParser.parse(buf.getvalue(), "pdf")


def test_docx_parsing():
    doc = DocxDocument()
    doc.add_heading("Chapter 1: Relational Algebra", level=1)
    doc.add_paragraph("Relational algebra consists of a set of operators that take relations as operands.")
    buf = io.BytesIO()
    doc.save(buf)

    sections, total_pages = DocumentParser.parse(buf.getvalue(), "docx")
    assert len(sections) == 1
    assert "Relational Algebra" in sections[0].content
    assert total_pages >= 1


def test_pptx_parsing():
    prs = PptxPresentation()
    blank_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(blank_layout)
    tx_box = slide.shapes.add_textbox(Inches(1), Inches(1), Inches(5), Inches(2))
    tf = tx_box.text_frame
    tf.text = "Slide 1: Vector Embeddings and pgvector"
    buf = io.BytesIO()
    prs.save(buf)

    sections, total_slides = DocumentParser.parse(buf.getvalue(), "pptx")
    assert len(sections) == 1
    assert sections[0].page_or_slide == 1
    assert "Vector Embeddings and pgvector" in sections[0].content
    assert total_slides == 1


def test_markdown_and_text_parsing():
    md_content = "# Academic Syllabus\n\n- Unit 1: Foundations\n- Unit 2: Advanced Topics"
    sections, pages = DocumentParser.parse(md_content.encode("utf-8"), "md")
    assert len(sections) == 1
    assert "Foundations" in sections[0].content
    assert pages >= 1


def test_empty_and_unsupported_rejection():
    with pytest.raises(ValueError, match="empty"):
        DocumentParser.parse(b"", "txt")

    with pytest.raises(ValueError, match="Unsupported file format"):
        DocumentParser.parse(b"dummy binary", "exe")
