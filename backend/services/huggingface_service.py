import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

async def get_embedding(text: str) -> list[float]:
    """Get embeddings using Groq's embedding model"""
    text = text[:512]
    
    try:
        response = client.embeddings.create(
            model="nomic-embed-text",
            input=text,
        )
        embedding = response.data[0].embedding
        print(f"[Groq Embed] Success, dimension: {len(embedding)}")
        return embedding
    except Exception as e:
        print(f"[Groq Embed] Error: {str(e)}")
        raise Exception(f"Embedding failed: {str(e)}")