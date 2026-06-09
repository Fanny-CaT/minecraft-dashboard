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

const skriptCode = `command /discord:
    aliases: /dc, /server
    trigger:
        send "&8[&9&lDiscord&8] &7Join our community! Click here: &b&nhttps://discord.gg/yeXDAFGfqG" to player
        play sound "entity.experience_orb.pickup" with volume 0.5 and pitch 1 at player
`;

async function main() {
  const token = await getToken();
  
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/Skript/scripts/discord.sk`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body: skriptCode
  });
  
  // Also fetch and update TAB config
  const tabRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/TAB/config.yml`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  let tabText = await tabRes.text();
  
  tabText = tabText.replace("&r&7Visit our webpage %animation:web%", "&r&9&lDiscord: &bdiscord.gg/yeXDAFGfqG");
  
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/TAB/config.yml`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body: tabText
  });
  
  console.log("Discord link added to Skript and TAB!");
}

main().catch(console.error);
