import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from db.database import get_connection
from services.scraper_service import scrape_url
from services.chunker_service import chunk_text
from services.groq_service import generate_summary
from services.file_parser_service import parse_pdf, parse_docx, parse_txt
from services.youtube_service import get_youtube_transcript
from vector.chroma_service import add_chunks

router = APIRouter()

class URLInput(BaseModel):
    notebook_id: str
    url: str

async def process_and_store(notebook_id: str, title: str, content: str, url: str = ""):
    source_id = str(uuid.uuid4())
    chunks = chunk_text(content)
    await add_chunks(notebook_id, source_id, chunks)

    try:
        summary = await generate_summary(content)
    except Exception:
        summary = "Summary unavailable"

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO sources (id, notebook_id, url, title, content, summary) VALUES (%s, %s, %s, %s, %s, %s)",
        (source_id, notebook_id, url, title, content, summary)
    )
    conn.commit()
    cur.close()
    conn.close()

    return {
        "source_id": source_id,
        "title": title,
        "summary": summary,
        "chunks_stored": len(chunks)
    }

@router.post("/url")
async def add_url_source(data: URLInput):
    if "youtube.com" in data.url or "youtu.be" in data.url:
        try:
            scraped = get_youtube_transcript(data.url)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to get YouTube transcript: {str(e)}")
    else:
        try:
            scraped = scrape_url(data.url)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to scrape URL: {str(e)}")

    return await process_and_store(
        notebook_id=data.notebook_id,
        title=scraped["title"],
        content=scraped["content"],
        url=data.url
    )

@router.post("/file")
async def add_file_source(notebook_id: str = Form(...), file: UploadFile = File(...)):
    file_bytes = await file.read()
    filename = file.filename or "Untitled"
    extension = filename.split(".")[-1].lower()

    try:
        if extension == "pdf":
            content = parse_pdf(file_bytes)
            title = filename.replace(".pdf", "")
        elif extension in ["docx", "doc"]:
            content = parse_docx(file_bytes)
            title = filename.replace(".docx", "").replace(".doc", "")
        elif extension == "txt":
            content = parse_txt(file_bytes)
            title = filename.replace(".txt", "")
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: .{extension}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    if not content or len(content) < 50:
        raise HTTPException(status_code=400, detail="File appears to be empty or unreadable")

    return await process_and_store(
        notebook_id=notebook_id,
        title=title,
        content=content,
        url=""
    )

@router.get("/{notebook_id}")
def get_sources(notebook_id: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, title, url, summary, created_at FROM sources WHERE notebook_id = %s",
        (notebook_id,)
    )
    sources = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(s) for s in sources]