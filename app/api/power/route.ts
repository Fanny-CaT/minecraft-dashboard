import { NextRequest, NextResponse } from "next/server";
import { powerAction, sendConsoleCommand } from "@/lib/pufferpanel";

/**
 * POST /api/power
 * Body: { action: "start" | "stop" | "restart" | "kill" }
 *
 * POST /api/power  with { action: "command", command: "say hello" }
 * Sends a raw command to the console.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, command } = body;

    if (action === "command") {
      if (!command) return NextResponse.json({ error: "command required" }, { status: 400 });
      await sendConsoleCommand(command);
      return NextResponse.json({ success: true });
    }

    if (!["start", "stop", "restart", "kill"].includes(action)) {
      return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }

    await powerAction(action as "start" | "stop" | "restart" | "kill");
    return NextResponse.json({ success: true, action });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
