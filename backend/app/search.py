
from app.embedder import generate_embeddings
from app.database import supabase


def search_chunks(
    question: str,
    document_id: str | None = None,
    limit: int = 5
) -> list[dict]:

    # 1. Convert the question into a vector
    query_embedding = generate_embeddings([question])[0]

    # 2. Prepare the search parameters
    parameters = {
        "query_embedding": query_embedding,
        "match_count": limit,
        "filter_document_id": document_id
    }

    # 3. Search the stored vectors
    result = supabase.rpc(
        "match_chunks",
        parameters
    ).execute()

    # 4. Return matching chunks
    return result.data
