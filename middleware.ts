import { NextRequest, NextResponse } from "next/server";

/**
 * Rate limiting middleware for all /api/* routes.
 * Uses an in-memory sliding-window counter per IP per route prefix.
 * Note: resets per serverless cold-start on Vercel — suitable for basic abuse prevention.
 */

interface RateEntry {
  count: number;
  resetAt: number;
}

const rateMap = new Map<string, RateEntry>();
const WINDOW_MS = 60_000; // 1-minute window

// Per-route limits (requests per minute per IP)
const LIMITS: [string, number][] = [
  ["/api/power",   5],    // power actions are destructive
  ["/api/console", 30],   // console commands
  ["/api/players", 30],
  ["/api/backups", 20],
  ["/api/files",   120],  // file browser needs headroom
  ["/api/status",  60],
  ["/api/",        120],  // catch-all for any other api route
];

function getLimit(pathname: string): number {
  for (const [prefix, limit] of LIMITS) {
    if (pathname.startsWith(prefix)) return limit;
  }
  return 120;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/api/")) return NextResponse.next();

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anon";

  const key = `${ip}:${pathname}`;
  const limit = getLimit(pathname);
  const now = Date.now();

  let entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + WINDOW_MS };
    rateMap.set(key, entry);
  } else {
    entry.count++;
  }

  const remaining = Math.max(0, limit - entry.count);
  const headers = {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(entry.resetAt),
  };

  if (entry.count > limit) {
    return new NextResponse(
      JSON.stringify({ error: "Rate limit exceeded. Please slow down." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)),
          ...headers,
        },
      }
    );
  }

  const res = NextResponse.next();
  Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
