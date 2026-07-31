import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;

  // Extract Bearer token from request
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  // Try backend /cv/share/{uuid} — the main backend endpoint
  const headers: Record<string, string> = { Accept: "text/html" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${BACKEND_URL}/cv/share/${uuid}`, {
      headers,
      redirect: "follow",
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        const body = await res.text();
        return new NextResponse(body, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
    }
  } catch {
    // Fall through to fallback
  }

  // Fallback: generate a basic preview from the resume data
  try {
    const resumeRes = await fetch(`${BACKEND_URL}/api/candidate/cv/resumes/${uuid}`, {
      headers: { Authorization: `Bearer ${token || ""}`, Accept: "application/json" },
    });

    if (resumeRes.ok) {
      const resumeData = await resumeRes.json();
      const resume = resumeData?.data || resumeData;

      // Try to get demo HTML for the template
      const slug = resume?.template_slug || resume?.template_name || "classic";

      try {
        const demoRes = await fetch(`${BACKEND_URL}/cv/demo/${slug}`, {
          headers: { Accept: "text/html" },
        });

        if (demoRes.ok) {
          const demoHtml = await demoRes.text();
          return new NextResponse(demoHtml, {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }
      } catch {
        // Demo endpoint failed
      }
    }
  } catch {
    // Could not fetch resume data
  }

  return new NextResponse(
    JSON.stringify({ error: "preview_not_found", message: "CV preview could not be loaded" }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
}