import { NextRequest, NextResponse } from "next/server";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "");

async function fetchWithAuth(path: string, token?: string): Promise<Response | null> {
  const headers: Record<string, string> = { Accept: "text/html" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Try multiple backend endpoints
  const endpoints = [
    `${API_URL}${path}`,
    `${API_URL}/candidate/cv/preview/${path.split("/").pop()}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers, redirect: "follow" });
      if (res.ok) return res;
    } catch { /* try next */ }
  }
  return null;
}

function extractToken(request: NextRequest): string | null {
  // Try to get token from cookies or Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);

  const cookies = request.headers.get("cookie") || "";
  // Try reading from auth-storage cookie or XSRF
  const match = cookies.match(/auth-storage=([^;]+)/);
  if (match) {
    try {
      const decoded = decodeURIComponent(match[1]);
      const parsed = JSON.parse(decoded);
      return parsed?.state?.token || null;
    } catch { /* ignore */ }
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  const token = extractToken(request);

  // Try /cv/share/{uuid} (public with share token) — most likely backend endpoint
  const res = await fetchWithAuth(`/cv/share/${uuid}`, token);

  if (res) {
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new NextResponse(
    JSON.stringify({
      error: "preview_not_found",
      message: "CV preview could not be loaded. The backend endpoint may not be configured.",
    }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
}