import os
from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec
from services.huggingface_service import get_embedding

load_dotenv()

PINECONE_API_KEY = os.getenv(PINECONE_API_KEY)
PINECONE_INDEX_NAME = os.getenv(PINECONE_INDEX_NAME, notebooklm)

pc = Pinecone(api_key=PINECONE_API_KEY)

def get_index():
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
                "text": chunk[:1000]
            }
        })

    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        index.upsert(vectors=batch, namespace=notebook_id)

    print(f"[Pinecone] Stored {len(vectors)} chunks for source {source_id}")

async def query_chunks(notebook_id: str, query: str, n_results: int = 8) -> list[str]:
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
    cur = conn.cursor()
    enriched = []

    for match in results.matches:
        source_id = match.metadata.get("source_id", "")
        chunk_text = match.metadata.get("text", "")
        cur.execute("SELECT title FROM sources WHERE id = %s", (source_id,))
        source = cur.fetchone()
        title = source["title"] if source else "Unknown Source"
        enriched.append({
            "chunk": chunk_text,
            "title": title,
            "source_id": source_id
        })

    cur.close()
    conn.close()
    return enriched