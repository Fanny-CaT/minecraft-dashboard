import { verifyAdmin } from "@/lib/authGuard";
import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "@/lib/pufferpanel";

const SETTINGS_PATH = "config/dashboard-startup.json";

/**
 * GET /api/minecraft/startup
 * Returns the saved startup variables and autosave configurations.
 */
export async function GET(request: NextRequest) {
  const authResult = await verifyAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    let settings = {
      jvmArgsStart: "",
      jvmArgsEnd: "",
      serverJarFile: "paper.jar",
      enableAikarsFlags: true,
      autosaveInterval: 10,
      enableAutosaveLoop: true
    };

    try {
      const raw = await readFile(SETTINGS_PATH);
      settings = JSON.parse(raw);
    } catch {
      // Return defaults if configuration does not exist yet
    }

    return NextResponse.json(settings);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/minecraft/startup
 * Saves the startup variables and runs symlinking/renaming on JAR files.
 */
export async function POST(request: NextRequest) {
  const authResult = await verifyAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await request.json();
    const { jvmArgsStart, jvmArgsEnd, serverJarFile, enableAikarsFlags, autosaveInterval, enableAutosaveLoop } = body;

    const settings = {
      jvmArgsStart: jvmArgsStart ?? "",
      jvmArgsEnd: jvmArgsEnd ?? "",
      serverJarFile: serverJarFile || "paper.jar",
      enableAikarsFlags: enableAikarsFlags !== false,
      autosaveInterval: parseInt(autosaveInterval || "10", 10),
      enableAutosaveLoop: enableAutosaveLoop !== false
    };

    // Save variables JSON file to the server filesystem (writeFile creates parent directories automatically)
    await writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));

    // If a custom Jar is defined, replicate it to paper.jar so the daemon can launch it
    if (settings.serverJarFile !== "paper.jar") {
      try {
        const jarContent = await readFile(settings.serverJarFile);
        if (jarContent) {
          await writeFile("paper.jar", jarContent);
          console.log(`[startup variables] Successfully copied ${settings.serverJarFile} to paper.jar`);
        }
      } catch (err) {
        console.warn(`[startup variables] Failed to clone custom jar to paper.jar:`, err);
      }
    }

    return NextResponse.json({ success: true, settings });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
