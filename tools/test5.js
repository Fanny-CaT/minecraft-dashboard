const fs = require('fs');

async function run() {
  const PUFFER_URL = "https://meowtopia-panel.duckdns.org";
  const ID = "946f16b4";
  const CLIENT_ID = "028831fc-688b-4811-a1f8-ce7008958cb6";
  const CLIENT_SECRET = "nel4nBv8VvSnTog0od8Oy-43045LSEn-jO56MRA9g7ngJwq3";

  console.log("Getting token...");
  const tokenRes = await fetch(`${PUFFER_URL}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
  });
  const token = (await tokenRes.json()).access_token;

  console.log("Creating FakePlugin.jar...");
  await fetch(`${PUFFER_URL}/proxy/daemon/server/${ID}/file/plugins/FakePlugin.jar`, {
    method: "PUT",
    headers: { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream"
    },
    body: Buffer.from("UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==", "base64")
  });
  
  console.log("FakePlugin.jar created.");
  
  // Now try to delete using our new empty zip workaround
  console.log("Calling delete via workaround...");
  const delRes = await fetch(`${PUFFER_URL}/proxy/daemon/server/${ID}/file/plugins/FakePlugin.jar`, {
    method: "PUT",
    headers: { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream"
    },
    body: Buffer.from("UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==", "base64")
  });
  console.log("Workaround applied:", delRes.status);
}
run();
