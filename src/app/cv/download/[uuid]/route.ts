import { NextRequest, NextResponse } from "next/server";

const backendBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  const url = `${backendBase}/api/cv/${uuid}/download-pdf`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/pdf" },
      cache: "no-store",
    });

    if (!res.ok) {
      return new NextResponse(
        JSON.stringify({ error: `Backend returned ${res.status}` }),
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