import { NextRequest, NextResponse } from "next/server";
import { pufferFetch } from "@/lib/pufferpanel";

/**
 * GET /api/files/download
 * Query params:
 *   path: string — path of the file to download
 *
 * Serves the file with Content-Disposition: attachment header for download.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });

    const clean = path.replace(/^\//, "");
    const res = await pufferFetch(`/file/${clean}`);
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Download failed: ${res.status} — ${text}` }, { status: res.status });
    }

    const filename = clean.split("/").pop() || "file";

    return new NextResponse(res.body, {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": res.headers.get("Content-Type") || "application/octet-stream",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
