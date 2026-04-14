import chromadb
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction

chroma_client = chromadb.PersistentClient(path="./chroma_store")
default_embedding_function = DefaultEmbeddingFunction()

def get_or_create_collection(notebook_id: str):
    return chroma_client.get_or_create_collection(
        name=f"notebook_{notebook_id}",
        embedding_function=default_embedding_function,
    )

async def add_chunks(notebook_id: str, source_id: str, chunks: list[str]):
    collection = get_or_create_collection(notebook_id)

    collection.add(
        documents=chunks,
        ids=[f"{source_id}_chunk_{i}" for i in range(len(chunks))],
        metadatas=[{"source_id": source_id} for _ in chunks]
    )

async def query_chunks(notebook_id: str, query: str, n_results: int = 5) -> list[str]:
    collection = get_or_create_collection(notebook_id)
    results = collection.query(
        query_texts=[query],
        n_results=n_results
    )
    return results["documents"][0]

async def query_chunks_with_metadata(notebook_id: str, query: str, n_results: int = 5):
    from db.database import get_connection

    collection = get_or_create_collection(notebook_id)

    try:
        count = collection.count()
        actual_n = min(n_results, count)
        if actual_n == 0:
            return []

        results = collection.query(
            query_texts=[query],
            n_results=actual_n,
            include=["documents", "metadatas"]
        )

        chunks = results["documents"][0]
        metadatas = results["metadatas"][0]

        conn = get_connection()
        enriched = []
        for chunk, meta in zip(chunks, metadatas):
            source_id = meta.get("source_id", "") if meta else ""
            if source_id:
                source = conn.execute(
                    "SELECT title FROM sources WHERE id = ?", (source_id,)
                ).fetchone()
                title = source["title"] if source else "Unknown Source"
            else:
                # Fallback for chunks stored without metadata
                title = "Source"
            enriched.append({
                "chunk": chunk,
                "title": title,
                "source_id": source_id
            })
        conn.close()
        return enriched

    except Exception as e:
        print(f"[ChromaDB] query error: {str(e)}")
        raise