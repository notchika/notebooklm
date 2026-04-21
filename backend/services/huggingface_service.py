import httpx
import os
from dotenv import load_dotenv

load_dotenv()

HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
EMBEDDING_MODEL = "sentence-transformers/all-mpnet-base-v2"
# Updated API URL format
HF_API_URL = f"https://api-inference.huggingface.co/models/{EMBEDDING_MODEL}"

async def get_embedding(text: str) -> list[float]:
    """Get embeddings from HuggingFace API"""
    # Truncate to avoid token limits
    text = text[:512]

    headers = {
        "Authorization": f"Bearer {HF_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "inputs": text,
        "options": {
            "wait_for_model": True,
            "use_cache": True
        }
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            HF_API_URL,
            headers=headers,
            json=payload
        )

        # If model is loading, wait and retry
        if response.status_code == 503:
            import asyncio
            print("[HF] Model loading, waiting 20 seconds...")
            await asyncio.sleep(20)
            response = await client.post(
                HF_API_URL,
                headers=headers,
                json=payload
            )

        response.raise_for_status()
        result = response.json()

        print(f"[HF] Response type: {type(result)}, length: {len(result) if isinstance(result, list) else 'N/A'}")

        # Handle different response formats
        if isinstance(result, list):
            # If it's a list of lists (batch), take first item
            if len(result) > 0 and isinstance(result[0], list):
                return result[0]
            # If it's already a flat list of floats
            if len(result) > 0 and isinstance(result[0], float):
                return result
            # If nested deeper
            if len(result) > 0 and isinstance(result[0], list):
                if isinstance(result[0][0], list):
                    # Mean pooling
                    vectors = result[0]
                    return [
                        sum(v[i] for v in vectors) / len(vectors)
                        for i in range(len(vectors[0]))
                    ]
        raise Exception(f"Unexpected HF response format: {type(result)}, value: {str(result)[:200]}")