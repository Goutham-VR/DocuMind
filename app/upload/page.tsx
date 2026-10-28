
"use client";

import { useRef, useState } from "react";

type Source = {
  page_number: number;
  content: string;
  similarity: number;
  document_id: string;
};

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [askLoading, setAskLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  function selectFile(selectedFile?: File) {
    if (!selectedFile) return;

    if (
      selectedFile.type !== "application/pdf" ||
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setMessage("Please select a valid PDF file.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setMessage("Your PDF must be smaller than 10 MB.");
      return;
    }

    setFile(selectedFile);
    setDocumentId("");
    setQuestion("");
    setAnswer("");
    setSources([]);
    setMessage("");
  }

  async function handleUpload(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!file) {
      setMessage("Please select a PDF first.");
      return;
    }

    if (!apiUrl) {
      setMessage("Backend API URL is not configured.");
      return;
    }

    setUploadLoading(true);
    setMessage("");
    setDocumentId("");
    setAnswer("");
    setSources([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${apiUrl.replace(/\/$/, "")}/upload-pdf`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || result.error || "PDF upload failed."
        );
      }

      const newDocumentId =
        result.document_id ?? result.documentId;

      if (!newDocumentId) {
        throw new Error(
          "The server did not return a document ID."
        );
      }

      setDocumentId(newDocumentId);
      setMessage("Your PDF is ready. You can ask questions now.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Upload failed. Please try again."
      );
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleAsk(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!question.trim() || !documentId) return;

    if (!apiUrl) {
      setMessage("Backend API URL is not configured.");
      return;
    }

    setAskLoading(true);
    setMessage("");
    setAnswer("");
    setSources([]);

    try {
      const response = await fetch(
        `${apiUrl.replace(/\/$/, "")}/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: question.trim(),
            document_id: documentId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || result.error || "Could not answer your question."
        );
      }

      setAnswer(result.answer);
      setSources(result.sources ?? []);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while asking."
      );
    } finally {
      setAskLoading(false);
    }
  }

  function formatSize(bytes: number) {
    return bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(0)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc] px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-10 text-center sm:mb-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-7 w-7"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <path
                d="M7 3.75h7l5 5v11.5H7a2 2 0 0 1-2-2v-12.5a2 2 0 0 1 2-2Z"
                strokeLinejoin="round"
              />
              <path d="M14 3.75v5h5M9 13h6M9 16.5h6" strokeLinecap="round" />
              <path d="M3 7v13a2 2 0 0 0 2 2h11" strokeLinecap="round" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Docu<span className="text-indigo-600">Mind</span>
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500 sm:text-base">
            Your documents, understood. Upload a PDF and get clear,
            context-aware answers from its contents.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            AI-powered document assistant
          </div>
        </header>

<<<<<<< HEAD
        <form onSubmit={handleAsk} className="space-y-4">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Example: What is artificial intelligence?"
            rows={3}
            className="w-full rounded border p-3"
            disabled={!documentId || askLoading}
          />

          <button
            type="submit"
            disabled={!documentId || !question.trim() || askLoading}
            className="rounded bg-blue-600 px-5 py-2 text-white disabled:opacity-50"
          >
            {askLoading ? "Thinking..." : "Ask DocuMind"}
          </button>
        </form>
      </section>

      {message && (
        <p role="status" className="rounded bg-gray-100 p-3 text-gray-800">
          {message}
        </p>
      )}
      

      {answer && (
        <section className="space-y-4 rounded-lg border p-6">
          <h2 className="text-xl font-semibold">Answer</h2>
          <p className="whitespace-pre-wrap leading-7">{answer}</p>

          <h3 className="font-semibold">Sources from your PDF</h3>

          {sources.length === 0 ? (
            <p className="text-sm text-gray-600">
              No source passages were returned.
            </p>
          ) : (
            <div className="space-y-4">
              {sources.map((source, index) => (
                <article
                  key={`${source.document_id}-${index}`}
                  className="rounded border p-4"
=======
        <div className="space-y-6">
          {/* Upload card */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
>>>>>>> f7737d8c3412d0dc06e043480e0075b1471be5eb
                >
                  <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" strokeLinecap="round" />
                </svg>
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Upload your document
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Start by choosing a PDF to explore.
                </p>
              </div>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => selectFile(e.target.files?.[0])}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  selectFile(e.dataTransfer.files?.[0]);
                }}
                className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-8 text-center transition sm:py-10 ${
                  dragging
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 bg-slate-50/70 hover:border-indigo-300 hover:bg-indigo-50/40"
                }`}
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-6 w-6"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path d="M7 3.75h7l5 5v11.5H7a2 2 0 0 1-2-2v-12.5a2 2 0 0 1 2-2Z" strokeLinejoin="round" />
                    <path d="M14 3.75v5h5M9 13h6M9 16.5h4" strokeLinecap="round" />
                  </svg>
                </div>

                <span className="text-sm font-semibold text-slate-800">
                  {file ? "Choose a different PDF" : "Click to upload or drag and drop"}
                </span>
                <span className="mt-2 text-xs text-slate-500">
                  PDF files only · Maximum 10 MB
                </span>
              </button>

              {file && (
                <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 ring-1 ring-indigo-100">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7">
                      <path d="M7 3.75h7l5 5v11.5H7a2 2 0 0 1-2-2v-12.5a2 2 0 0 1 2-2Z" strokeLinejoin="round" />
                      <path d="M14 3.75v5h5M9 14h6M9 17h4" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {file.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatSize(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setDocumentId("");
                      setAnswer("");
                      setSources([]);
                      setMessage("");
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-white hover:text-slate-800"
                  >
                    Remove
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={!file || uploadLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Processing your PDF...
                  </>
                ) : (
                  <>
                    Upload and process PDF
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {documentId && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2">
                  <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <p className="font-semibold">Document processed successfully</p>
                  <p className="mt-1 break-all text-xs text-emerald-700">
                    ID: {documentId}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Question card */}
          <section className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition sm:p-7 ${!documentId ? "opacity-80" : ""}`}>
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7">
                  <path d="M8 10h8M8 14h5" strokeLinecap="round" />
                  <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H7l-3 2v-5.5a7.5 7.5 0 1 1 16.5-4Z" strokeLinejoin="round" />
                </svg>
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Ask your document
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Ask a question and get an answer grounded in your PDF.
                </p>
              </div>
            </div>

            {!documentId && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" stroke="currentColor" strokeWidth="1.7">
                  <rect x="5" y="10" width="14" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                Upload a PDF to unlock document chat.
              </div>
            )}

            <form onSubmit={handleAsk} className="space-y-3">
              <label htmlFor="question" className="sr-only">
                Your question
              </label>
              <textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask something about your PDF..."
                rows={3}
                disabled={!documentId || askLoading}
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  Answers are generated using your document context.
                </p>
                <button
                  type="submit"
                  disabled={!documentId || !question.trim() || askLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {askLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      Ask DocuMind
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                        <path d="m5 12 14 0m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Status message */}
          {message && (
            <div
              role="status"
              className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
                documentId && !uploadLoading && !askLoading && !answer
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : message.toLowerCase().includes("failed") ||
                      message.toLowerCase().includes("error") ||
                      message.toLowerCase().includes("could not") ||
                      message.toLowerCase().includes("not configured")
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <span className="mt-0.5">
                {message.toLowerCase().includes("failed") ||
                message.toLowerCase().includes("error") ||
                message.toLowerCase().includes("could not") ||
                message.toLowerCase().includes("not configured")
                  ? "!"
                  : "✓"}
              </span>
              <p className="break-words">{message}</p>
            </div>
          )}

          {/* AI answer */}
          {answer && (
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-7">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
                      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" strokeLinejoin="round" />
                      <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Answer
                    </h2>
                    <p className="text-xs text-slate-500">
                      Generated from your document
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-6 sm:px-7">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {answer}
                </p>
              </div>

              <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-5 sm:px-7">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Sources from your PDF
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Passages used to generate this answer
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                    {sources.length} {sources.length === 1 ? "source" : "sources"}
                  </span>
                </div>

                {sources.length === 0 ? (
                  <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                    No source passages were returned for this answer.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sources.map((source, index) => (
                      <article
                        key={`${source.document_id}-${index}`}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                            Source {index + 1}
                          </span>
                          <span className="text-xs text-slate-500">
                            Page {source.page_number}
                          </span>
                          <span className="ml-auto rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                            {(source.similarity * 100).toFixed(1)}% similarity
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {source.content}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <footer className="mt-10 pb-2 text-center">
          <p className="text-xs text-slate-400">
            DocuMind · Chat with your documents
          </p>
          <p className="mt-1 text-xs text-slate-400">
            AI-generated answers may require verification against the original PDF.
          </p>
        </footer>
      </div>
    </main>
  );
}
