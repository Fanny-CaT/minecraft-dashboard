import { verifyAdmin } from "@/lib/authGuard";
import { NextRequest, NextResponse } from "next/server";
import { pufferFetch } from "@/lib/pufferpanel";

/**
 * POST /api/datapacks/install
 * Body: { provider?: string, downloadUrl?: string, filename?: string, versionId?: string, projectId?: string }
 *
 * Downloads the datapack zip file and uploads it to the server's world/datapacks/ directory.
 * Currently only supports Modrinth.
 */
export async function POST(request: NextRequest) {
  const authResult = await verifyAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await request.json();
    const { provider, downloadUrl, filename, versionId } = body;

    const userAgent = "MeowtopiaMinecraftDashboard/1.0.0 (catfanny13@gmail.com)";
    let targetUrl = downloadUrl;
    let targetFilename = filename || "datapack.zip";

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
      // Get filename from modrinth if provided, otherwise stick to what we have
      if (primaryFile.filename) {
          targetFilename = primaryFile.filename;
      }
    }

    if (!targetUrl) {
      return NextResponse.json({ error: "Download URL or project/version ID required" }, { status: 400 });
    }

    // 2. Fetch the datapack file from the remote repository
    const fileRes = await fetch(targetUrl, {
      headers: { "User-Agent": userAgent },
      cache: "no-store",
    });

    if (!fileRes.ok) {
      throw new Error(`Failed to fetch datapack file from remote: ${fileRes.status}`);
    }

    const bytes = await fileRes.arrayBuffer();

    // 3. Ensure the world/datapacks/ directory exists
    // We can't be sure it exists, so maybe we should make sure we're creating it.
    // However, PufferPanel's PUT /file/ creates parent directories automatically most of the time.
    // Let's rely on it or just upload directly.
    const destinationPath = `world/datapacks/${targetFilename}`;

    const res = await pufferFetch(`/file/${destinationPath}`, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: bytes,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Upload to PufferPanel failed: ${res.status} — ${text}`);
    }

    return NextResponse.json({ success: true, filename: targetFilename });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
