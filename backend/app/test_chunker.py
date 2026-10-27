
from app.chunker import chunk_text

text = """
Python is a programming language.
Machine learning uses data to learn patterns.
Deep learning uses neural networks.
""" * 30

chunks = chunk_text(text, chunk_size=200, overlap=30)

print("Total chunks:", len(chunks))

for index, chunk in enumerate(chunks, start=1):
    print(f"\nChunk {index}:")
    print(chunk)
