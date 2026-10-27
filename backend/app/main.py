
from fastapi import FastAPI, UploadFile, File, HTTPException
from pypdf import PdfReader
from io import BytesIO

from app.chunker import chunk_text
from app.embedder import generate_embeddings
from app.storage import save_document
from pydantic import BaseModel, Field
from app.search import search_chunks
from pydantic import BaseModel, Field
from app.rag import answer_question
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="DocuMind API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Welcome to DocuMind API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):

    # 1. Check the file extension
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF file."
        )

    # 2. Read the uploaded file into memory
    file_bytes = await file.read()

    # 3. Check that the file is not empty
    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty."
        )

    # 4. Check the PDF signature
    if not file_bytes.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid PDF."
        )

    # 5. Extract text from the PDF
    try:
        pdf = PdfReader(BytesIO(file_bytes))

        # Limit this first version to 100 pages
        if len(pdf.pages) > 100:
            raise HTTPException(
                status_code=413,
                detail="PDF must contain no more than 100 pages."
            )

        pages = []

        for page_number, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""

            pages.append({
                "page": page_number,
                "text": text.strip()
            })

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not read this PDF."
        )

    # 6. Combine extracted page text
    full_text = "\n".join(
        page["text"] for page in pages
    )

    if not full_text.strip():
        raise HTTPException(
            status_code=422,
            detail="No readable text found. Scanned PDFs may require OCR."
        )

    # Chunk the extracted PDF text
    chunks = chunk_text(full_text)
    embeddings = generate_embeddings(chunks)

    document_id = save_document(
    filename=file.filename,
    pages=pages,
    chunks=chunks,
    embeddings=embeddings
    )

    # Return the chunks
    # 7. Return the extracted content
    return {
    "message": "PDF processed and stored successfully",
    "document_id": document_id,
    "filename": file.filename,
    "total_pages": len(pages),
    "total_chunks": len(chunks),
    "embedding_dimensions": len(embeddings[0])
}


class SearchRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    document_id: str | None = None
    limit: int = Field(default=5, ge=1, le=10)


@app.post("/search")
def semantic_search(request: SearchRequest):

    results = search_chunks(
        question=request.question,
        document_id=request.document_id,
        limit=request.limit
    )

    return {
        "question": request.question,
        "total_results": len(results),
        "results": results
    }


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    document_id: str | None = None


@app.post("/ask")
def ask_pdf(request: AskRequest):

    return answer_question(
        question=request.question,
        document_id=request.document_id
    )
