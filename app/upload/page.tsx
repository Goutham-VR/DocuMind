"use client";

import { useRef, useState } from "react";

type Source = {
  page_number: number;
  content: string;
  similarity: number;
  document_id: string;
};

const STARTERS = [
  "Summarize this document",
  "What are the key dates and figures?",
  "What are the main conclusions?",
];

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40";

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current motion-safe:animate-spin"
    />
  );
}

function Fold() {
  return (
    <span
      aria-hidden
      className="absolute right-0 top-0 h-7 w-7 bg-[linear-gradient(225deg,var(--desk)_50%,var(--line)_50%)]"
    />
  );
}

function SourceItem({ source }: { source: Source }) {
  const [open, setOpen] = useState(false);
  const long = source.content.length > 320;

  return (
    <li className="grid grid-cols-[3.75rem_1fr] gap-x-4 py-5 first:pt-0 last:pb-0">
      <div>
        <p className="text-sm font-medium">p. {source.page_number}</p>
        <p className="mt-0.5 text-xs text-mute">
          {Math.round(source.similarity * 100)}% match
        </p>
      </div>
      <div>
        <p
          className={`whitespace-pre-wrap font-serif text-[15px] leading-7 ${
            long && !open ? "line-clamp-4" : ""
          }`}
        >
          <mark className="box-decoration-clone bg-mark px-0.5 text-ink">
            {source.content}
          </mark>
        </p>
        {long && (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="mt-2 text-sm text-mute underline underline-offset-4 hover:text-ink"
          >
            {open ? "Show less" : "Show full passage"}
          </button>
        )}
      </div>
    </li>
  );
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [askLoading, setAskLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [askError, setAskError] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  function resetResults() {
    setDocumentId("");
    setQuestion("");
    setAnswer("");
    setSources([]);
    setUploadError("");
    setAskError("");
  }

  function selectFile(selectedFile?: File) {
    if (!selectedFile) return;

    if (
      selectedFile.type !== "application/pdf" ||
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setUploadError("Choose a valid PDF file.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setUploadError("Your PDF must be smaller than 10 MB.");
      return;
    }

    resetResults();
    setFile(selectedFile);
  }

  function removeFile() {
    setFile(null);
    resetResults();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!file) {
      setUploadError("Choose a PDF first.");
      return;
    }

    if (!apiUrl) {
      setUploadError("The backend API URL is not configured.");
      return;
    }

    setUploadLoading(true);
    setUploadError("");
    setDocumentId("");
    setAnswer("");
    setSources([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${apiUrl.replace(/\/$/, "")}/upload-pdf`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || result.error || "PDF upload failed.");
      }

      const newDocumentId = result.document_id ?? result.documentId;

      if (!newDocumentId) {
        throw new Error("The server did not return a document ID.");
      }

      setDocumentId(newDocumentId);
      setTimeout(() => questionRef.current?.focus(), 0);
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Upload failed. Try again."
      );
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleAsk(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!question.trim() || !documentId) return;

    if (!apiUrl) {
      setAskError("The backend API URL is not configured.");
      return;
    }

    setAskLoading(true);
    setAskError("");
    setAnswer("");
    setSources([]);

    try {
      const response = await fetch(`${apiUrl.replace(/\/$/, "")}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          document_id: documentId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || result.error || "Could not answer your question."
        );
      }

      setAnswer(result.answer);
      setSources(result.sources ?? []);
    } catch (error) {
      setAskError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Try again."
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
    <main className="min-h-screen px-5 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12 sm:mb-16">
          <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">
            DocuMind
          </h1>
          <p className="mt-3 max-w-md text-base leading-7 text-mute">
            Ask questions about a PDF and see the exact passages behind each
            answer.
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-[17rem_1fr] lg:gap-16">
          {/* The document */}
          <aside className="lg:sticky lg:top-10 lg:self-start">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => selectFile(e.target.files?.[0])}
            />

            {!file ? (
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
                className={`relative flex min-h-64 w-full flex-col justify-end border border-dashed p-5 text-left shadow-sm transition-colors ${
                  dragging
                    ? "border-ink bg-mark/40"
                    : "border-mute/60 bg-paper hover:border-ink"
                }`}
              >
                <Fold />
                <span className="block font-serif text-xl leading-snug">
                  Drop a PDF here
                </span>
                <span className="mt-1.5 block text-sm text-mute">
                  or choose a file. Up to 10 MB.
                </span>
              </button>
            ) : (
              <div className="relative flex min-h-64 flex-col border border-line bg-paper p-5 shadow-sm">
                <Fold />
                <div aria-hidden className="mb-8 space-y-2.5 pr-8">
                  {[85, 100, 92, 60].map((w) => (
                    <div
                      key={w}
                      className="h-1.5 rounded-full bg-line"
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </div>
                <p className="mt-auto break-words font-serif text-xl leading-snug">
                  {file.name}
                </p>
                <p className="mt-1 text-sm text-mute">
                  PDF, {formatSize(file.size)}
                </p>
              </div>
            )}

            {file && (
              <div className="mt-4 flex items-center gap-4">
                {documentId ? (
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    >
                      <path
                        d="m5 12 4 4L19 6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Ready for questions
                  </p>
                ) : (
                  <form onSubmit={handleUpload}>
                    <button
                      type="submit"
                      disabled={uploadLoading}
                      className={primaryButton}
                    >
                      {uploadLoading ? (
                        <>
                          <Spinner />
                          Reading PDF...
                        </>
                      ) : (
                        "Process PDF"
                      )}
                    </button>
                  </form>
                )}
                <button
                  type="button"
                  onClick={removeFile}
                  disabled={uploadLoading}
                  className="text-sm text-mute underline underline-offset-4 hover:text-ink disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            )}

            {uploadError && (
              <p
                role="alert"
                className="mt-4 border-l-2 border-danger pl-3 text-sm leading-6 text-danger"
              >
                {uploadError}
              </p>
            )}
          </aside>

          {/* The conversation */}
          <section className="min-w-0">
            <form onSubmit={handleAsk}>
              <label htmlFor="question" className="text-sm font-medium">
                Your question
              </label>
              <textarea
                ref={questionRef}
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="What does this document say about..."
                rows={3}
                disabled={!documentId || askLoading}
                className="mt-2 block w-full resize-y rounded-md border border-line bg-paper px-4 py-3 font-serif text-lg leading-8 placeholder:text-mute/70 focus-visible:border-ink disabled:cursor-not-allowed disabled:opacity-60"
              />
              <div className="mt-3 flex items-center justify-between gap-4">
                <p className="text-sm text-mute">
                  {documentId
                    ? "Press ⌘/Ctrl + Enter to send."
                    : "Process a PDF to start asking."}
                </p>
                <button
                  type="submit"
                  disabled={!documentId || !question.trim() || askLoading}
                  className={primaryButton}
                >
                  {askLoading ? (
                    <>
                      <Spinner />
                      Reading...
                    </>
                  ) : (
                    "Ask"
                  )}
                </button>
              </div>
            </form>

            {askError && (
              <p
                role="alert"
                className="mt-6 border-l-2 border-danger pl-3 text-sm leading-6 text-danger"
              >
                {askError}
              </p>
            )}

            {documentId && !answer && !askLoading && (
              <div className="mt-10">
                <p className="text-sm text-mute">Try asking</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {STARTERS.map((starter) => (
                    <li key={starter}>
                      <button
                        type="button"
                        onClick={() => {
                          setQuestion(starter);
                          questionRef.current?.focus();
                        }}
                        className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm transition-colors hover:border-ink"
                      >
                        {starter}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div aria-live="polite">
              {askLoading && (
                <p className="mt-10 flex items-center gap-2 text-mute">
                  <Spinner />
                  Reading the document...
                </p>
              )}

              {answer && (
                <article className="mt-12">
                  <h2 className="text-sm font-medium text-mute">Answer</h2>
                  <p className="mt-3 max-w-[60ch] whitespace-pre-wrap font-serif text-xl leading-9">
                    {answer}
                  </p>

                  <div className="mt-12 border-t border-line pt-6">
                    <h3 className="text-sm font-medium">
                      Source passages
                      <span className="ml-2 font-normal text-mute">
                        {sources.length}{" "}
                        {sources.length === 1 ? "passage" : "passages"} used
                      </span>
                    </h3>

                    {sources.length === 0 ? (
                      <p className="mt-4 text-sm text-mute">
                        No source passages were returned for this answer.
                      </p>
                    ) : (
                      <ul className="mt-5 divide-y divide-line">
                        {sources.map((source, index) => (
                          <SourceItem
                            key={`${source.document_id}-${index}`}
                            source={source}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              )}
            </div>
          </section>
        </div>

        <footer className="mt-16 border-t border-line pt-5 sm:mt-24">
          <p className="text-xs text-mute">
            Answers are generated by AI. Check important details against the
            original PDF.
          </p>
        </footer>
      </div>
    </main>
  );
}
