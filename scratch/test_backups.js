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
  // Get Token
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

  console.log("1. Testing file delete for a non-existent backup (should be 404 or 204 if exists):");
  const delRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/backups/nonexistent.zip`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("Delete status:", delRes.status);
  console.log("Delete body:", await delRes.text());

  console.log("\n2. Testing file extract for nonexistent backup:");
  const extRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/extract/backups/nonexistent.zip?destination=.`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("Extract status:", extRes.status);
  console.log("Extract body:", await extRes.text());

  console.log("\n3. Testing file list for backups folder:");
  const listRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/backups`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("List backups folder status:", listRes.status);
  const filesList = await listRes.json();
  console.log("Files in backups:", filesList);

  if (filesList.length > 0) {
    const firstBackup = filesList[0].name;
    console.log(`\n4. Testing download of first backup (${firstBackup}):`);
    const dlRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/backups/${firstBackup}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Download file size:", (await dlRes.blob()).size);
  }
}

run().catch(console.error);
