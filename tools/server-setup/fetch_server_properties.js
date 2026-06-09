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
  
  const resProp = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/server.properties`, { headers: { Authorization: `Bearer ${token}` } });
  const textProp = await resProp.text();
  console.log("=== server.properties ===");
  console.log(textProp.split('\n').filter(l => l.includes('allow-nether') || l.includes('end')).join('\n'));
  
  const resBukkit = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/bukkit.yml`, { headers: { Authorization: `Bearer ${token}` } });
  const textBukkit = await resBukkit.text();
  console.log("=== bukkit.yml ===");
  console.log(textBukkit.split('\n').filter(l => l.includes('allow-end')).join('\n'));

}

main().catch(console.error);
