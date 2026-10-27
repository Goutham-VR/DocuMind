
import { createClient } from "@supabase/supabase-js";
import { extractText, getDocumentProxy } from "unpdf";
export const runtime = "nodejs";


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        { error: "Please select a PDF." },
        { status: 400 }
      );
    }

    if (
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return Response.json(
        { error: "Only PDF files are allowed." },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json(
        { error: "Maximum file size is 10 MB." },
        { status: 400 }
      );
    }

    
const bytes = new Uint8Array(await file.arrayBuffer());

const pdf = await getDocumentProxy(bytes);

const { totalPages, text } = await extractText(pdf);

const pageTexts = Array.isArray(text) ? text : [text];

const pages: { page: number; content: string }[] =
  pageTexts.map((content, index) => ({
    page: index + 1,
    content: content.trim(),
  }));

if (!pages.some((p) => p.content.length > 0)) {
  return Response.json(
    {
      error:
        "No readable text found. Scanned PDFs may require OCR.",
    },
    { status: 422 }
  );
}



    const documentId = crypto.randomUUID();
    const storagePath =
      `${documentId}/${crypto.randomUUID()}.pdf`;

    // Upload the original PDF.
    const { error: uploadError } = await supabase.storage
      .from("pdfs")
      .upload(storagePath, bytes, {
        contentType: "application/pdf",
      });

    if (uploadError) throw uploadError;

    // Save document metadata.
    const { error: insertError } = await supabase
      .from("documents")
      .insert({
        id: documentId,
        name: file.name,
        file: storagePath,
      });

    if (insertError) {
      await supabase.storage
        .from("pdfs")
        .remove([storagePath]);

      throw insertError;
    }

    return Response.json({
      message: "PDF uploaded successfully.",
      documentId,
      name: file.name,
      totalPages: pages.length,
      pages,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return Response.json(
      { error: "Upload failed. Check the server terminal." },
      { status: 500 }
    );
  }
}
