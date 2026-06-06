import { verifyAdmin } from "@/lib/authGuard";
import { NextRequest, NextResponse } from "next/server";
import { listFiles, readFile, writeFile, createFolder, deleteFile } from "@/lib/pufferpanel";
import { sanitizePath } from "@/lib/pathUtils";

/**
 * GET /api/files?path=<path>          — list directory
 * GET /api/files?path=<path>&read=1   — read file contents
 *
 * POST /api/files
 * Body: { action: "write", path, content }
 *       { action: "mkdir", path }
 *       { action: "delete", path }
 */

export async function GET(request: NextRequest) {
  const authResult = await verifyAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const rawPath = searchParams.get("path") || "";
    const read = searchParams.get("read") === "1";
    const unzip = searchParams.get("unzip") === "1";

    const path = sanitizePath(rawPath, true); // Allow empty path for listing root directory
    if (path === null) {
      return NextResponse.json({ error: "Invalid or unauthorized path" }, { status: 400 });
    }

    if (read) {
      if (path === "") {
         return NextResponse.json({ error: "Cannot read root directory as file" }, { status: 400 });
      }
      const content = await readFile(path, unzip);
      return new NextResponse(content, { headers: { "Content-Type": "text/plain" } });
    }

    const files = await listFiles(path);
    return NextResponse.json(files);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await verifyAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const { action, path: rawPath, content } = await request.json();

    const path = sanitizePath(rawPath, false); // DO NOT allow empty path for writes/deletes
    if (path === null) {
      return NextResponse.json({ error: "Invalid path or attempting to modify root directory" }, { status: 400 });
    }

    switch (action) {
      case "write":
        await writeFile(path, content ?? "");
        return NextResponse.json({ success: true });

      case "mkdir":
        await createFolder(path);
        return NextResponse.json({ success: true });

      case "delete":
        await deleteFile(path);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
