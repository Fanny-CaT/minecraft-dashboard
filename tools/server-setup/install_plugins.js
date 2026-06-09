require('dotenv').config({ path: '.env.local' });
const ROOT = process.env.PUFFER_URL;
const ID = process.env.PUFFER_SERVER_ID;
const CID = process.env.PUFFER_CLIENT_ID;
const CSEC = process.env.PUFFER_CLIENT_SECRET;

const plugins = {
  "Geyser.jar": "https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/spigot",
  "Floodgate.jar": "https://download.geysermc.org/v2/projects/floodgate/versions/latest/builds/latest/downloads/spigot",
  "LuckPerms.jar": "https://download.luckperms.net/1557/bukkit/loader/LuckPerms-Bukkit-5.4.148.jar",
  "CoreProtect.jar": "https://github.com/PlayPro/CoreProtect/releases/download/v22.4/CoreProtect-22.4.jar",
  "GrimAC.jar": "grimac",
  "TAB.jar": "tab",
  "PvPManager.jar": "pvpmanager",
  "EssentialsX.jar": "essentials",
  "EssentialsXChat.jar": "essentialschat",
  "GriefPrevention.jar": "griefprevention"
};

async function getGithubLatestAsset(repo, matchStr) {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
  if (!res.ok) throw new Error(`GitHub rate limit or 404 for ${repo}`);
  const data = await res.json();
  const asset = data.assets.find(a => a.name.toLowerCase().includes(matchStr));
  if (!asset) throw new Error(`Could not find asset matching ${matchStr} in ${repo}`);
  return asset.browser_download_url;
}

async function resolveUrl(key) {
  if (plugins[key].startsWith("http")) return plugins[key];
  switch (key) {
    case "GrimAC.jar": return await getGithubLatestAsset("GrimAnticheat/Grim", "grimac.jar");
    case "TAB.jar": return await getGithubLatestAsset("NEZNAMY/TAB", ".jar");
    case "PvPManager.jar": return await getGithubLatestAsset("NoChanceSD/PvPManager", ".jar");
    case "EssentialsX.jar": return await getGithubLatestAsset("EssentialsX/Essentials", "essentialsx-");
    case "EssentialsXChat.jar": return await getGithubLatestAsset("EssentialsX/Essentials", "essentialsxchat-");
    case "GriefPrevention.jar": return await getGithubLatestAsset("TechFortress/GriefPrevention", ".jar");
    default: throw new Error("Unknown key " + key);
  }
}

async function getToken() {
  const res = await fetch(`${ROOT}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: CID, client_secret: CSEC, scope: "server.files" }).toString(),
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
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins?folder=true`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });

  for (const [fileName, val] of Object.entries(plugins)) {
    try {
      let url = await resolveUrl(fileName);
      console.log(`Downloading ${fileName} from ${url}...`);
      
      const dlRes = await fetch(url);
      if (!dlRes.ok) throw new Error(`Download failed: ${dlRes.status}`);
      const arrayBuf = await dlRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      
      await uploadFile(token, fileName, buffer);
    } catch (err) {
      console.error(`❌ Failed on ${fileName}: ${err.message}`);
    }
  }
  console.log("Done!");
}
main();
