import { verifyAdmin } from "@/lib/authGuard";
import { NextRequest, NextResponse } from "next/server";
import Client from "ssh2-sftp-client";
import { getSftpUsername } from "@/lib/pufferpanel";
import { sanitizePath } from "@/lib/pathUtils";

export async function POST(request: NextRequest) {
  const authResult = await verifyAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const { action, source, target } = await request.json();
    
    if (action !== "rename" && action !== "move") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const sftp = new Client();
    const username = await getSftpUsername();
    const password = process.env.SFTP_PASSWORD;
    const host = process.env.PUFFER_URL ? new URL(process.env.PUFFER_URL).hostname : "meowtopia-panel.duckdns.org";

    if (!password) throw new Error("SFTP_PASSWORD not configured in .env");

    await sftp.connect({
      host,
      port: 5657,
      username,
      password,
      readyTimeout: 10000,
    });

    const safeSource = sanitizePath(source, false);
    const safeTarget = sanitizePath(target, false);

    if (!safeSource || !safeTarget) {
       await sftp.end();
       return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const sftpSource = "/" + safeSource;
    const sftpTarget = "/" + safeTarget;

    try {
      await sftp.rename(sftpSource, sftpTarget);
    } catch (err: any) {
      await sftp.end();
      return NextResponse.json({ error: "SFTP rename failed: " + err.message }, { status: 500 });
    }

    await sftp.end();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
