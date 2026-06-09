require('dotenv').config({ path: '.env.local' });
const ROOT = process.env.PUFFER_URL;
const ID = process.env.PUFFER_SERVER_ID;
const CID = process.env.PUFFER_CLIENT_ID;
const CSEC = process.env.PUFFER_CLIENT_SECRET;

const plugins = {
  "LuckPerms.jar": "https://download.luckperms.net/1643/bukkit/loader/LuckPerms-Bukkit-5.5.55.jar",
  "CoreProtect.jar": "https://cdn.modrinth.com/data/Lu3KuzdV/versions/6W2ad1iI/CoreProtect-CE-23.2.jar",
  "GriefPrevention.jar": "https://cdn.modrinth.com/data/O4o4mKaq/versions/dGfCZHqk/GriefPrevention.jar",
  "TAB.jar": "https://github.com/NEZNAMY/TAB/releases/download/4.1.8/TAB-v4.1.8.jar",
  "GrimAC.jar": "https://github.com/GrimAnticheat/Grim/releases/download/2.3.70/grimac-2.3.70.jar"
};

async function getToken() {
  const res = await fetch(`${ROOT}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: CID, client_secret: CSEC, scope: "server.files server.console" }).toString(),
  });
  const data = await res.json();
  return data.access_token;
}

async function uploadFile(token, fileName, buffer) {
  console.log(`Uploading plugins/${fileName}... (${buffer.byteLength} bytes)`);
  const res = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/${fileName}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body: buffer
  });
  if (!res.ok) throw new Error(`Failed to upload ${fileName}: ${res.status}`);
  console.log(`✅ Uploaded ${fileName}`);
}

async function main() {
  const token = await getToken();

  for (const [fileName, url] of Object.entries(plugins)) {
    try {
      console.log(`Downloading ${fileName} from ${url}...`);
      const dlRes = await fetch(url);
      if (!dlRes.ok) throw new Error(`Download failed: ${dlRes.status}`);
      const arrayBuf = await dlRes.arrayBuffer();
      await uploadFile(token, fileName, Buffer.from(arrayBuf));
    } catch (err) {
      console.error(`❌ Failed on ${fileName}: ${err.message}`);
    }
  }
  
  console.log("Restarting server to load plugins...");
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/kill`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
  await new Promise(r => setTimeout(r, 3000));
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/start`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
  
  console.log("Done!");
}
main();
