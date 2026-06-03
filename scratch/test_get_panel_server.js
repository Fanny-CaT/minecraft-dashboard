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
  // Get Token with server.edit / server.admin if possible
  console.log("Getting oauth2 token...");
  const tokenRes = await fetch(`${ROOT}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "client_credentials",
      client_id:     CID,
      client_secret: CSEC,
      scope:         "server.view server.console server.power server.files server.edit server.admin",
    }).toString()
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;
  console.log("Scope granted:", tokenData.scope || "unknown");

  console.log("Fetching /api/servers/" + ID);
  const res = await fetch(`${ROOT}/api/servers/${ID}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Panel server details:", JSON.stringify(data, null, 2));
}

run().catch(console.error);
