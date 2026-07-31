import { NextRequest, NextResponse } from "next/server";

const BACKEND = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;

  const headers: Record<string, string> = {
    Accept: "text/html, application/json",
    "X-Requested-With": "XMLHttpRequest",
  };

  // Pass bearer token if present
  const auth = req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;

  try {
    // Try the backend web route
    const res = await fetch(`${BACKEND}/cv/share/${encodeURIComponent(uuid)}`, {
      headers,
      redirect: "manual",
    });

    const status = res.status;
    const ct = res.headers.get("content-type") || "";

    // 302 redirect to login = need auth
    if (status === 302 || status === 301) {
      const location = res.headers.get("location") || "";
      if (location.includes("login")) {
        return NextResponse.json(
          { error: "auth_required", message: "Login required to view this CV" },
          { status: 401 }
        );
      }
      // Follow redirect
      const redirectRes = await fetch(`${BACKEND}${location}`, {
        headers,
        redirect: "manual",
      });
      if (redirectRes.ok) {
        const body = await redirectRes.text();
        return new NextResponse(body, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
    }

    if (status === 403) {
      // Backend rejects - try without auth (maybe it's a public CV)
      const pubRes = await fetch(`${BACKEND}/cv/share/${encodeURIComponent(uuid)}`, {
        headers: { Accept: "text/html, application/json", "X-Requested-With": "XMLHttpRequest" },
        redirect: "manual",
      });
      if (pubRes.ok && pubRes.headers.get("content-type")?.includes("text/html")) {
        const body = await pubRes.text();
        return new NextResponse(body, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      // Both attempts failed
      return NextResponse.json(
        { error: "forbidden", message: "Access denied" },
        { status: 403 }
      );
    }

    if (status >= 400) {
      const errBody = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `backend_${status}`, message: errBody.slice(0, 200) },
        { status }
      );
    }

    // Success
    const body = await res.text();
    return new NextResponse(body, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "proxy_failed", message: err?.message || "Backend unreachable" },
      { status: 502 }
    );
  }
}