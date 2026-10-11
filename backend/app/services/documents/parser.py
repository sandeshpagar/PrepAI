import io
from dataclasses import dataclass
from typing import List, Optional
import pypdf
from docx import Document as DocxDocument
from pptx import Presentation as PptxPresentation


@dataclass
class ExtractedSection:
    content: str
    page_or_slide: Optional[int] = None


class DocumentParser:
    """
    Extracts text and page/slide labels from supported academic document formats.
    """

    @classmethod
    def parse(cls, file_bytes: bytes, file_type: str) -> tuple[List[ExtractedSection], int]:
        """
        Parses document bytes and returns (sections, page_or_slide_count).
        Raises ValueError on corrupted, empty, or unsupported documents.
        """
        if not file_bytes:
            raise ValueError("Document file is empty (0 bytes).")

        normalized_type = file_type.lower().strip().lstrip(".")
        if normalized_type == "pdf":
            return cls._parse_pdf(file_bytes)
        elif normalized_type == "docx":
            return cls._parse_docx(file_bytes)
        elif normalized_type == "pptx":
            return cls._parse_pptx(file_bytes)
        elif normalized_type in ("txt", "md"):
            return cls._parse_text(file_bytes)
        else:
            raise ValueError(f"Unsupported file format: '.{normalized_type}'. Supported: pdf, docx, pptx, txt, md.")

    @classmethod
    def _parse_pdf(cls, file_bytes: bytes) -> tuple[List[ExtractedSection], int]:
        stream = io.BytesIO(file_bytes)
        try:
            reader = pypdf.PdfReader(stream)
        except Exception as e:
            raise ValueError(f"Failed to read PDF document: {str(e)}")

        total_pages = len(reader.pages)
        if total_pages == 0:
            raise ValueError("PDF has 0 pages.")

        sections: List[ExtractedSection] = []
        total_text_length = 0

        for page_num, page in enumerate(reader.pages, start=1):
            text = (page.extract_text() or "").strip()
            if text:
                sections.append(ExtractedSection(content=text, page_or_slide=page_num))
                total_text_length += len(text)

        if total_text_length == 0:
            raise ValueError(
                "Scanned PDF or no selectable text found. Local OCR is not supported in this version."
            )

        return sections, total_pages

    @classmethod
    def _parse_docx(cls, file_bytes: bytes) -> tuple[List[ExtractedSection], int]:
        stream = io.BytesIO(file_bytes)
        try:
            doc = DocxDocument(stream)
        except Exception as e:
            raise ValueError(f"Failed to read DOCX document: {str(e)}")

        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        
        # Also extract table text
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    paragraphs.append(row_text)

        full_text = "\n\n".join(paragraphs).strip()
        if not full_text:
            raise ValueError("DOCX document contains no extractable text.")

        # In docx, approximate pages by ~3000 chars per page
        approx_pages = max(1, len(full_text) // 3000)
        return [ExtractedSection(content=full_text, page_or_slide=1)], approx_pages

    @classmethod
    def _parse_pptx(cls, file_bytes: bytes) -> tuple[List[ExtractedSection], int]:
        stream = io.BytesIO(file_bytes)
        try:
            prs = PptxPresentation(stream)
        except Exception as e:
            raise ValueError(f"Failed to read PPTX presentation: {str(e)}")

        total_slides = len(prs.slides)
        if total_slides == 0:
            raise ValueError("PPTX presentation has 0 slides.")

        sections: List[ExtractedSection] = []
        total_text_length = 0

        for slide_num, slide in enumerate(prs.slides, start=1):
            slide_texts: List[str] = []
            for shape in slide.shapes:
                if shape.has_text_frame:
                    for paragraph in shape.text_frame.paragraphs:
                        txt = paragraph.text.strip()
                        if txt:
                            slide_texts.append(txt)

            # Check notes slide
            if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
                notes = slide.notes_slide.notes_text_frame.text.strip()
                if notes:
                    slide_texts.append(f"[Presenter Notes]: {notes}")

            combined = "\n".join(slide_texts).strip()
            if combined:
                sections.append(ExtractedSection(content=combined, page_or_slide=slide_num))
                total_text_length += len(combined)

        if total_text_length == 0:
            raise ValueError("PPTX slides contain no extractable text.")

        return sections, total_slides

    @classmethod
    def _parse_text(cls, file_bytes: bytes) -> tuple[List[ExtractedSection], int]:
        try:
            text = file_bytes.decode("utf-8").strip()
        except UnicodeDecodeError:
            try:
                text = file_bytes.decode("latin-1").strip()
            except Exception as e:
                raise ValueError(f"Unable to decode text document: {str(e)}")

        if not text:
            raise ValueError("Text document is empty.")

        approx_pages = max(1, len(text) // 3000)
        return [ExtractedSection(content=text, page_or_slide=1)], approx_pages
