import fitz  # PyMuPDF
from docx import Document
import io

def parse_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    has_images = False
    try:
        for page_num, page in enumerate(doc):
            if page_num >= 50:  # Limit to first 50 pages
                text += "\n[Document truncated at 50 pages for processing]"
                break
            text += page.get_text("text")
            if page.get_images(full=True):
                has_images = True
    finally:
        doc.close()
    parsed = text.strip()
    if len(parsed) < 50 and has_images:
        raise ValueError(
            "This PDF appears to be image-based/scanned. OCR is not enabled yet. "
            "Please upload a text-based PDF or convert it to editable text first."
        )
    return parsed

def parse_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    text = "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
    return text.strip()

def parse_txt(file_bytes: bytes) -> str:
    try:
        return file_bytes.decode("utf-8").strip()
    except UnicodeDecodeError:
        return file_bytes.decode("latin-1", errors="ignore").strip()