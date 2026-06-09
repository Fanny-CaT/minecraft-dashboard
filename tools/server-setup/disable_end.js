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
  
  // Read bukkit.yml
  let res = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/bukkit.yml`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    console.log("Failed to read bukkit.yml:", res.status);
    return;
  }
  let content = await res.text();
  
  if (content.includes("allow-end: true")) {
    content = content.replace("allow-end: true", "allow-end: false");
    // Write bukkit.yml
    const writeRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/bukkit.yml`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: content
    });
    console.log("Updated bukkit.yml:", writeRes.status);
  } else {
    console.log("End is already disabled or not found.");
  }
}

main().catch(console.error);
