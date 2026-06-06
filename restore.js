const fs = require('fs');

async function run() {
  const PUFFER_URL = "https://meowtopia-panel.duckdns.org";
  const ID = "946f16b4";
  const CLIENT_ID = "028831fc-688b-4811-a1f8-ce7008958cb6";
  const CLIENT_SECRET = "nel4nBv8VvSnTog0od8Oy-43045LSEn-jO56MRA9g7ngJwq3";

  const tokenRes = await fetch(`${PUFFER_URL}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;

  const url = `${PUFFER_URL}/proxy/daemon/server/${ID}/file`;

  const props = `
#Minecraft server properties
#Mon Jan 01 00:00:00 UTC 2026
server-port=25565
server-ip=0.0.0.0
level-name=world
motd=A Minecraft Server
max-players=20
online-mode=false
view-distance=7
simulation-distance=4
`;
  
  await fetch(`${url}/server.properties`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: props
  });
  console.log("Restored server.properties");
}
run();
