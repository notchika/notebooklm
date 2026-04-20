import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from db.database import get_connection
from services.did_service import upload_image, create_talk, wait_for_talk

router = APIRouter()

class NotebookCreate(BaseModel):
    title: str

class NoteCreate(BaseModel):
    content: str

class DIDGenerateInput(BaseModel):
    image_url: str
    text: str

@router.post("/")
def create_notebook(data: NotebookCreate):
    notebook_id = str(uuid.uuid4())
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO notebooks (id, title) VALUES (%s, %s)",
        (notebook_id, data.title)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"id": notebook_id, "title": data.title}

@router.get("/")
def get_notebooks():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM notebooks ORDER BY created_at DESC")
    notebooks = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(n) for n in notebooks]

@router.get("/{notebook_id}")
def get_notebook(notebook_id: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM notebooks WHERE id = %s", (notebook_id,))
    notebook = cur.fetchone()
    cur.close()
    conn.close()
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")
    return dict(notebook)

@router.delete("/{notebook_id}")
def delete_notebook(notebook_id: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM notebooks WHERE id = %s", (notebook_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Notebook deleted"}

# ── Notes ──────────────────────────────────────────────

@router.post("/{notebook_id}/notes")
def create_note(notebook_id: str, data: NoteCreate):
    note_id = str(uuid.uuid4())
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO notes (id, notebook_id, content) VALUES (%s, %s, %s)",
        (note_id, notebook_id, data.content)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"id": note_id, "notebook_id": notebook_id, "content": data.content}

@router.get("/{notebook_id}/notes")
def get_notes(notebook_id: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM notes WHERE notebook_id = %s ORDER BY created_at DESC",
        (notebook_id,)
    )
    notes = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(n) for n in notes]

@router.delete("/{notebook_id}/notes/{note_id}")
def delete_note(notebook_id: str, note_id: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM notes WHERE id = %s AND notebook_id = %s",
        (note_id, notebook_id)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Note deleted"}

# ── Audio Script ────────────────────────────────────────

from services.groq_service import generate_audio_script

@router.post("/{notebook_id}/audio-script")
async def get_audio_script(notebook_id: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT title, content FROM sources WHERE notebook_id = %s",
        (notebook_id,)
    )
    sources = cur.fetchall()
    cur.close()
    conn.close()

    if not sources:
        raise HTTPException(
            status_code=400,
            detail="No sources found — add at least one source first"
        )

    sources_list = [{"title": s["title"], "content": s["content"]} for s in sources]

    try:
        script = await generate_audio_script(sources_list)
        return script
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate script: {str(e)}")

# ── D-ID Video ──────────────────────────────────────────

@router.post("/{notebook_id}/did/upload-image")
async def upload_speaker_image(notebook_id: str, file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        result = await upload_image(image_bytes, file.filename or "speaker.jpg")
        return {"image_url": result["url"], "image_id": result["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

@router.post("/{notebook_id}/did/generate")
async def generate_did_video(notebook_id: str, data: DIDGenerateInput):
    try:
        print(f"[D-ID] image_url={data.image_url[:50]}")
        print(f"[D-ID] text={data.text[:100]}")
        talk_id = await create_talk(data.image_url, data.text)
        video_url = await wait_for_talk(talk_id)
        return {"video_url": video_url, "talk_id": talk_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate video: {str(e)}")