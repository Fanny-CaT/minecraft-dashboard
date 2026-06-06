import { verifyAdmin } from "@/lib/authGuard";
import { NextRequest, NextResponse } from "next/server";
import { pufferFetch } from "@/lib/pufferpanel";
import { sanitizePath } from "@/lib/pathUtils";

/**
 * POST /api/upload
 * Accepts multipart/form-data with fields:
 *   path: string   — destination path on the server (e.g. "plugins/MyPlugin.jar")
 *   file: File     — the binary file content
 *
 * Proxies the binary to PufferPanel's file PUT endpoint.
 */
export async function POST(request: NextRequest) {
  const authResult = await verifyAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const form = await request.formData();
    const rawPath = form.get("path") as string | null;
    const file    = form.get("file") as File | null;

    if (!rawPath) return NextResponse.json({ error: "path field required" }, { status: 400 });
    if (!file) return NextResponse.json({ error: "file field required" }, { status: 400 });

    const clean = sanitizePath(rawPath, false); // DO NOT allow empty path
    if (clean === null) {
      return NextResponse.json({ error: "Invalid path or attempting to modify root directory" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();

    const res = await pufferFetch(`/file/${clean}`, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: bytes,
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Upload failed: ${res.status} — ${text}` }, { status: res.status });
    }

    return NextResponse.json({ success: true, name: file.name, path: clean });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
