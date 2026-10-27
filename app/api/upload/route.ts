
export const runtime = "nodejs";

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

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      return Response.json(
        { error: "Backend API URL is not configured." },
        { status: 500 }
      );
    }

    // Forward the PDF to the FastAPI backend on Render.
    const backendForm = new FormData();
    backendForm.append("file", file, file.name);

    const response = await fetch(
      `${apiUrl.replace(/\/$/, "")}/upload-pdf`,
      {
        method: "POST",
        body: backendForm,
      }
    );

    const result = await response.json();

    return Response.json(result, {
      status: response.status,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return Response.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
