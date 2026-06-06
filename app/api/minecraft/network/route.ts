import { verifyAdmin } from "@/lib/authGuard";
import { NextRequest, NextResponse } from "next/server";
import { getServerDetails, pufferFetch } from "@/lib/pufferpanel";

/**
 * GET /api/minecraft/network
 * Returns the current PufferPanel IP and Port variable settings.
 */
export async function GET() {
  try {
    const details = await getServerDetails();
    const data = details?.data || {};
    const ip = data.ip?.value || "0.0.0.0";
    const port = data.port?.value || 25565;
    return NextResponse.json({ ip, port });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/minecraft/network
 * Updates the bind IP and port variables inside PufferPanel.
 */
export async function POST(request: NextRequest) {
  const authResult = await verifyAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await request.json();
    const { ip, port } = body;

    if (!ip) {
      return NextResponse.json({ error: "Bind IP is required" }, { status: 400 });
    }
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      return NextResponse.json({ error: "Invalid port number" }, { status: 400 });
    }

    // 1. Fetch current details to get full data schema
    const current = await getServerDetails();
    const dataObj = current.data || {};

    // 2. Set new values
    if (dataObj.ip) dataObj.ip.value = ip;
    if (dataObj.port) dataObj.port.value = portNum;

    // 3. Post updated variables
    const res = await pufferFetch("/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: dataObj }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to update variables in PufferPanel: ${res.status} — ${text}`);
    }

    return NextResponse.json({ success: true, ip, port: portNum });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
