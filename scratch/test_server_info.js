const ROOT = "https://meowtopia-panel.duckdns.org";
const ID = "946f16b4";
const CID = "028831fc-688b-4811-a1f8-ce7008958cb6";
const CSEC = "nel4nBv8VvSnTog0od8Oy-43045LSEn-jO56MRA9g7ngJwq3";

async function main() {
  try {
    console.log("Fetching token...");
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

    console.log("Fetching daemon server details...");
    const serverRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const serverInfo = await serverRes.json();
    console.log("Daemon Server Info:", JSON.stringify(serverInfo, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
