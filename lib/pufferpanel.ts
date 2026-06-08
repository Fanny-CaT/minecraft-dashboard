/**
 * lib/pufferpanel.ts
 * Shared server-side helpers for all PufferPanel API calls.
 * Import this in any app/api/* route handler.
 *
 * Verified endpoint map (tested 2026-06-03):
 *   Token:   POST  {ROOT}/oauth2/token
 *   Status:  GET   {ROOT}/proxy/daemon/server/{ID}/status   → {running:bool}
 *   Stats:   GET   {ROOT}/proxy/daemon/server/{ID}/stats    → {cpu,memory}
 *   Power:   POST  {ROOT}/proxy/daemon/server/{ID}/{start|stop|restart|kill}
 *   Console: POST  {ROOT}/proxy/daemon/server/{ID}/console  (body: plain text cmd)
 *   Files:   GET   {ROOT}/proxy/daemon/server/{ID}/file/{path}
 *            PUT   {ROOT}/proxy/daemon/server/{ID}/file/{path}  (body: file content)
 *            PUT   {ROOT}/proxy/daemon/server/{ID}/file/{path}?folder=true
 *            DELETE {ROOT}/proxy/daemon/server/{ID}/file/{path}
 */

import zlib from "zlib";

const ROOT   = (process.env.PUFFER_URL        || "").replace(/\/$/, "");
const ID     = process.env.PUFFER_SERVER_ID   || "";
const CID    = process.env.PUFFER_CLIENT_ID   || "";
const CSEC   = process.env.PUFFER_CLIENT_SECRET || "";

if (!ROOT || !ID || !CID || !CSEC) {
  console.warn("[pufferpanel] Missing env vars — check PUFFER_URL / SERVER_ID / CLIENT_ID / CLIENT_SECRET");
}

// ── Token cache (server-side, in-process) ─────────────────────────────────────
let _cachedToken = "";
let _tokenExpiry = 0;

export async function getToken(): Promise<string> {
  if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken;

  const res = await fetch(`${ROOT}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "client_credentials",
      client_id:     CID,
      client_secret: CSEC,
      scope:         "server.view server.console server.power server.files",
    }).toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth2 token failed: ${res.status} — ${text}`);
  }

  const data = await res.json();
  if (!data.access_token) throw new Error("No access_token in response");

  // Cache for 55 minutes (tokens expire in 60 min)
  _cachedToken = data.access_token as string;
  _tokenExpiry = Date.now() + 55 * 60 * 1000;
  return _cachedToken;
}

// ── Daemon base URL ──────────────────────────────────────────────────────────
export const daemon = () => `${ROOT}/proxy/daemon/server/${ID}`;

// ── Generic authenticated fetch ───────────────────────────────────────────────
export async function pufferFetch(
  path: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> {
  const token = await getToken();
  return fetch(`${daemon()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
}

// ── Convenience helpers ───────────────────────────────────────────────────────

export async function getServerDetails(): Promise<any> {
  const res = await pufferFetch("");
  if (!res.ok) throw new Error(`Failed to fetch server details: ${res.status}`);
  return res.json();
}

export async function getSftpUsername(): Promise<string> {
  try {
    const token = await getToken();
    const res = await fetch(`${ROOT}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const users = data?.users || [];
      const mainUser = users.find((u: any) => u.username !== "apiuser") || users[0];
      if (mainUser?.username) {
        return `${mainUser.username}-${ID}`;
      }
    }
  } catch (err) {
    console.warn("[pufferpanel] Failed to fetch users for SFTP username:", err);
  }
  return `agreeable_guy-${ID}`; // fallback
}

export async function getPanelServerInfo(): Promise<any> {
  const token = await getToken();
  const res = await fetch(`${ROOT}/api/servers/${ID}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch panel server info: ${res.status}`);
  return res.json();
}


let _cachedMaxMemory = 12 * 1024 * 1024 * 1024; // fallback 12 GB

let _maxMemoryExpiry = 0;

export async function getMaxMemoryBytes(): Promise<number> {
  if (_cachedMaxMemory && Date.now() < _maxMemoryExpiry) return _cachedMaxMemory;
  try {
    const res = await pufferFetch("");
    if (res.ok) {
      const info = await res.json();
      const mb = info?.data?.memory?.value;
      if (mb && typeof mb === "number") {
        _cachedMaxMemory = mb * 1024 * 1024;
        _maxMemoryExpiry = Date.now() + 60 * 60 * 1000; // cache 1 hour
      }
    }
  } catch (err) {
    console.warn("[pufferpanel] Failed to fetch max memory definition:", err);
  }
  return _cachedMaxMemory;
}

export async function getStatus(): Promise<{ running: boolean }> {
  const res = await pufferFetch("/status");
  if (!res.ok) throw new Error(`Status fetch failed: ${res.status}`);
  return res.json();
}

export async function getStats(): Promise<{ cpu: number; memory: number }> {
  const res = await pufferFetch("/stats");
  if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
  return res.json();
}
export async function powerAction(action: "start" | "stop" | "restart" | "kill"): Promise<void> {
  if (action === "restart") {
    let isRunning = false;
    try {
      const statusRes = await getStatus();
      isRunning = statusRes.running;
    } catch (err) {
      console.warn("[pufferpanel] Failed to check status before restart, assuming running:", err);
      isRunning = true;
    }

    if (isRunning) {
      const stopRes = await pufferFetch("/stop", { method: "POST" });
      if (!stopRes.ok) {
        const text = await stopRes.text();
        console.warn(`[pufferpanel] Stop failed during restart (status ${stopRes.status}): ${text}. Attempting to start anyway.`);
      }
      // Wait 2.5 seconds for the JVM process to terminate
      await new Promise(resolve => setTimeout(resolve, 2500));
    }

    const startRes = await pufferFetch("/start", { method: "POST" });
    if (!startRes.ok) {
      const text = await startRes.text();
      throw new Error(`Start failed during restart: ${startRes.status} — ${text}`);
    }
    return;
  }

  const res = await pufferFetch(`/${action}`, { method: "POST" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Power/${action} failed: ${res.status} — ${text}`);
  }
}

export async function sendConsoleCommand(command: string): Promise<void> {
  const res = await pufferFetch("/console", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: command,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Console command failed: ${res.status} — ${text}`);
  }
}

export async function listFiles(path = ""): Promise<unknown[]> {
  const clean = path.replace(/^\//, "");
  const res = await pufferFetch(`/file/${clean}`);
  if (!res.ok) throw new Error(`File list failed: ${res.status}`);
  return res.json();
}

export async function readFile(path: string, unzip = false): Promise<string> {
  const clean = path.replace(/^\//, "");
  const res = await pufferFetch(`/file/${clean}`);
  if (!res.ok) throw new Error(`File read failed: ${res.status}`);
  if (unzip) {
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return zlib.gunzipSync(buffer).toString("utf-8");
  }
  return res.text();
}

export async function writeFile(path: string, content: string | Buffer | Blob): Promise<void> {
  const clean = path.replace(/^\//, "");
  const isString = typeof content === "string";
  const res = await pufferFetch(`/file/${clean}`, {
    method: "PUT",
    headers: isString ? { "Content-Type": "text/plain" } : { "Content-Type": "application/octet-stream" },
    body: content,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`File write failed: ${res.status} — ${text}`);
  }
}

export async function createFolder(path: string): Promise<void> {
  const clean = path.replace(/^\//, "");
  const res = await pufferFetch(`/file/${clean}?folder=true`, { method: "PUT" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create folder failed: ${res.status} — ${text}`);
  }
}

export async function deleteFile(path: string): Promise<void> {
  const clean = path.replace(/^\//, "");
  const res = await pufferFetch(`/file/${clean}`, { method: "DELETE" });
  if (!res.ok) {
    const text = await res.text();
    
    // Check for the known PufferPanel daemon bug where it fails to delete files
    // because it unconditionally calls ReadDir (which throws "readdirent... not a directory")
    if (res.status === 500 && text.includes("readdirent") && text.includes("not a directory")) {
      console.warn(`[pufferpanel] Caught known daemon delete bug for ${path}. Falling back to 0-byte truncate.`);
      // Truncate the file to 0 bytes to "soft delete" it since actual deletion fails
      const truncateRes = await pufferFetch(`/file/${clean}`, { 
        method: "PUT", 
        headers: { "Content-Type": "text/plain" },
        body: "" 
      });
      if (!truncateRes.ok) {
        throw new Error(`Delete (fallback truncate) failed: ${truncateRes.status} — ${await truncateRes.text()}`);
      }
      return;
    }

    throw new Error(`Delete failed: ${res.status} — ${text}`);
  }
}

// ── server.properties parser ──────────────────────────────────────────────────

export function parseServerProperties(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    result[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1);
  }
  return result;
}

export function serializeServerProperties(props: Record<string, string>, original: string): string {
  // Preserve comments from the original, update values in-place
  const lines = original.split("\n");
  const updated = new Set<string>();
  const result = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;
    const eq = trimmed.indexOf("=");
    if (eq === -1) return line;
    const key = trimmed.slice(0, eq).trim();
    if (key in props) {
      updated.add(key);
      return `${key}=${props[key]}`;
    }
    return line;
  });
  // Append any new keys not in the original
  for (const [k, v] of Object.entries(props)) {
    if (!updated.has(k)) result.push(`${k}=${v}`);
  }
  return result.join("\n");
}
