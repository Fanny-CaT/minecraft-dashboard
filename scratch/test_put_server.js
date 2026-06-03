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
      scope:         "server.view server.console server.power server.files server.edit server.admin",
    }).toString()
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;

  // Get full server details from daemon
  const daemonRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const config = await daemonRes.json();

  // Test updating the command
  const originalCommand = config.run.command;
  const newCommand = originalCommand + " -Dtest.param=hello";
  
  console.log("Original command:", originalCommand);
  console.log("Attempting PUT /api/servers/" + ID);

  const putBody = {
    id: config.id,
    name: "MeowTopia",
    node: config.server?.node?.id || 0,
    type: config.type,
    display: config.display,
    data: config.data,
    run: {
      ...config.run,
      command: newCommand
    },
    environment: config.environment,
    supportedEnvironments: config.supportedEnvironments,
    install: config.install,
    requirements: config.requirements
  };

  const putRes = await fetch(`${ROOT}/api/servers/${ID}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(putBody)
  });

  console.log("PUT status:", putRes.status);
  console.log("Response:", await putRes.text());
}

run().catch(console.error);
