require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

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
  
  const dsConf = fs.readFileSync('ds_config.yml');
  const vcConf = fs.readFileSync('vc_config.yml');

  await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/DiscordSRV/config.yml`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body: dsConf
  });
  console.log("Uploaded ds_config.yml");
  
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/voicechat-discord/config.yml`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body: vcConf
  });
  console.log("Uploaded vc_config.yml");
  
  // Reload discord
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/console`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: "discord reload\\n"
  });
  console.log("Sent /discord reload to server!");

}

main().catch(console.error);
