import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama3-8b-8192")

async def chat_with_groq(message: str, context: str) -> str:
    system_prompt = """You are a helpful research assistant.
    Answer questions ONLY based on the provided source content.
    Each source is labeled as [Source N: Title].
    When referencing information, always cite the source like this: (Source: Title).
    If the answer is not in the sources, clearly say so.
    Be concise and always cite your sources."""

    full_prompt = f"""SOURCES:
{context}

QUESTION:
{message}"""

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": full_prompt}
        ],
        max_tokens=1024,
        temperature=0.2
    )
    return response.choices[0].message.content.strip()

async def generate_summary(content: str) -> str:
    # Truncate content to avoid token limits
    truncated = content[:3000]

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a summarization assistant. Generate a concise 2-3 sentence summary of the provided content. Be factual and informative. Return only the summary, nothing else."
            },
            {
                "role": "user",
                "content": f"Summarize this content:\n\n{truncated}"
            }
        ],
        max_tokens=150,
        temperature=0.3
    )
    return response.choices[0].message.content.strip()



async def generate_audio_script(sources_content: list[dict]) -> list[dict]:
    # Build context from all sources
    combined = ""
    for i, source in enumerate(sources_content):
        combined += f"\nSource {i+1}: {source['title']}\n{source['content'][:2000]}\n"

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": """You are a podcast script writer. Generate an engaging, 
                natural-sounding podcast conversation between two hosts discussing 
                the provided sources. 

                Format your response as JSON with this exact structure:
                {
                    "title": "Episode title here",
                    "segments": [
                        {"speaker": "Host", "text": "spoken text here"},
                        {"speaker": "Guest", "text": "spoken text here"}
                    ]
                }

                Rules:
                - Alternate between Host and Guest naturally
                - Keep each segment 1-3 sentences
                - Make it conversational and engaging
                - Cover the key points from all sources
                - Aim for 10-15 segments total
                - Return ONLY valid JSON, nothing else"""
            },
            {
                "role": "user",
                "content": f"Generate a podcast script based on these sources:\n{combined}"
            }
        ],
        max_tokens=2000,
        temperature=0.7
    )

    import json
    raw = response.choices[0].message.content.strip()
    # Strip markdown code fences if present
    raw = raw.replace("```json", "").replace("```", "").strip()
    parsed = json.loads(raw)
    return parsed