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

  console.log("Creating folder backups/test-backup-dir...");
  const dirRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/backups/test-backup-dir?folder=true`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("Create folder status:", dirRes.status);

  console.log("Writing file backups/test-backup-dir/test-file.txt...");
  const fileRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/backups/test-backup-dir/test-file.txt`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain"
    },
    body: "hello world"
  });
  console.log("Write file status:", fileRes.status);

  console.log("\nDeleting directory backups/test-backup-dir...");
  const delRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/backups/test-backup-dir`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("Delete directory status:", delRes.status);
  console.log("Delete directory body:", await delRes.text());
}

run().catch(console.error);
