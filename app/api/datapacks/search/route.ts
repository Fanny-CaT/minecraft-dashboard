import { verifyAdmin } from "@/lib/authGuard";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/datapacks/search
 * Query params:
 *   q: string         — search query (optional)
 *   category: string  — filter by category (optional)
 *   limit: string     — size limit per provider (optional, defaults to 15)
 *
 * Returns an array of datapacks from Modrinth.
 */
export async function GET(request: NextRequest) {
  const authResult = await verifyAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const limit = parseInt(searchParams.get("limit") || "25", 10);

    const userAgent = "MeowtopiaMinecraftDashboard/1.0.0 (catfanny13@gmail.com)";

    const results = await fetchModrinthDatapacks(query, category, limit, userAgent);

    return NextResponse.json(results);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function fetchModrinthDatapacks(query: string, category: string, limit: number, userAgent: string) {
  const facets: string[][] = [
    ["project_type:datapack"]
  ];

  if (category) {
    facets.push([`categories:${category}`]);
  }

  const url = new URL("https://api.modrinth.com/v2/search");
  if (query) url.searchParams.set("query", query);
  url.searchParams.set("facets", JSON.stringify(facets));
  url.searchParams.set("limit", limit.toString());

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": userAgent },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Modrinth API returned ${res.status}`);

  const data = await res.json();
  const hits = data.hits || [];

  return hits.map((hit: any) => ({
    id: hit.project_id,
    name: hit.title,
    tagline: hit.description,
    downloads: hit.downloads || 0,
    iconUrl: hit.icon_url || "/favicon.ico",
    latestVersion: hit.latest_version,
    provider: "modrinth",
    categories: hit.categories || [],
    versions: hit.versions || [],
  }));
}
