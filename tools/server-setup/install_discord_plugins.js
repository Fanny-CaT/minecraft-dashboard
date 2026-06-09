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

async function installModrinthPlugin(slug, token) {
  console.log(`Fetching latest version for ${slug}...`);
  const res = await fetch(`https://api.modrinth.com/v2/project/${slug}/version?loaders=["paper"]&game_versions=["1.21.1"]`);
  const versions = await res.json();
  
  if (!versions || versions.length === 0) {
      // try without game version filter
      const res2 = await fetch(`https://api.modrinth.com/v2/project/${slug}/version?loaders=["paper"]`);
      const v2 = await res2.json();
      if (!v2 || v2.length === 0) {
          console.error(`Could not find a paper version for ${slug}`);
          return;
      }
      var file = v2[0].files.find(f => f.primary) || v2[0].files[0];
  } else {
      var file = versions[0].files.find(f => f.primary) || versions[0].files[0];
  }
  
  const downloadUrl = file.url;
  const filename = file.filename;
  
  console.log(`Downloading ${filename} from ${downloadUrl}...`);
  const dRes = await fetch(downloadUrl);
  const buffer = Buffer.from(await dRes.arrayBuffer());
  
  console.log(`Uploading ${filename} to PufferPanel...`);
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/${filename}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body: buffer
  });
  console.log(`✅ Uploaded ${filename}`);
}

async function main() {
  const token = await getToken();
  
  console.log("Stopping server to install Discord plugins...");
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/kill`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
  await new Promise(r => setTimeout(r, 2000));
  
  await installModrinthPlugin('discordsrv', token);
  await installModrinthPlugin('simple-voice-chat', token);
  await installModrinthPlugin('simple-voice-chat-discord-bridge', token);
  
  console.log("Starting server to generate configs...");
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/start`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
  console.log("Started! Wait ~3 minutes for it to boot and generate configs.");
}

main().catch(console.error);
