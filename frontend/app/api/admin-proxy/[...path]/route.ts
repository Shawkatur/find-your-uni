import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";

async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const target = `${API_URL}/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);

  // Attach admin secret server-side — never exposed to the browser
  if (ADMIN_SECRET) {
    headers.set("X-Admin-Secret", ADMIN_SECRET);
  }

  // Strip headers that shouldn't be forwarded
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("transfer-encoding");

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
    });

    const data = await upstream.arrayBuffer();

    const responseHeaders: Record<string, string> = {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "application/json",
    };
    const disposition = upstream.headers.get("Content-Disposition");
    if (disposition) {
      responseHeaders["Content-Disposition"] = disposition;
    }

    return new NextResponse(data, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("Admin proxy error:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
