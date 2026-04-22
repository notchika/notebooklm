import httpx
import os
from dotenv import load_dotenv

load_dotenv()

HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
HF_API_URL = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"

async def get_embedding(text: str) -> list[float]:
    text = text[:512]
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    payload = {
        "inputs": text,
        "options": {"wait_for_model": True}
    }

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
                print(f"[HF] Response: {response.text[:200]}")

                if response.status_code == 503:
                    wait_time = 20 * (attempt + 1)
                    print(f"[HF] Model loading, waiting {wait_time}s...")
                    await asyncio.sleep(wait_time)
                    continue

                response.raise_for_status()
                result = response.json()

                if isinstance(result, list):
                    if isinstance(result[0], float):
                        return result
                    if isinstance(result[0], list):
                        if isinstance(result[0][0], float):
                            dim = len(result[0])
                            return [
                                sum(result[t][d] for t in range(len(result))) / len(result)
                                for d in range(dim)
                            ]
                        if isinstance(result[0][0], list):
                            tokens = result[0]
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