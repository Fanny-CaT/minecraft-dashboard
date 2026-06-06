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
  const putRes = await fetch(`${PUFFER_URL}/api/servers/${ID}/file/testdel.txt`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: "delete me"
  });
  console.log("PUT Status:", putRes.status);

  // 3. GET file
  const getRes = await fetch(`${PUFFER_URL}/api/servers/${ID}/file/testdel.txt`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("GET Status:", getRes.status);

  // 4. DELETE file
  const delRes = await fetch(`${PUFFER_URL}/api/servers/${ID}/file/testdel.txt`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log("Delete Status:", delRes.status);
}

run();
