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

async function main() {
  const token = await getToken();
  let res = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/SkinsRestorer/config.yml`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    console.log("Failed to read SkinsRestorer config:", res.status);
    return;
  }
  let content = await res.text();
  
  if (content.includes("teleportRefresh: true")) {
    content = content.replace(/teleportRefresh: true/g, "teleportRefresh: false");
    let writeRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/SkinsRestorer/config.yml`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: content
    });
    console.log("Updated SkinsRestorer config:", writeRes.status);
  } else {
    console.log("teleportRefresh is already false or not found.");
  }
}

main().catch(console.error);
