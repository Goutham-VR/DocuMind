
def chunk_text(text: str,chunk_size: int = 1000,overlap: int = 150) -> list[str]:
    chunks = []
    start = 0

    while start < len(text):

        end = min(start + chunk_size, len(text))

        # Prefer a word boundary
        if end < len(text):
            boundary = text.rfind(" ", start, end)

            if boundary > start + chunk_size * 0.6:
                end = boundary

        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        if end >= len(text):
            break

        start = end - overlap

    return chunks
