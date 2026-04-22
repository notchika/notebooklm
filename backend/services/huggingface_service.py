import httpx
import os
from dotenv import load_dotenv

load_dotenv()

JINA_API_KEY = os.getenv("JINA_API_KEY", "")
JINA_EMBED_URL = "https://api.jina.ai/v1/embeddings"

async def get_embedding(text: str) -> list[float]:
    """Get embeddings using Jina AI — free tier, no install needed"""
    text = text[:512]

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {JINA_API_KEY}" if JINA_API_KEY else ""
    }

    payload = {
        "input": [text],
        "model": "jina-embeddings-v2-base-en"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                JINA_EMBED_URL,
                headers=headers,
                json=payload
            )
            print(f"[Jina Embed] Status: {response.status_code}")
            response.raise_for_status()
            result = response.json()
            embedding = result["data"][0]["embedding"]
            print(f"[Jina Embed] Success, dimension: {len(embedding)}")
            return embedding
    except Exception as e:
        print(f"[Jina Embed] Error: {str(e)}")
        raise Exception(f"Jina embedding failed: {str(e)}")