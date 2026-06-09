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

async function deleteFile(token, path) {
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`🗑 Deleted ${path}`);
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
    // Delete the previous standalone VeinMiner to prevent conflicts
    await deleteFile(token, "plugins/veinminer-paper-2.10.1+1.21.1.jar").catch(()=>0);
    
    // Download and upload ExcellentEnchants & NightCore
    const plugins = ['excellentenchants', 'nightcore'];
    for (const p of plugins) {
      const data = await getModrinth(p);
      if (data) {
        await uploadFile(token, `plugins/${data.filename}`, data.buffer);
      } else {
        console.log(`Failed to find ${p} on Modrinth for 1.21.1`);
      }
    }

    console.log("Restarting server...");
    await fetch(`${ROOT}/proxy/daemon/server/${ID}/kill`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
    await new Promise(r => setTimeout(r, 2000));
    await fetch(`${ROOT}/proxy/daemon/server/${ID}/start`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
    console.log("Server starting!");
  } catch(e) {
    console.error(e);
  }
}
main();
