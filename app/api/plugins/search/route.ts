import { verifyAdmin } from "@/lib/authGuard";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/plugins/search
 * Query params:
 *   q: string         — search query (optional)
 *   category: string  — filter by category (optional)
 *   limit: string     — size limit per provider (optional, defaults to 15)
 *
 * Returns a unified, merged, and sorted array of plugins from Modrinth, Spiget, and Hangar.
 */
export async function GET(request: NextRequest) {
  const authResult = await verifyAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const limit = parseInt(searchParams.get("limit") || "15", 10);

    const userAgent = "MeowtopiaMinecraftDashboard/1.0.0 (catfanny13@gmail.com)";

    // Run all searches in parallel
    const [modrinthRes, spigetRes, hangarRes] = await Promise.allSettled([
      fetchModrinth(query, category, limit, userAgent),
      fetchSpiget(query, category, limit, userAgent),
      fetchHangar(query, category, limit, userAgent)
    ]);

    const results: any[] = [];

    if (modrinthRes.status === "fulfilled") {
      results.push(...modrinthRes.value);
    } else {
      console.error("Modrinth search failed:", modrinthRes.reason);
    }

    if (spigetRes.status === "fulfilled") {
      results.push(...spigetRes.value);
    } else {
      console.error("Spiget search failed:", spigetRes.reason);
    }

    if (hangarRes.status === "fulfilled") {
      results.push(...hangarRes.value);
    } else {
      console.error("Hangar search failed:", hangarRes.reason);
    }

    // Sort combined results by downloads descending
    results.sort((a, b) => b.downloads - a.downloads);

    return NextResponse.json(results);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function fetchModrinth(query: string, category: string, limit: number, userAgent: string) {
  const facets: string[][] = [
    ["categories:spigot", "categories:paper", "categories:purpur"],
    ["project_type:mod", "project_type:plugin"]
  ];

  if (category) {
    let modrinthCat = category;
    if (category === "admin") modrinthCat = "management";
    if (category === "world") modrinthCat = "world";
    facets.push([`categories:${modrinthCat}`]);
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

async function fetchSpiget(query: string, category: string, limit: number, userAgent: string) {
  let url = "";
  if (query) {
    url = `https://api.spiget.org/v2/search/resources/${encodeURIComponent(query)}?size=${limit}&fields=id,name,tagline,rating,downloads,file,testedVersions`;
  } else {
    url = `https://api.spiget.org/v2/resources/free?size=${limit}&sort=-downloads&fields=id,name,tagline,rating,downloads,file,testedVersions`;
  }

  const res = await fetch(url, {
    headers: { "User-Agent": userAgent },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Spiget API returned ${res.status}`);

  const data = await res.json();
  const items = Array.isArray(data) ? data : [];

  return items.map((item: any) => ({
    id: String(item.id),
    name: item.name,
    tagline: item.tagline || "No description available",
    downloads: item.downloads || 0,
    iconUrl: `https://api.spiget.org/v2/resources/${item.id}/icon/data`,
    latestVersion: "",
    provider: "spiget",
    downloadUrl: `https://api.spiget.org/v2/resources/${item.id}/download`,
    categories: [],
    versions: item.testedVersions || [],
  }));
}

async function fetchHangar(query: string, category: string, limit: number, userAgent: string) {
  const url = new URL("https://hangar.papermc.io/api/v1/projects");
  if (query) url.searchParams.set("q", query);
  url.searchParams.set("limit", limit.toString());

  if (category) {
    let hangarCat = category;
    if (category === "admin") hangarCat = "admin_tools";
    if (category === "world") hangarCat = "world_management";
    if (category === "utility") hangarCat = "dev_tools";
    url.searchParams.set("category", hangarCat);
  } else {
    url.searchParams.set("sort", "-downloads");
  }

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": userAgent },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Hangar API returned ${res.status}`);

  const data = await res.json();
  const items = data.result || [];

  return items.map((item: any) => ({
    id: `${item.namespace.owner}/${item.namespace.slug}`,
    name: item.name,
    tagline: item.description || "No description available",
    downloads: item.stats?.downloads || 0,
    iconUrl: item.avatarUrl || "/favicon.ico",
    latestVersion: item.promotedVersions?.[0]?.version || "",
    provider: "hangar",
    categories: item.category ? [item.category] : [],
    versions: item.supportedPlatforms?.PAPER || item.supportedPlatforms?.WATERFALL || item.supportedPlatforms?.VELOCITY || [],
  }));
}
