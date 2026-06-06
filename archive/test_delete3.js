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

  const url = `${PUFFER_URL}/proxy/daemon/server/${ID}/file`;

  // 2. PUT
  console.log("Creating file...");
  const putRes = await fetch(`${url}/testdel.txt`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: "hello world"
  });
  console.log("PUT status:", putRes.status);

  // 3. Try POST delete
  console.log("Trying POST delete...");
  const renRes = await fetch(`${url}/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete", files: ["testdel.txt"] })
  });
  console.log("POST delete status:", renRes.status, await renRes.text());

  // 4. Try DELETE with array?
  console.log("Trying DELETE with array payload...");
  const delRes = await fetch(`${url}/`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ files: ["testdel.txt"] })
  });
  console.log("Delete status:", delRes.status, await delRes.text());
}

run();
