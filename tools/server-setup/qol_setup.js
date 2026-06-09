const fs = require('fs');
const https = require('https');
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

async function uploadFile(token, path, buffer) {
  const res = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body: buffer
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
  if (!res.ok) throw new Error(`Failed to send command ${cmd}: ${res.status}`);
  console.log(`✅ Executed: /${cmd}`);
}

async function getModrinth(project) {
  const res = await fetch(`https://api.modrinth.com/v2/project/${project}/version?game_versions=[%221.21.1%22]&loaders=[%22paper%22]`, {
    headers: { 'User-Agent': 'Node.js' }
  });
  const data = await res.json();
  if (data.length > 0) {
    const file_url = data[0].files[0].url;
    const filename = data[0].files[0].filename;
    console.log(`Downloading ${filename}...`);
    const fileRes = await fetch(file_url);
    const buffer = Buffer.from(await fileRes.arrayBuffer());
    return { filename, buffer };
  }
  return null;
}

async function main() {
  const token = await getToken();
  
  try {
    // 1. Upload Icon
    const iconBuf = fs.readFileSync('server-icon.png');
    await uploadFile(token, 'server-icon.png', iconBuf);
    
    // 2. Download Plugins
    const plugins = ['veinminer', 'fast-leaf-decay', 'gsit'];
    for (const p of plugins) {
      const data = await getModrinth(p);
      if (data) {
        await uploadFile(token, `plugins/${data.filename}`, data.buffer);
      }
    }
    
    // 3. Send QoL Commands
    await sendCommand(token, "gamerule playersSleepingPercentage 1");
    await sendCommand(token, "lp group default permission set pvpmanager.pvpstatus.change true");
    await sendCommand(token, "lp group default permission set gsit.sit true");
    await sendCommand(token, "lp group default permission set gsit.lay true");
    
    // Enchants for veinminer: VeinMiner usually has an enchant option in config.
    // We will mention that it needs a restart.
    
    console.log("Done! Restarting server to apply plugins and icon...");
    await fetch(`${ROOT}/proxy/daemon/server/${ID}/kill`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
    await new Promise(r => setTimeout(r, 2000));
    await fetch(`${ROOT}/proxy/daemon/server/${ID}/start`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
    console.log("Server starting!");
    
  } catch(e) {
    console.error(`Error:`, e);
  }
}

main();
