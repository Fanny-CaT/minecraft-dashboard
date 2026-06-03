import { NextRequest, NextResponse } from "next/server";
import { pufferFetch, getStatus, powerAction, listFiles, deleteFile, getServerDetails } from "@/lib/pufferpanel";

/**
 * POST /api/minecraft/reinstall
 * Body: { version: string }
 *
 * Safely updates the server version and rebuilds the files.
 * Wipes out existing worlds and configs (reset) but leaves 'backups/' intact.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { version } = body;
    if (!version) {
      return NextResponse.json({ error: "Version required" }, { status: 400 });
    }

    // 1. Query PaperMC API to resolve the latest build for the chosen version
    const paperApiUrl = `https://api.papermc.io/v2/projects/paper/versions/${version}`;
    const buildRes = await fetch(paperApiUrl, { cache: "no-store" });
    if (!buildRes.ok) {
      throw new Error(`Failed to resolve PaperMC build for Minecraft version ${version}. Check if the version is valid.`);
    }
    const buildData = await buildRes.json();
    const buildsList = buildData.builds || [];
    if (buildsList.length === 0) {
      throw new Error(`No builds found for version ${version}`);
    }
    const latestBuild = String(buildsList[buildsList.length - 1]);

    // 2. Stop the server if running to release file locks
    const status = await getStatus();
    if (status.running) {
      try {
        await powerAction("stop");
      } catch (err) {
        console.warn("[reinstall] Stop command returned error, continuing:", err);
      }
      // Wait for process shutdown
      await new Promise((resolve) => setTimeout(resolve, 3500));
    }

    // 3. Scan the root directory and delete everything EXCEPT the 'backups' folder
    let files: any[] = [];
    try {
      files = (await listFiles("")) as any[];
    } catch (err) {
      console.warn("[reinstall] Failed to scan server root directory, proceeding anyway:", err);
    }

    for (const f of files) {
      const name = f.name;
      // Skip the backups directory and its variants to prevent deleting user backups
      if (name === "backups" || name === "./backups" || name === "/backups") {
        continue;
      }
      try {
        await deleteFile(name);
      } catch (err) {
        console.warn(`[reinstall] Failed to delete file or folder '${name}':`, err);
      }
    }

    // 4. Update the variables configuration in PufferPanel
    const currentConfig = await getServerDetails();
    const dataObj = currentConfig.data || {};

    if (dataObj.version) dataObj.version.value = version;
    if (dataObj.build) dataObj.build.value = latestBuild;

    // Dynamically assign correct Java versions
    // PaperMC 1.21.x requires Java 21. PaperMC 1.17-1.20 runs on Java 17.
    let javaVer = 21;
    const parts = version.split(".");
    const majorVer = parseInt(parts[1] || "21", 10);
    if (majorVer >= 21) {
      javaVer = 21;
    } else {
      javaVer = 17; // Stable target for 1.17 to 1.20
    }
    if (dataObj.javaversion) dataObj.javaversion.value = javaVer;

    // Submit variable changes
    const updateRes = await pufferFetch("/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: dataObj }),
    });

    if (!updateRes.ok) {
      const text = await updateRes.text();
      throw new Error(`Failed to update variables in PufferPanel: ${updateRes.status} — ${text}`);
    }

    // 5. Trigger PufferPanel native daemon re-installation script
    const installRes = await pufferFetch("/install", { method: "POST" });
    if (!installRes.ok) {
      const text = await installRes.text();
      throw new Error(`Failed to trigger installation task on daemon: ${installRes.status} — ${text}`);
    }

    return NextResponse.json({ success: true, version, build: latestBuild });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
