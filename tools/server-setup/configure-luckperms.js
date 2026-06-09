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
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CID,
      client_secret: CSEC,
      scope: "server.console server.files",
    }).toString(),
  });
  const data = await res.json();
  return data.access_token;
}

async function sendCommand(token, cmd) {
  console.log(`Sending command: ${cmd}`);
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/console`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain'
    },
    body: cmd
  });
  await new Promise(r => setTimeout(r, 500));
}

async function uploadPlugin(token, url, filename) {
  console.log(`Downloading ${filename}...`);
  const buff = await fetch(url).then(r => r.arrayBuffer());
  
  console.log(`Uploading ${filename} to PufferPanel...`);
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/${filename}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream'
    },
    body: buff
  });
}

async function main() {
  const token = await getToken();
  
  // Download and upload TAB & PvPManager
  await uploadPlugin(token, 'https://github.com/NEZNAMY/TAB/releases/download/4.1.8/TAB.jar', 'TAB.jar');
  await uploadPlugin(token, 'https://github.com/NoChanceSD/PvPManager/releases/download/v3.13.4/PvPManager-3.13.4.jar', 'PvPManager.jar');

  // We should remove PvPToggle since PvPManager does both
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/PvPToggle.jar`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });

  // Setup LuckPerms Groups
  const groups = [
    { name: 'member', weight: 10, prefix: '&7Member &f' },
    { name: 'vip', weight: 20, prefix: '&aVIP &f' },
    { name: 'vvip', weight: 30, prefix: '&bVVIP &f' },
    { name: 'mvp', weight: 40, prefix: '&6MVP &f' },
    { name: 'staff', weight: 50, prefix: '&e&lSTAFF &f' },
    { name: 'admin', weight: 60, prefix: '&c&lADMIN &f' },
    { name: 'mommy', weight: 100, prefix: '&d&lMOMMY 🌸 &f' }
  ];

  for (const g of groups) {
    await sendCommand(token, `lp creategroup ${g.name}`);
    await sendCommand(token, `lp group ${g.name} set weight ${g.weight}`);
    await sendCommand(token, `lp group ${g.name} meta setprefix "${g.prefix}"`);
  }

  // Set default group properties
  await sendCommand(token, `lp group default parent add member`);
  
  // Restart server to apply new plugins
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/kill`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
  await new Promise(r => setTimeout(r, 3000));
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/start`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});

  console.log("Setup complete!");
}
main();
