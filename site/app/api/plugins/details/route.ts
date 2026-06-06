import { verifyAdmin } from "@/lib/authGuard";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/plugins/details
 * Query params:
 *   provider: string  — modrinth, spiget, or hangar
 *   id: string        — project ID or namespace/slug
 */
export async function GET(request: NextRequest) {
  const authResult = await verifyAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") || "";
    const id = searchParams.get("id") || "";

    if (!provider || !id) {
      return NextResponse.json({ error: "Missing provider or id parameter" }, { status: 400 });
    }

    const userAgent = "MeowtopiaMinecraftDashboard/1.0.0 (catfanny13@gmail.com)";
    let data: any = {};

    if (provider === "modrinth") {
      const res = await fetch(`https://api.modrinth.com/v2/project/${id}`, {
        headers: { "User-Agent": userAgent },
        cache: "no-store"
      });
      if (res.ok) {
        const raw = await res.json();
        data = {
          description: raw.body || raw.description,
          wikiUrl: raw.wiki_url,
          sourceUrl: raw.source_url,
          issuesUrl: raw.issues_url,
          discordUrl: raw.discord_url,
          donationUrls: raw.donation_urls,
          published: raw.published,
          updated: raw.updated,
          author: raw.members?.[0]?.user?.username || raw.owner || "Unknown"
        };
      } else {
        throw new Error(`Modrinth API returned ${res.status}`);
      }
    } else if (provider === "spiget") {
      const res = await fetch(`https://api.spiget.org/v2/resources/${id}`, {
        headers: { "User-Agent": userAgent },
        cache: "no-store"
      });
      if (res.ok) {
        const raw = await res.json();
        
        let authorName = "Unknown";
        if (raw.author?.id) {
          try {
            const authorRes = await fetch(`https://api.spiget.org/v2/authors/${raw.author.id}`, {
              headers: { "User-Agent": userAgent },
              cache: "no-store"
            });
            if (authorRes.ok) {
              const authorData = await authorRes.json();
              authorName = authorData.name || authorName;
            }
          } catch (e) {
            // author fetch failed, non-fatal
          }
        }

        // spiget description is base64 encoded sometimes
        let desc = raw.description || raw.tagline || "No description available.";
        if (desc && !desc.includes(" ") && desc.length > 20 && /^[a-zA-Z0-9+/=]+$/.test(desc)) {
          try {
            desc = Buffer.from(desc, "base64").toString("utf-8");
          } catch (e) {
            // decode failed
          }
        }

        data = {
          description: desc,
          sourceUrl: raw.sourceCodeLink,
          donationUrl: raw.donationLink,
          rating: raw.rating?.average || 0,
          reviewsCount: raw.rating?.count || 0,
          author: authorName,
          version: raw.version?.name || ""
        };
      } else {
        throw new Error(`Spiget API returned ${res.status}`);
      }
    } else if (provider === "hangar") {
      const parts = id.split("/");
      if (parts.length !== 2) {
        return NextResponse.json({ error: "Invalid projectId format for Hangar. Expected owner/slug" }, { status: 400 });
      }
      const [owner, slug] = parts;
      const res = await fetch(`https://hangar.papermc.io/api/v1/projects/${owner}/${slug}`, {
        headers: { "User-Agent": userAgent },
        cache: "no-store"
      });
      if (res.ok) {
        const raw = await res.json();
        data = {
          description: raw.description || "No description available.",
          wikiUrl: raw.settings?.wikiUrl,
          sourceUrl: raw.settings?.sourceUrl,
          issuesUrl: raw.settings?.issuesUrl,
          discordUrl: raw.settings?.discordUrl,
          donationUrls: raw.settings?.donationPoints,
          author: raw.namespace?.owner || "Unknown",
          stats: raw.stats
        };
      } else {
        throw new Error(`Hangar API returned ${res.status}`);
      }
    } else {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
