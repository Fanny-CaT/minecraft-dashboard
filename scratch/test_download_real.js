const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const ROOT = env.PUFFER_URL;
const ID = env.PUFFER_SERVER_ID;
const CID = env.PUFFER_CLIENT_ID;
const CSEC = env.PUFFER_CLIENT_SECRET;

async function run() {
  const tokenRes = await fetch(`${ROOT}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "client_credentials",
      client_id:     CID,
      client_secret: CSEC,
      scope:         "server.view server.console server.power server.files",
    }).toString()
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;

  console.log("Fetching backups list...");
  const listRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/backups`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const filesList = await listRes.json();
  const backupFile = filesList.find(f => f.isFile && f.name.endsWith('.zip'));

  if (!backupFile) {
    console.log("No backup file found!");
    return;
  }

  console.log(`Downloading ${backupFile.name}...`);
  const res = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/backups/${backupFile.name}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  console.log("Response status:", res.status);
  console.log("Response headers:", Object.fromEntries(res.headers.entries()));
}

run().catch(console.error);
