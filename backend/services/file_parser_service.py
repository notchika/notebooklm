import fitz  # PyMuPDF
from docx import Document
import io

def parse_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page_num, page in enumerate(doc):
        if page_num >= 50:  # Limit to first 50 pages
            text += "\n[Document truncated at 50 pages for processing]"
            break
        text += page.get_text()
    return text.strip()

def parse_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    text = "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
    return text.strip()

def parse_txt(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8", errors="ignore").strip()