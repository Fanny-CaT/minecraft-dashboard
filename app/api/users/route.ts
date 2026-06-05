import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, sendConsoleCommand } from "@/lib/pufferpanel";

type ListType = "ops" | "banned-players" | "whitelist" | "banned-ips" | "all-players";

const FILE_MAP: Record<ListType, string> = {
  "ops":            "ops.json",
  "banned-players": "banned-players.json",
  "whitelist":      "whitelist.json",
  "banned-ips":     "banned-ips.json",
  "all-players":    "usercache.json",
};

/**
 * GET /api/users?list=ops|banned-players|whitelist
 * Returns the parsed JSON array from the corresponding MC file.
 *
 * POST /api/users
 * Body: { action: "command", command: "ban steve" }
 *   OR: { action: "write", list: "ops", data: [...] }
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const list = (searchParams.get("list") || "ops") as ListType;

    if (!FILE_MAP[list]) {
      return NextResponse.json({ error: `Unknown list: ${list}` }, { status: 400 });
    }

    const raw = await readFile(FILE_MAP[list]);
    // MC files can be empty "[]" or contain full JSON
    let parsed: unknown[] = [];
    try { parsed = JSON.parse(raw); } catch { parsed = []; }
    return NextResponse.json({ list, data: parsed });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Option A: send a Minecraft command (op/ban/whitelist add)
    if (action === "command") {
      const { command } = body;
      if (!command) return NextResponse.json({ error: "command required" }, { status: 400 });
      await sendConsoleCommand(command);
      return NextResponse.json({ success: true });
    }

    // Option B: overwrite the JSON file directly
    if (action === "write") {
      const { list, data } = body;
      if (!FILE_MAP[list as ListType]) {
        return NextResponse.json({ error: `Unknown list: ${list}` }, { status: 400 });
      }
      await writeFile(FILE_MAP[list as ListType], JSON.stringify(data, null, 2));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
