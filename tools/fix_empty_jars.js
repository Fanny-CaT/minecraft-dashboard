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

  console.log("Listing plugins...");
  const fileRes = await fetch(`${PUFFER_URL}/proxy/daemon/server/${ID}/file/plugins/EssentialsX-2.22.0.jar`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("EssentialsX jar status:", fileRes.status);
  console.log("EssentialsX content preview:", (await fileRes.text()).slice(0, 50));
  
  for (const f of files) {
    if (f.isFile && f.size === 0 && f.name.endsWith(".jar")) {
      console.log(`Fixing empty jar: ${f.name}`);
      await fetch(`${PUFFER_URL}/proxy/daemon/server/${ID}/file/plugins/${f.name}`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/octet-stream"
        },
        body: emptyZipBuffer
      });
    }
  }
  console.log("Done fixing jars.");
}
run();
