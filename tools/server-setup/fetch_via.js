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

async function getModrinthDownload(slug) {
  const res = await fetch(`https://api.modrinth.com/v2/project/${slug}/version`);
  const versions = await res.json();
  // Find the latest stable version
  const stable = versions.find(v => v.version_type === 'release');
  if (!stable) throw new Error(`No stable release found for ${slug}`);
  const file = stable.files.find(f => f.primary) || stable.files[0];
  return { url: file.url, name: file.filename };
}

async function main() {
  const token = await getToken();
  const plugins = ['viaversion', 'viabackwards', 'viarewind'];
  
  for (const slug of plugins) {
    try {
      console.log(`Fetching ${slug}...`);
      const { url, name } = await getModrinthDownload(slug);
      console.log(`Downloading ${name} from ${url}...`);
      
      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      console.log(`Uploading ${name} to server...`);
      await uploadFile(token, `plugins/${name}`, buffer);
    } catch(e) {
      console.error(`Failed to install ${slug}:`, e.message);
    }
  }

  console.log("Restarting server...");
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/kill`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
  await new Promise(r => setTimeout(r, 2000));
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/start`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
  console.log("Done!");
}

main();
