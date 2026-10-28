
"use client";

import { useState } from "react";

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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
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

      const response = await fetch(`${apiUrl}/upload-pdf`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "PDF upload failed.");
      }

      setDocumentId(result.document_id);
      setMessage("PDF uploaded and processed successfully!");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Upload failed."
      );
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleAsk(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!question.trim()) {
      setMessage("Please enter a question.");
      return;
    }

    if (!apiUrl) {
      setMessage("Backend API URL is not configured.");
      return;
    }

    setAskLoading(true);
    setMessage("");
    setAnswer("");
    setSources([]);

    try {
      const response = await fetch(`${apiUrl}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.trim(),
          document_id: documentId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Could not answer the question.");
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

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-8">
      <h1 className="text-3xl font-bold">DocuMind</h1>
      <p className="text-gray-600">
        Upload a PDF and ask questions about its contents.
      </p>

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">1. Upload PDF</h2>

        <form onSubmit={handleUpload} className="space-y-4">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setDocumentId("");
              setAnswer("");
              setSources([]);
              setMessage("");
            }}
          />

          <button
            type="submit"
            disabled={!file || uploadLoading}
            className="rounded bg-blue-600 px-5 py-2 text-white disabled:opacity-50"
          >
            {uploadLoading ? "Processing PDF..." : "Upload PDF"}
          </button>
        </form>

        {documentId && (
          <p className="mt-3 break-all text-sm text-green-700">
            Upload successful. Document ID: {documentId}
          </p>
        )}
      </section>

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">2. Ask a question</h2>

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
                >
                  <p className="mb-2 text-sm font-semibold">
                    Source {index + 1} · Page {source.page_number} ·
                    Similarity: {(source.similarity * 100).toFixed(1)}%
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {source.content}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
