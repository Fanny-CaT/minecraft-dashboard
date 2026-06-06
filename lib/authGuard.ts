import { NextRequest, NextResponse } from "next/server";

// Memory cache to prevent O(N) database reads on high-frequency polling endpoints.
// Persists per Vercel container instance.
const roleCache = new Map<string, { role: string, expires: number }>();
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

export async function verifyAdmin(request: NextRequest): Promise<{ uid: string } | NextResponse> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing or invalid Authorization header." }, { status: 401 });
  }

  const token = authHeader.split("Bearer ")[1];
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "meowtopia-panel-9812";

  if (!projectId) {
    return NextResponse.json({ error: "Server misconfiguration: Missing Project ID" }, { status: 500 });
  }

  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Invalid or expired session token" }, { status: 401 });
    }

    const data = await res.json();
    const uid = data.users?.[0]?.localId;

    if (!uid) {
      return NextResponse.json({ error: "No user found for token" }, { status: 401 });
    }

    // Cache hit? Return immediately to save DB I/O.
    const now = Date.now();
    const cached = roleCache.get(uid);
    if (cached && cached.expires > now) {
      if (cached.role !== "admin") {
        return NextResponse.json({ error: "Forbidden: You are not authorized." }, { status: 403 });
      }
      return { uid };
    }

    // Cache miss. Fetch from Firestore without hardcoded project names.
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
    const fsRes = await fetch(firestoreUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!fsRes.ok) {
      return NextResponse.json({ error: "Could not verify user role." }, { status: 403 });
    }

    const fsData = await fsRes.json();
    const role = fsData.fields?.role?.stringValue || "pending";

    // Write back to cache
    roleCache.set(uid, { role, expires: now + CACHE_TTL_MS });

    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden: You are not authorized to perform this action." }, { status: 403 });
    }

    return { uid };
  } catch (e) {
    return NextResponse.json({ error: "Internal Auth Error" }, { status: 500 });
  }
}
