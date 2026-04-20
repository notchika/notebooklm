import os
from pinecone import Pinecone, ServerlessSpec
from services.ollama_service import get_embedding
from dotenv import load_dotenv

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "notebooklm")

# Initialize Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)

def get_index():
    """Get or create Pinecone index"""
    existing_indexes = [idx.name for idx in pc.list_indexes()]
    if PINECONE_INDEX_NAME not in existing_indexes:
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=768,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
    return pc.Index(PINECONE_INDEX_NAME)

async def add_chunks(notebook_id: str, source_id: str, chunks: list[str]):
    """Embed and store chunks in Pinecone"""
    index = get_index()
    vectors = []

    for i, chunk in enumerate(chunks):
        embedding = await get_embedding(chunk)
        vectors.append({
            "id": f"{source_id}_chunk_{i}",
            "values": embedding,
            "metadata": {
                "notebook_id": notebook_id,
                "source_id": source_id,
                "text": chunk[:1000]  # Store chunk text in metadata
            }
        })

    # Upsert in batches of 100
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        index.upsert(vectors=batch, namespace=notebook_id)

    print(f"[Pinecone] Stored {len(vectors)} chunks for source {source_id}")

async def query_chunks(notebook_id: str, query: str, n_results: int = 8) -> list[str]:
    """Query Pinecone for relevant chunks"""
    index = get_index()
    query_embedding = await get_embedding(query)

    results = index.query(
        vector=query_embedding,
        top_k=n_results,
        namespace=notebook_id,
        include_metadata=True
    )

    return [match.metadata["text"] for match in results.matches]

async def query_chunks_with_metadata(notebook_id: str, query: str, n_results: int = 8):
    """Query Pinecone and return chunks with source info"""
    from db.database import get_connection

    index = get_index()
    query_embedding = await get_embedding(query)

    results = index.query(
        vector=query_embedding,
        top_k=n_results,
        namespace=notebook_id,
        include_metadata=True
    )

    conn = get_connection()
    enriched = []
    for match in results.matches:
        source_id = match.metadata.get("source_id", "")
        chunk_text = match.metadata.get("text", "")

        source = conn.execute(
            "SELECT title FROM sources WHERE id = ?", (source_id,)
        ).fetchone()
        title = source["title"] if source else "Unknown Source"

        enriched.append({
            "chunk": chunk_text,
            "title": title,
            "source_id": source_id
        })
    conn.close()
    return enriched

async def delete_source_chunks(notebook_id: str, source_id: str):
    """Delete all chunks for a source"""
    index = get_index()
    index.delete(
        filter={"source_id": source_id},
        namespace=notebook_id
    )