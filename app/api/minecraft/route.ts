import { verifyAdmin } from "@/lib/authGuard";
/**
 * app/api/minecraft/route.ts — Legacy compatibility shim.
 * The new routes are:
 *   /api/auth    — token
 *   /api/status  — status + stats
 *   /api/power   — power actions + console commands
 *   /api/files   — file CRUD
 *   /api/config  — server.properties
 *   /api/users   — ops/bans/whitelist
 *
 * This file is kept so any old references still resolve.
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken, getStatus, getStats, powerAction, sendConsoleCommand, listFiles, readFile, writeFile, createFolder, deleteFile } from "@/lib/pufferpanel";

export async function GET(request: NextRequest) {
  const authResult = await verifyAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "token") {
      const token = await getToken();
      return NextResponse.json({ accessToken: token });
    }

    if (action === "logs") {
      // PufferPanel v2.7.1 has no REST log history — return empty
      return NextResponse.json({ logs: "" });
    }

    if (action === "files") {
      const path = searchParams.get("path") || "";
      const files = await listFiles(path);
      return NextResponse.json(files);
    }

    if (action === "file") {
      const path = searchParams.get("path");
      if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });
      const content = await readFile(path);
      return new NextResponse(content, { headers: { "Content-Type": "text/plain" } });
    }

    // Default: combined status + stats
    const { running } = await getStatus();
    let cpu = 0, memory = 0;
    if (running) {
      try { const s = await getStats(); cpu = s.cpu; memory = s.memory; } catch { /* ok */ }
    }
    return NextResponse.json({
      status: running ? "online" : "offline",
      cpu, memory,
      maxMemory: 12 * 1024 * 1024 * 1024,
      maxCpus: 4,
      serverId: process.env.PUFFER_SERVER_ID || "",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await verifyAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await request.json();
    const { action, command, path, content } = body;

    if (action === "command") {
      await sendConsoleCommand(command);
      return NextResponse.json({ success: true });
    }
    if (action === "kill") {
      await powerAction("kill");
      return NextResponse.json({ success: true });
    }
    if (action === "save_file") {
      await writeFile(path, content ?? "");
      return NextResponse.json({ success: true });
    }
    if (action === "create_folder") {
      await createFolder(path);
      return NextResponse.json({ success: true });
    }
    if (action === "delete_file") {
      await deleteFile(path);
      return NextResponse.json({ success: true });
    }
    if (["start","stop","restart"].includes(action)) {
      await powerAction(action as "start" | "stop" | "restart");
      return NextResponse.json({ success: true, action });
    }
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
