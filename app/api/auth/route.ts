import { NextResponse } from "next/server";
import { getToken, daemon } from "@/lib/pufferpanel";

/**
 * GET /api/auth/token
 * Returns a fresh access_token for WebSocket authentication.
 * The browser needs this to connect to the console WebSocket directly.
 */
export async function GET() {
  try {
    const token = await getToken();
    const wsUrl = `${daemon().replace("https://", "wss://").replace("http://", "ws://")}/console`;
    return NextResponse.json({ accessToken: token, wsUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
