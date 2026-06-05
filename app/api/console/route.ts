import { verifyAdmin } from "@/lib/authGuard";
import { NextRequest, NextResponse } from "next/server";
import { pufferFetch } from "@/lib/pufferpanel";

/**
 * GET /api/console
 * Query params:
 *   time: string — UNIX timestamp (epoch) to get logs since (default 0)
 *
 * Proxies to PufferPanel daemon logs endpoint.
 */
export async function GET(request: NextRequest) {
  const authResult = await verifyAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const time = searchParams.get("time") || "0";
    
    const res = await pufferFetch(`/console?time=${time}`);
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Console fetch failed: ${res.status} — ${text}` }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
