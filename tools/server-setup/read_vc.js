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
  let res = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/voicechat/voicechat-server.properties`, { headers: { Authorization: `Bearer ${token}` } });
  if (res.ok) {
    console.log("VoiceChat Config:\n" + await res.text());
  } else {
    console.log("Failed:", res.status);
  }
}

main().catch(console.error);
