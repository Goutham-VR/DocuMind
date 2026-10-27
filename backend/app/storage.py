
from app.database import supabase


def save_document(
    filename: str,
    pages: list[dict],
    chunks: list[str],
    embeddings: list[list[float]]
) -> str:

    # Create the document record
    document_result = (
        supabase.table("documents")
        .insert({"filename": filename})
        .execute()
    )

    document_id = document_result.data[0]["id"]

    # Prepare chunk records
    rows = []

    for index, chunk in enumerate(chunks):
        rows.append({
            "document_id": document_id,
            "page_number": 1,
            "content": chunk,
            "embedding": embeddings[index]
        })

    # Insert chunks in batches of 50
    for start in range(0, len(rows), 50):
        batch = rows[start:start + 50]

        supabase.table("chunks").insert(batch).execute()

    return document_id
