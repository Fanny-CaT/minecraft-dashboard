import { NextRequest, NextResponse } from "next/server";
import { pufferFetch, listFiles, createFolder, getStatus, powerAction, deleteFile } from "@/lib/pufferpanel";

/**
 * GET /api/backups
 * Lists all backup folders in the backups/ folder and reads zip file sizes inside them.
 *
 * POST /api/backups
 * Body: { action: "create" }
 *       { action: "restore", filename: string }
 *       { action: "delete", filename: string }
 */

export async function GET() {
  try {
    let files: any[] = [];
    try {
      files = (await listFiles("backups")) as any[];
    } catch (err: any) {
      // If backups folder doesn't exist, create it and return empty
      try {
        await createFolder("backups");
      } catch (createErr) {
        console.warn("[backups] Failed to auto-create backups directory:", createErr);
      }
      return NextResponse.json([]);
    }

    if (!Array.isArray(files)) {
      return NextResponse.json([]);
    }

    const backups: any[] = [];
    for (const f of files) {
      // Backups are now stored in subdirectories: backups/backup-{timestamp}/backup-{timestamp}.zip
      if (!f.isFile && f.name.startsWith("backup-") && f.name !== ".." && f.name !== ".") {
        let zipSize = 0;
        let modifyTime = f.modifyTime || Date.now();
        try {
          const subFiles = (await listFiles(`backups/${f.name}`)) as any[];
          if (Array.isArray(subFiles)) {
            const zipFile = subFiles.find(
              (sf: any) => sf.isFile && (sf.name === `${f.name}.zip` || sf.name === `${f.name}.tar.gz`)
            );
            if (zipFile) {
              zipSize = zipFile.size || 0;
              modifyTime = zipFile.modifyTime || modifyTime;
            }
          }
        } catch (subErr) {
          console.warn(`[backups] Failed to list contents of backup directory ${f.name}:`, subErr);
        }

        backups.push({
          name: f.name,
          size: zipSize,
          modifyTime: modifyTime,
        });
      }
    }

    backups.sort((a, b) => b.modifyTime - a.modifyTime); // Newest first
    return NextResponse.json(backups);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, filename } = await request.json();

    switch (action) {
      case "create": {
        // 1. Get root directory listing to decide what to back up
        const rootFiles = await listFiles("");
        if (!Array.isArray(rootFiles)) {
          return NextResponse.json({ error: "Failed to read server root directory" }, { status: 500 });
        }

        // 2. Filter out backups folder and other archive files
        const targets = rootFiles
          .map((f: any) => f.name)
          .filter((name: string) => name !== "backups" && !name.endsWith(".zip") && !name.endsWith(".tar.gz"));

        if (targets.length === 0) {
          return NextResponse.json({ error: "No files to backup" }, { status: 400 });
        }

        // 3. Create unique backup folder name
        const backupName = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}`;

        // 4. Create the nested directory backups/{backupName}
        await createFolder(`backups/${backupName}`);

        // 5. Create zip file in backups/{backupName}/backupName.zip
        const res = await pufferFetch(`/archive/backups/${backupName}/${backupName}.zip`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(targets),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Backup creation failed: ${res.status} — ${text}`);
        }

        return NextResponse.json({ success: true, filename: backupName });
      }

      case "restore": {
        if (!filename) return NextResponse.json({ error: "filename required" }, { status: 400 });

        // 1. Stop the server if running to release file locks
        const status = await getStatus();
        if (status.running) {
          try {
            await powerAction("stop");
          } catch (err) {
            console.warn("[backups restore] Stop command returned error, continuing:", err);
          }
          // Wait for process shutdown (3.5 seconds)
          await new Promise((resolve) => setTimeout(resolve, 3500));
        }

        // 2. Delete all existing server directories (excluding 'backups') prior to extract to prevent merge conflicts
        let rootFiles: any[] = [];
        try {
          rootFiles = (await listFiles("")) as any[];
        } catch (err) {
          console.warn("[backups restore] Failed to list root directory before restore:", err);
        }

        if (Array.isArray(rootFiles)) {
          for (const f of rootFiles) {
            if (!f.isFile && f.name !== "backups" && f.name !== "." && f.name !== "..") {
              try {
                await deleteFile(f.name);
              } catch (err) {
                console.warn(`[backups restore] Failed to delete directory '${f.name}':`, err);
              }
            }
          }
        }

        // 3. Call the extraction daemon endpoint pointing to backups/{filename}/{filename}.zip
        const res = await pufferFetch(`/extract/backups/${filename}/${filename}.zip?destination=.`, {
          method: "GET",
        });

        if (!res.ok) {
          const text = await res.text();
          let msg = `Extraction failed: ${res.status}`;
          try {
            const errObj = JSON.parse(text);
            msg = errObj.error?.msg || msg;
          } catch {
            if (text) msg = text;
          }
          throw new Error(msg);
        }

        return NextResponse.json({ success: true });
      }

      case "delete": {
        if (!filename) return NextResponse.json({ error: "filename required" }, { status: 400 });

        // We delete the directory backups/{filename} directly.
        // Since backups/{filename} is a directory, the daemon's delete handler will succeed,
        // deleting both the directory and the nested zip file inside it.
        await deleteFile(`backups/${filename}`);

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
