require('dotenv').config({ path: '../../.env.local' });
const fs = require('fs');
const path = require('path');

const ROOT = process.env.PUFFER_URL;
const ID = process.env.PUFFER_SERVER_ID;
const CID = process.env.PUFFER_CLIENT_ID;
const CSEC = process.env.PUFFER_CLIENT_SECRET;

async function getToken() {
  const res = await fetch(`${ROOT}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CID,
      client_secret: CSEC,
      scope: "server.files",
    }).toString(),
  });
  const data = await res.json();
  return data.access_token;
}

async function uploadFile(token, localPath, remotePath) {
  console.log(`Uploading ${localPath} -> ${remotePath}`);
  const content = fs.readFileSync(localPath);
  const res = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/${remotePath}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream'
    },
    body: content
  });
  if (!res.ok) throw new Error(`Failed to upload ${remotePath}: ${res.status}`);
  console.log(`✅ Uploaded ${remotePath}`);
}

async function main() {
  const token = await getToken();
  
  // Upload config files
  const configs = fs.readdirSync(path.join(__dirname, 'config'));
  for (const c of configs) {
    await uploadFile(token, path.join(__dirname, 'config', c), c);
  }

  // Upload plugins
  const plugins = fs.readdirSync(path.join(__dirname, 'plugins'));
  // First ensure plugins folder exists
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins?folder=true`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });

  for (const p of plugins) {
    if (p.endsWith('.jar')) {
      await uploadFile(token, path.join(__dirname, 'plugins', p), `plugins/${p}`);
    }
  }
  console.log("Done!");
}
main();
