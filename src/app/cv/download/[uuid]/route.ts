import { NextRequest, NextResponse } from "next/server";

const backendBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  const url = `${backendBase}/api/cv/${uuid}/download-pdf`;

  // Forward auth from cookie or header
  const cookieHeader = req.headers.get("cookie") || "";
  const authHeader = req.headers.get("authorization") || "";

  const headers: Record<string, string> = {
    Accept: "application/pdf",
  };
  if (cookieHeader) headers["Cookie"] = cookieHeader;
  if (authHeader) headers["Authorization"] = authHeader;

  try {
    const res = await fetch(url, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return new NextResponse(
        JSON.stringify({ error: `Backend ${res.status}`, body }),
        { status: res.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const contentType = res.headers.get("content-type") || "application/pdf";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="resume-${uuid}.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: any) {
    return new NextResponse(
      JSON.stringify({ error: err?.message || "Download failed" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}