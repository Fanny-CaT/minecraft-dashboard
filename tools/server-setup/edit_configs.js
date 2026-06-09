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

async function getFile(token, path) {
  const res = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Failed to get ${path}: ${res.status}`);
  return await res.text();
}

async function uploadFile(token, path, content) {
  const res = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body: Buffer.from(content)
  });
  if (!res.ok) throw new Error(`Failed to upload ${path}: ${res.status}`);
  console.log(`✅ Updated ${path}`);
}

async function main() {
  const token = await getToken();

  // 1. GriefPrevention
  try {
    let gpConfig = await getFile(token, "plugins/GriefPreventionData/config.yml");
    gpConfig = gpConfig.replace(/PunishLogout: true/g, 'PunishLogout: false');
    gpConfig = gpConfig.replace(/CombatTimeoutSeconds: 15/g, 'CombatTimeoutSeconds: 0');
    gpConfig = gpConfig.replace(/CombatTimeoutSeconds: \d+/g, 'CombatTimeoutSeconds: 0');
    await uploadFile(token, "plugins/GriefPreventionData/config.yml", gpConfig);
  } catch(e) { console.error("GP config error:", e.message); }

  console.log("Restarting server to apply configs...");
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/kill`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
  await new Promise(r => setTimeout(r, 2000));
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/start`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
  
  console.log("Done!");
}
main();
