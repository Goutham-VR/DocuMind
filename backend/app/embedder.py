from sentence_transformers import SentenceTransformer

# Load the model once
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


def generate_embeddings(chunks: list[str]) -> list[list[float]]:
    embeddings = model.encode(
        chunks,
        normalize_embeddings=True
    )

    return embeddings.tolist()