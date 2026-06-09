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
  const res = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`🗑️ Deleted ${path}`);
}

async function getModrinthDownload(slug) {
  const res = await fetch(`https://api.modrinth.com/v2/project/${slug}/version`);
  const versions = await res.json();
  // Find a version that explicitly has a paper or spigot jar, or simply isn't fabric/velocity
  const stable = versions.find(v => v.version_type === 'release');
  if (!stable) throw new Error(`No stable release found for ${slug}`);
  
  // Find the file that doesn't say fabric, bungee, sponge, or velocity
  const file = stable.files.find(f => {
    const name = f.filename.toLowerCase();
    return !name.includes('fabric') && !name.includes('velocity') && !name.includes('bungee') && !name.includes('sponge');
  }) || stable.files[0];
  
  return { url: file.url, name: file.filename };
}

async function main() {
  const token = await getToken();
  try {
    // Delete the wrong fabric jar
    await deleteFile(token, "plugins/skinrestorer-2.8.0+26.1-fabric.jar").catch(()=>console.log("no old file to delete"));

    console.log(`Fetching SkinRestorer...`);
    const { url, name } = await getModrinthDownload('skinrestorer');
    console.log(`Downloading ${name} from ${url}...`);
    
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`Uploading ${name} to server...`);
    await uploadFile(token, `plugins/${name}`, buffer);

    console.log("SkinRestorer deployed. Restarting server...");
    await fetch(`${ROOT}/proxy/daemon/server/${ID}/kill`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
    await new Promise(r => setTimeout(r, 2000));
    await fetch(`${ROOT}/proxy/daemon/server/${ID}/start`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
    console.log("Done!");
  } catch(e) {
    console.error(`Failed to install SkinRestorer:`, e.message);
  }
}

main();
