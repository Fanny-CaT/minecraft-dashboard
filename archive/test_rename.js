const fs = require('fs');

async function run() {
  const PUFFER_URL = "https://meowtopia-panel.duckdns.org";
  const ID = "946f16b4";
  const CLIENT_ID = "028831fc-688b-4811-a1f8-ce7008958cb6";
  const CLIENT_SECRET = "nel4nBv8VvSnTog0od8Oy-43045LSEn-jO56MRA9g7ngJwq3";

  // 1. Get Token
  const tokenRes = await fetch(`${PUFFER_URL}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;

  // 2. Create test file
  await fetch(`${PUFFER_URL}/api/servers/${ID}/file/test1.txt`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: "hello world"
  });

  // 3. Try to rename via POST
  const res = await fetch(`${PUFFER_URL}/api/servers/${ID}/file/test1.txt`, {
    method: "POST",
    headers: { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ action: "rename", name: "test2.txt" })
  });

  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);

  // 4. Try another format if that failed
  const res2 = await fetch(`${PUFFER_URL}/api/servers/${ID}/file/test1.txt?action=rename&name=test2.txt`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("Status 2:", res2.status);
  console.log("Response 2:", await res2.text());

  // 5. Cleanup
  await fetch(`${PUFFER_URL}/api/servers/${ID}/file/test1.txt`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
  await fetch(`${PUFFER_URL}/api/servers/${ID}/file/test2.txt`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}

run();
