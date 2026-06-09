require('dotenv').config({ path: '.env.local' });

const ROOT = process.env.PUFFER_URL;
const ID = process.env.PUFFER_SERVER_ID;
const CID = process.env.PUFFER_CLIENT_ID;
const CSEC = process.env.PUFFER_CLIENT_SECRET;

async function getToken() {
  const res = await fetch(`${ROOT}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: CID, client_secret: CSEC, scope: "server.console" }).toString(),
  });
  return (await res.json()).access_token;
}

async function sendCommand(token, cmd) {
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/console`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain' },
    body: cmd
  });
  console.log(`✅ Executed: /${cmd}`);
}

async function main() {
  const token = await getToken();
  await sendCommand(token, "lp group default permission set pvpmanager.pvp true");
  await sendCommand(token, "lp group default permission set pvpmanager.command.pvp true");
}
main();
