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
  
  // Get current server details
  const res = await fetch(`${ROOT}/proxy/daemon/server/${ID}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const current = await res.json();
  
  const originalCommand = current.run.command;
  console.log("Original Command:", originalCommand);
  
  // Try to update the run command
  const testCommand = originalCommand + " -Dtest.param=hello";
  console.log("Testing update with command:", testCommand);
  
  const updateRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/data`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      data: current.data,
      run: {
        ...current.run,
        command: testCommand
      }
    })
  });
  
  console.log("Update status:", updateRes.status);
  const responseText = await updateRes.text();
  console.log("Response:", responseText);
}

run().catch(console.error);
