import { verifyAdmin } from "@/lib/authGuard";
import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, parseServerProperties, serializeServerProperties } from "@/lib/pufferpanel";

const CONFIG_PATH = "server.properties";

/**
 * GET /api/config
 * Returns server.properties as a parsed JSON object.
 *
 * POST /api/config
 * Body: { props: Record<string, string> }
 * Saves back to server.properties preserving comments.
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const raw = await readFile(CONFIG_PATH);
    const props = parseServerProperties(raw);
    return NextResponse.json({ props, raw });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await verifyAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const { props } = await request.json();
    if (!props || typeof props !== "object") {
      return NextResponse.json({ error: "props object required" }, { status: 400 });
    }

    // Read current to preserve comments
    let original = "";
    try { original = await readFile(CONFIG_PATH); } catch { /* new file */ }

    const serialized = serializeServerProperties(props, original);
    await writeFile(CONFIG_PATH, serialized);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
