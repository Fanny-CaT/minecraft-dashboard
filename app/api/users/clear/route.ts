import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/authGuard";
import { deleteFile, sendConsoleCommand } from "@/lib/pufferpanel";

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (admin instanceof NextResponse) return admin;

  try {
    const { uuid, name } = await req.json();

    if (!uuid && !name) {
      return NextResponse.json({ error: "Must provide uuid or name" }, { status: 400 });
    }

    // 1. Kick the player if they are online to ensure files aren't locked/recreated
    if (name) {
      await sendConsoleCommand(`kick ${name} Your player data is being cleared by an admin.`);
    }

    // Give the server a moment to save and release file locks
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Delete playerdata and stats files if UUID is known
    if (uuid) {
      const filesToDelete = [
        `world/playerdata/${uuid}.dat`,
        `world/playerdata/${uuid}.dat_old`,
        `world/stats/${uuid}.json`,
        `world/advancements/${uuid}.json`,
        `plugins/Essentials/userdata/${uuid}.yml`
      ];

      for (const file of filesToDelete) {
        try {
          await deleteFile(file);
        } catch (e) {
          // It's normal if the file doesn't exist
          console.log(`[clear-player] Could not delete ${file}:`, e);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[clear-player] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
