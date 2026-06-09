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
  
  const dsRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/DiscordSRV/config.yml`, { headers: { Authorization: `Bearer ${token}` } });
  if (dsRes.ok) {
    let dsConf = await dsRes.text();
    fs.writeFileSync('ds_config.yml', dsConf);
    console.log("Downloaded DiscordSRV config.");
  } else {
    console.log("DiscordSRV config not found.");
  }
  
  const vcRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/voicechat-discord/config.yml`, { headers: { Authorization: `Bearer ${token}` } });
  if (vcRes.ok) {
    let vcConf = await vcRes.text();
    fs.writeFileSync('vc_config.yml', vcConf);
    console.log("Downloaded voicechat-discord config.");
  } else {
    console.log("voicechat-discord config not found.");
  }
}

main().catch(console.error);
