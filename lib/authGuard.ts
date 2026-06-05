import { NextRequest, NextResponse } from "next/server";

export async function verifyAdmin(request: NextRequest): Promise<{ uid: string } | NextResponse> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing or invalid Authorization header. Please login." }, { status: 401 });
  }

  const token = authHeader.split("Bearer ")[1];
  const apiKey = "AIzaSyBjdtr-yPqd8IiGGYnkaFXdTxcHcSuBo98";

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

    // Explicitly enforce the admin ID for all backend API actions
    if (uid !== "AGGukM4aXuYsURCTX5eA2SAtwVF3") {
      return NextResponse.json({ error: "Forbidden: You are not authorized to perform this action." }, { status: 403 });
    }

    return { uid };
  } catch (e) {
    return NextResponse.json({ error: "Internal Auth Error" }, { status: 500 });
  }
}
