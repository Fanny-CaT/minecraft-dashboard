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
  
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/console`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: "help SuperEnchants\n"
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  const res = await fetch(`${ROOT}/proxy/daemon/server/${ID}/console`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  const logs = data.logs.join('');
  const lines = logs.split('\n');
  console.log(lines.slice(Math.max(lines.length - 20, 0)).join('\n'));
}

main().catch(console.error);
