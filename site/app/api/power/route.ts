import { verifyAdmin } from "@/lib/authGuard";
import { NextRequest, NextResponse } from "next/server";
import { powerAction, sendConsoleCommand } from "@/lib/pufferpanel";
import { sendDiscordNotification } from "@/lib/discord";

/**
 * POST /api/power
 * Body: { action: "start" | "stop" | "restart" | "kill" }
 *
 * POST /api/power  with { action: "command", command: "say hello" }
 * Sends a raw command to the console.
 */
export async function POST(request: NextRequest) {
  const authResult = await verifyAdmin(request);
  if (authResult instanceof Response) return authResult;

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

    // Send discord notification for power actions
    let title = "";
    let desc = "";
    let color = 0xaaaaaa;
    
    if (action === "start") {
      title = "🟢 Server Starting";
      desc = "The Minecraft server is starting up...";
      color = 0x00ff00;
    } else if (action === "stop") {
      title = "🔴 Server Stopping";
      desc = "The Minecraft server has been instructed to stop safely.";
      color = 0xffa500;
    } else if (action === "restart") {
      title = "🔄 Server Restarting";
      desc = "The Minecraft server is rebooting.";
      color = 0x00ffff;
    } else if (action === "kill") {
      title = "💀 Server Killed";
      desc = "The Minecraft server process was forcefully terminated.";
      color = 0xff0000;
    }

    if (title) {
      await sendDiscordNotification(title, desc, color);
    }

    return NextResponse.json({ success: true, action });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
