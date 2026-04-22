import httpx
import os
from dotenv import load_dotenv

load_dotenv()

HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

# New correct URL format for HuggingFace embeddings
HF_API_URL = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"

async def get_embedding(text: str) -> list[float]:
    text = text[:512]
    headers = {
        "Authorization": f"Bearer {HF_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {"inputs": [text]}

    import asyncio
    for attempt in range(3):
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    HF_API_URL,
                    headers=headers,
                    json=payload
                )
                print(f"[HF] Status: {response.status_code}")
                print(f"[HF] Response preview: {response.text[:200]}")

                if response.status_code == 503:
                    print(f"[HF] Model loading, waiting 20s...")
                    await asyncio.sleep(20)
                    continue

                if response.status_code == 404:
                    print(f"[HF] 404 - trying alternative URL...")
                    raise Exception("404 Not Found")

                response.raise_for_status()
                result = response.json()
                print(f"[HF] Result type: {type(result)}, len: {len(result)}")

                # New API returns list of embeddings (one per input)
                # Since we send one text, take first embedding
                if isinstance(result, list):
                    first = result[0]
                    if isinstance(first, float):
                        return result
                    if isinstance(first, list):
                        if isinstance(first[0], float):
                            return first  # Return first embedding
                        if isinstance(first[0], list):
                            # Mean pool token embeddings
                            tokens = first
                            dim = len(tokens[0])
                            return [
                                sum(tokens[t][d] for t in range(len(tokens))) / len(tokens)
                                for d in range(dim)
                            ]

                raise Exception(f"Unexpected format: {str(result)[:100]}")

        except Exception as e:
            print(f"[HF] Attempt {attempt + 1} failed: {str(e)}")
            if attempt == 2:
                raise
            await asyncio.sleep(5)

    raise Exception("All embedding attempts failed")