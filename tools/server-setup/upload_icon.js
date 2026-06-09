require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const ROOT = process.env.PUFFER_URL;
const ID = process.env.PUFFER_SERVER_ID;
const CID = process.env.PUFFER_CLIENT_ID;
const CSEC = process.env.PUFFER_CLIENT_SECRET;

async function getToken() {
  const res = await fetch(`${ROOT}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: CID, client_secret: CSEC, scope: "server.files server.console" }).toString(),
  });
  const data = await res.json();
  return data.access_token;
}

async function uploadFile(token, path, buffer) {
  const res = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body: buffer
  });
  if (!res.ok) throw new Error(`Failed to upload ${path}: ${res.status}`);
  console.log(`✅ Uploaded ${path}`);
}

async function main() {
  const token = await getToken();
  try {
    const buffer = fs.readFileSync("tools/server-setup/server-icon.png");
    await uploadFile(token, "server-icon.png", buffer);
  } catch(e) { console.error("Upload error:", e.message); }
}
main();
