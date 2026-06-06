import { NextRequest, NextResponse } from "next/server";
import { pufferFetch, listFiles, createFolder } from "@/lib/pufferpanel";
import { sendDiscordNotification } from "@/lib/discord";

export async function GET(request: NextRequest) {
  // Verify Vercel Cron Job authentication
  const authHeader = request.headers.get("Authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const rootFiles = await listFiles("");
    if (!Array.isArray(rootFiles)) {
      return NextResponse.json({ error: "Failed to read server root directory" }, { status: 500 });
    }

    const targets = rootFiles
      .map((f: any) => f.name)
      .filter((name: string) => name !== "backups" && !name.endsWith(".zip") && !name.endsWith(".tar.gz"));

    if (targets.length === 0) {
      return NextResponse.json({ error: "No files to backup" }, { status: 400 });
    }

    const backupName = `backup-auto-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    
    // Ensure backups directory exists
    try {
      await createFolder("backups");
    } catch {}

    await createFolder(`backups/${backupName}`);

    const res = await pufferFetch(`/archive/backups/${backupName}/${backupName}.zip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(targets),
    });

    if (!res.ok) {
      const text = await res.text();
      await sendDiscordNotification("❌ Automated Backup Failed", `Failed to create daily backup.\n**Error:** ${res.status} — ${text}`, 0xff0000);
      throw new Error(`Auto backup creation failed: ${res.status} — ${text}`);
    }

    await sendDiscordNotification("✅ Automated Backup Successful", `Successfully created daily backup archive:\n\`${backupName}.zip\``, 0x00ff00);

    return NextResponse.json({ success: true, filename: backupName, message: "Automated backup initiated successfully." });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[CRON] Automated backup failed:", msg);
    await sendDiscordNotification("❌ Automated Backup Error", `An error occurred during the backup process.\n**Details:** ${msg}`, 0xff0000);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
