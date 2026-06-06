import { verifyAdmin } from "@/lib/authGuard";
import { NextRequest, NextResponse } from "next/server";
import { pufferFetch } from "@/lib/pufferpanel";

/**
 * POST /api/plugins/install
 * Body: { provider?: string, downloadUrl?: string, filename?: string, versionId?: string, projectId?: string }
 *
 * Downloads the jar file and uploads it to the server's plugins/ directory.
 * Supports direct Spiget download URLs, Modrinth version lookup, and Hangar version lookup.
 */
export async function POST(request: NextRequest) {
  const authResult = await verifyAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await request.json();
    const { provider, downloadUrl, filename, versionId, projectId } = body;

    const userAgent = "MeowtopiaMinecraftDashboard/1.0.0 (catfanny13@gmail.com)";
    let targetUrl = downloadUrl;
    let targetFilename = filename || "plugin.jar";

    // 1. Resolve Modrinth download details
    if (provider === "modrinth") {
      if (!versionId) {
        return NextResponse.json({ error: "versionId required for Modrinth provider" }, { status: 400 });
      }

      const versionRes = await fetch(`https://api.modrinth.com/v2/version/${versionId}`, {
        headers: { "User-Agent": userAgent },
        cache: "no-store",
      });

      if (!versionRes.ok) {
        throw new Error(`Modrinth version fetch failed: ${versionRes.status}`);
      }

      const versionData = await versionRes.json();
      const files = versionData.files || [];
      const primaryFile = files.find((f: any) => f.primary) || files[0];

      if (!primaryFile || !primaryFile.url) {
        throw new Error("No files found in the Modrinth version");
      }

      targetUrl = primaryFile.url;
      // Force generic name to avoid versioned duplicates
      // targetFilename = primaryFile.filename || targetFilename;
    }

    // 2. Resolve Hangar download details
    if (provider === "hangar") {
      if (!projectId) {
        return NextResponse.json({ error: "projectId (owner/slug) required for Hangar provider" }, { status: 400 });
      }

      const parts = projectId.split("/");
      if (parts.length !== 2) {
        return NextResponse.json({ error: "Invalid projectId format for Hangar. Expected owner/slug" }, { status: 400 });
      }

      const [owner, slug] = parts;
      const versionRes = await fetch(`https://hangar.papermc.io/api/v1/projects/${owner}/${slug}/versions?limit=1`, {
        headers: { "User-Agent": userAgent },
        cache: "no-store",
      });

      if (!versionRes.ok) {
        throw new Error(`Hangar version fetch failed: ${versionRes.status}`);
      }

      const versionData = await versionRes.json();
      const versionsList = versionData.result || [];
      if (versionsList.length === 0) {
        throw new Error("No versions found for this Hangar project");
      }

      const latestVer = versionsList[0];
      const downloads = latestVer.downloads || {};
      const paperDl = downloads.PAPER || downloads.SPIGOT || Object.values(downloads)[0] as any;
      if (!paperDl) {
        throw new Error("No download files found for this Hangar project version");
      }

      targetUrl = paperDl.downloadUrl || paperDl.externalUrl;
      // Force generic name to avoid versioned duplicates
      // targetFilename = paperDl.fileInfo?.name || `${slug}.jar`;
    }

    if (!targetUrl) {
      return NextResponse.json({ error: "Download URL or project/version ID required" }, { status: 400 });
    }

    // 3. Fetch the plugin file from the remote repository
    const fileRes = await fetch(targetUrl, {
      headers: { "User-Agent": userAgent },
      cache: "no-store",
    });

    if (!fileRes.ok) {
      throw new Error(`Failed to fetch plugin file from remote: ${fileRes.status}`);
    }



    const bytes = await fileRes.arrayBuffer();

    // 4. Upload it to the server's plugins directory
    const cleanFilename = targetFilename.endsWith(".jar") ? targetFilename : `${targetFilename}.jar`;
    const destinationPath = `plugins/${cleanFilename}`;

    const res = await pufferFetch(`/file/${destinationPath}`, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: bytes,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Upload to PufferPanel failed: ${res.status} — ${text}`);
    }

    return NextResponse.json({ success: true, filename: cleanFilename });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
