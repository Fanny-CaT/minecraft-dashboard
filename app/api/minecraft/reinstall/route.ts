import { NextRequest, NextResponse } from "next/server";
import { pufferFetch, getStatus, powerAction, listFiles, deleteFile, getServerDetails } from "@/lib/pufferpanel";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function getVanillaUrl(version: string) {
  const res = await fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json");
  const manifest = await res.json();
  const v = manifest.versions.find((v: any) => v.id === version);
  if (!v) throw new Error("Vanilla version not found");
  const pkgRes = await fetch(v.url);
  const pkg = await pkgRes.json();
  return pkg.downloads.server.url;
}

/**
 * POST /api/minecraft/reinstall
 * Body: { version: string }
 *
 * Safely updates the server version and rebuilds the files.
 * Wipes out existing worlds and configs (reset) but leaves 'backups/' intact.
 */
// Allowlist of versions the UI exposes — reject anything else server-side
const ALLOWED_VERSIONS = [
  "1.21.11", "1.21.4", "1.21.1",
  "1.20.4",  "1.20.1",
  "1.19.4",  "1.18.2",  "1.16.5",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { version, provider = "paper" } = body;
    if (!version) {
      return NextResponse.json({ error: "Version required" }, { status: 400 });
    }

    // Guard: only allow explicitly whitelisted versions
    if (!ALLOWED_VERSIONS.includes(version)) {
      return NextResponse.json({ error: `Version '${version}' is not permitted` }, { status: 400 });
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
      // Skip the backups and logs directory to prevent deleting user backups and historical logs
      if (name === "backups" || name === "./backups" || name === "/backups" || name === "logs" || name === "./logs" || name === "/logs") {
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
    // We only trigger /install for 'paper' since the template is hardcoded to PaperMC.
    if (provider === "paper") {
      const installRes = await pufferFetch("/install", { method: "POST" });
      if (!installRes.ok) {
        const text = await installRes.text();
        throw new Error(`Failed to trigger installation task on daemon: ${installRes.status} — ${text}`);
      }
    } else {
      // For non-paper, we must manually write the JAR file and eula/server.properties
      let jarUrl = "";
      if (provider === "purpur") {
        jarUrl = `https://api.purpurmc.org/v2/purpur/${version}/latest/download`;
      } else if (provider === "spigot") {
        jarUrl = `https://download.getbukkit.org/spigot/spigot-${version}.jar`;
      } else if (provider === "vanilla") {
        jarUrl = await getVanillaUrl(version);
      }

      if (jarUrl) {
        // Stream the JAR directly from the source to PufferPanel
        const jarRes = await fetch(jarUrl);
        if (!jarRes.ok) throw new Error(`Failed to fetch ${provider} jar from ${jarUrl}`);
        
        const jarBuffer = await jarRes.arrayBuffer();
        const putJarRes = await pufferFetch("/file/paper.jar", {
          method: "PUT",
          headers: { "Content-Type": "application/java-archive" },
          body: jarBuffer,
        });
        if (!putJarRes.ok) throw new Error(`Failed to upload ${provider} jar to panel: ${await putJarRes.text()}`);

        // Write eula.txt
        await pufferFetch("/file/eula.txt", {
          method: "PUT",
          headers: { "Content-Type": "text/plain" },
          body: "eula=true",
        });

        // Write server.properties basic defaults (IP and port come from PufferPanel template normally, but we can't reliably resolve them without panel API. We'll let user set them or rely on PufferPanel's start args overriding them.)
        await pufferFetch("/file/server.properties", {
          method: "PUT",
          headers: { "Content-Type": "text/plain" },
          body: `server-ip=0.0.0.0\nserver-port=${dataObj.port?.value || 25565}\nmotd=${dataObj.motd?.value || "A Minecraft Server"}\n`,
        });
      }
    }

    return NextResponse.json({ success: true, version, build: latestBuild });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
