import { NextRequest, NextResponse } from "next/server";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;

  try {
    const res = await fetch(`${API_URL}/cv/preview/${encodeURIComponent(uuid)}`, {
      headers: { Accept: "text/html" },
    });

    const body = await res.text();

    return new NextResponse(body, {
      status: res.status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    return new NextResponse("Failed to load template preview", { status: 502 });
  }
}