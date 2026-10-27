from app.embedder import generate_embeddings

chunks = [
    "Python is a programming language.",
    "Machine learning learns patterns from data."
]

embeddings = generate_embeddings(chunks)

print("Number of embeddings:", len(embeddings))
print("Dimensions:", len(embeddings[0]))
print("First embedding:", embeddings[0][:5])