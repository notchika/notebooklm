import httpx
import os
from dotenv import load_dotenv

load_dotenv()

HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
EMBEDDING_MODEL = "sentence-transformers/all-mpnet-base-v2"
HF_API_URL = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{EMBEDDING_MODEL}"

async def get_embedding(text: str) -> list[float]:
    text = text[:512]
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    payload = {"inputs": text, "options": {"wait_for_model": True}}

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            HF_API_URL,
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        result = response.json()

        if isinstance(result, list):
            if isinstance(result[0], list):
                embedding = [
                    sum(x[i] for x in result) / len(result)
                    for i in range(len(result[0]))
                ]
                return embedding
            return result
        raise Exception(f"Unexpected HF response: {type(result)}")