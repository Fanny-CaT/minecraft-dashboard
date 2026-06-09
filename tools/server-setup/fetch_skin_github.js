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

async function deleteFile(token, path) {
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
}

async function main() {
  const token = await getToken();
  try {
    await deleteFile(token, "plugins/skinrestorer-2.8.0+26.1-fabric.jar").catch(()=>0);
    await deleteFile(token, "plugins/SkinRestorer.jar").catch(()=>0);
    await deleteFile(token, "plugins/SkinsRestorer-Mod-Fabric-15.12.2.jar").catch(()=>0);

    console.log(`Fetching SkinsRestorer from GitHub...`);
    const resAPI = await fetch('https://api.github.com/repos/SkinsRestorer/SkinsRestorer/releases/latest', {
      headers: { 'User-Agent': 'Node.js' }
    });
    const release = await resAPI.json();
    
    // Find exactly "SkinsRestorer.jar"
    const asset = release.assets.find(a => a.name === 'SkinsRestorer.jar');
    if(!asset) throw new Error("No exact SkinsRestorer.jar found! Assets: " + release.assets.map(a=>a.name).join(', '));

    console.log(`Downloading ${asset.name} from ${asset.browser_download_url}...`);
    
    const res = await fetch(asset.browser_download_url);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`Uploading ${asset.name} to server...`);
    await uploadFile(token, `plugins/${asset.name}`, buffer);

    console.log("SkinsRestorer deployed. Restarting server...");
    await fetch(`${ROOT}/proxy/daemon/server/${ID}/kill`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
    await new Promise(r => setTimeout(r, 2000));
    await fetch(`${ROOT}/proxy/daemon/server/${ID}/start`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
    console.log("Done!");
  } catch(e) {
    console.error(`Failed to install SkinsRestorer:`, e.message);
  }
}

main();
