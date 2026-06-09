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
  
  const res = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/TAB/config.yml`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  let text = await res.text();
  
  text = text.replace("GROUPS:owner,admin,mod,helper,builder,vip,default", "GROUPS:owner,admin,mommy,mod,helper,builder,vip,default");
  
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/TAB/config.yml`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body: text
  });
  
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/console`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: "tab reload\n"
  });
  
  console.log("Updated TAB config to include 'mommy' group and reloaded TAB!");
}

main().catch(console.error);
