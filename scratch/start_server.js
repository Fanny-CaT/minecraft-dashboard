const ROOT = "https://meowtopia-panel.duckdns.org";
const ID = "946f16b4";
const CID = "028831fc-688b-4811-a1f8-ce7008958cb6";
const CSEC = "nel4nBv8VvSnTog0od8Oy-43045LSEn-jO56MRA9g7ngJwq3";

async function main() {
  try {
    console.log("1. Fetching token...");
    const res = await fetch(`${ROOT}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CID,
        client_secret: CSEC,
        scope: "server.view server.console server.power server.files",
      }).toString()
    });
    const data = await res.json();
    const token = data.access_token;
    console.log("Token acquired.");

    console.log("2. Starting server...");
    const startRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Start status:", startRes.status);

    console.log("3. Waiting for server boot (5 seconds)...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log("4. Fetching status...");
    const statusRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const statusData = await statusRes.json();
    console.log("Server Status:", JSON.stringify(statusData, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
