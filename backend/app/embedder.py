
from fastembed import TextEmbedding
import math

# Load the lightweight ONNX embedding model once
model = TextEmbedding(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)


def generate_embeddings(chunks: list[str]) -> list[list[float]]:
    # Generate embeddings in small batches
    vectors = model.embed(
        chunks,
        batch_size=4
    )

    embeddings = []

    for vector in vectors:
        values = vector.tolist()

        # Normalize the vector, matching the previous
        # normalize_embeddings=True behavior
        magnitude = math.sqrt(
            sum(value * value for value in values)
        )

        if magnitude > 0:
            values = [
                value / magnitude
                for value in values
            ]

        embeddings.append(values)

    return embeddings
