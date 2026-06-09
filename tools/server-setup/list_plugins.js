require('dotenv').config({ path: '.env.local' });

const ROOT = process.env.PUFFER_URL;
const ID = process.env.PUFFER_SERVER_ID;
const CID = process.env.PUFFER_CLIENT_ID;
const CSEC = process.env.PUFFER_CLIENT_SECRET;

async function getToken() {
  const res = await fetch(`${ROOT}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: CID, client_secret: CSEC, scope: "server.files" }).toString(),
  });
  return (await res.json()).access_token;
}

async function main() {
  const token = await getToken();
  const res = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  data.files.forEach(f => console.log(f.name));
}
main();
