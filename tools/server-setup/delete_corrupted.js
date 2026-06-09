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

async function main() {
  const token = await getToken();
  const badFiles = ['PvPManager.jar', 'TAB.jar', 'GrimAC.jar'];

  for (const file of badFiles) {
    console.log(`Deleting corrupted ${file}...`);
    await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/${file}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  console.log("Done!");
}
main();
