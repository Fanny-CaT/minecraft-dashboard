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
  return (await res.json()).access_token;
}

async function uploadFile(token, path, buffer) {
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body: buffer
  });
  console.log(`✅ Uploaded ${path}`);
}

async function main() {
  const token = await getToken();
  try {
    const file_url = "https://github.com/MilkBowl/Vault/releases/download/1.7.3/Vault.jar";
    console.log(`Downloading Vault...`);
    const fileRes = await fetch(file_url);
    const buffer = Buffer.from(await fileRes.arrayBuffer());
    await uploadFile(token, `plugins/Vault.jar`, buffer);

    console.log("Restarting server...");
    await fetch(`${ROOT}/proxy/daemon/server/${ID}/console`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: "save-all\n"
    });
    await new Promise(r => setTimeout(r, 2000));
    await fetch(`${ROOT}/proxy/daemon/server/${ID}/console`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: "stop\n"
    });
    console.log("Server stopping gracefully! Wait 20 seconds, then use PufferPanel to start it, or I will start it via API.");
    await new Promise(r => setTimeout(r, 15000));
    await fetch(`${ROOT}/proxy/daemon/server/${ID}/start`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
    console.log("Server starting!");
  } catch(e) {
    console.error(e);
  }
}
main();
