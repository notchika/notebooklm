from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from vector.chroma_service import query_chunks
from services.groq_service import chat_with_groq
from db.database import get_connection

router = APIRouter()

class ChatInput(BaseModel):
    notebook_id: str
    message: str

@router.post("/")
async def chat(data: ChatInput):
    try:
        # Get relevant chunks with source metadata
        results = await query_chunks_with_sources(data.notebook_id, data.message)

        # Build context with source labels
        context_parts = []
        for i, result in enumerate(results):
            context_parts.append(
                f"[Source {i+1}: {result['title']}]\n{result['chunk']}"
            )
        context = "\n\n---\n\n".join(context_parts)

        response = await chat_with_groq(data.message, context)

        return {
            "response": response,
            "sources_used": [r["title"] for r in results]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def query_chunks_with_sources(notebook_id: str, query: str):
    from vector.chroma_service import query_chunks_with_metadata
    results = await query_chunks_with_metadata(notebook_id, query)
    return results