const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

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
  if (!res.ok) throw new Error(`Failed to download ${path}: ${res.status}`);
  return await res.text();
}

async function uploadFile(token, path, text) {
  const res = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain' },
    body: text
  });
  if (!res.ok) throw new Error(`Failed to upload ${path}: ${res.status}`);
  console.log(`✅ Uploaded ${path}`);
}

async function sendCommand(token, cmd) {
  const res = await fetch(`${ROOT}/proxy/daemon/server/${ID}/console`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain' },
    body: cmd
  });
  if (!res.ok) throw new Error(`Failed to send cmd: ${res.status}`);
  console.log(`✅ Executed: /${cmd}`);
}

async function main() {
  const token = await getToken();
  try {
    let config = await getFile(token, 'plugins/Essentials/config.yml');
    
    // Replace teleport-delay: 0 with teleport-delay: 3
    config = config.replace(/^teleport-delay:.*$/m, 'teleport-delay: 3');
    
    // Replace teleport-cooldown: 0 with teleport-cooldown: 5
    config = config.replace(/^teleport-cooldown:.*$/m, 'teleport-cooldown: 5');
    
    // Replace heal-cooldown: 60 with heal-cooldown: 60
    config = config.replace(/^heal-cooldown:.*$/m, 'heal-cooldown: 60');

    await uploadFile(token, 'plugins/Essentials/config.yml', config);
    
    // Reload essentials
    await sendCommand(token, 'ess reload');
    console.log("Essentials reloaded with new cooldowns!");
  } catch (e) {
    console.error(e.message);
  }
}
main();
