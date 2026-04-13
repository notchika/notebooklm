import httpx
import os
import base64
from dotenv import load_dotenv

load_dotenv()

D_ID_API_KEY = os.getenv("D_ID_API_KEY")
D_ID_BASE_URL = "https://api.d-id.com"

def get_auth():
    credentials = base64.b64encode(f"{D_ID_API_KEY}:".encode()).decode()
    return f"Basic {credentials}"

def get_headers():
    return {
        "Authorization": get_auth(),
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

async def upload_image(image_bytes: bytes, filename: str) -> dict:
    """Upload image to D-ID and return both url and id"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{D_ID_BASE_URL}/images",
                files={"image": (filename, image_bytes, "image/jpeg")},
                headers={"Authorization": get_auth()}
            )
            print(f"[D-ID] Upload response: {response.status_code} — {response.text}")
            response.raise_for_status()
            data = response.json()
            return {
                "url": data["url"],
                "id": data["id"]
            }
    except httpx.HTTPStatusError as e:
        print(f"[D-ID] HTTP error: {e.response.status_code} — {e.response.text}")
        raise Exception(f"D-ID upload failed: {e.response.text}")

async def create_talk(image_url: str, text: str) -> str:
    """Create a talking video using the full S3 URL and plain text"""
    try:
        # Clean the text — remove any non-printable characters
        clean_text = "".join(c for c in text if c.isprintable()).strip()
        if not clean_text:
            raise Exception("Text is empty after cleaning")

        print(f"[D-ID] source_url={image_url}")
        print(f"[D-ID] clean_text={clean_text[:100]}")

        async with httpx.AsyncClient(timeout=60.0) as client:
            payload = {
                "source_url": image_url,
                "script": {
                    "type": "text",
                    "input": clean_text,
                    "provider": {
                        "type": "microsoft",
                        "voice_id": "en-US-JennyNeural"
                    }
                },
                "config": {
                    "fluent": True,
                    "pad_audio": 0.0,
                    "stitch": True
                }
            }
            response = await client.post(
                f"{D_ID_BASE_URL}/talks",
                json=payload,
                headers=get_headers()
            )
            print(f"[D-ID] Create talk: {response.status_code} — {response.text}")
            response.raise_for_status()
            return response.json()["id"]
    except httpx.HTTPStatusError as e:
        print(f"[D-ID] HTTP error: {e.response.status_code} — {e.response.text}")
        raise Exception(f"D-ID talk creation failed: {e.response.text}")

async def get_talk_status(talk_id: str) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{D_ID_BASE_URL}/talks/{talk_id}",
            headers=get_headers()
        )
        response.raise_for_status()
        return response.json()

async def wait_for_talk(talk_id: str, max_attempts: int = 30) -> str:
    import asyncio
    for attempt in range(max_attempts):
        result = await get_talk_status(talk_id)
        status = result.get("status")
        print(f"[D-ID] Poll {attempt + 1}: status = {status}")

        if status == "done":
            return result["result_url"]
        elif status == "error":
            raise Exception(f"D-ID generation failed: {result.get('error')}")

        await asyncio.sleep(3)
    raise Exception("Video generation timed out")