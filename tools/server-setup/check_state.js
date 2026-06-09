require('dotenv').config({ path: '.env.local' });

const ROOT = process.env.PUFFER_URL;
const ID = process.env.PUFFER_SERVER_ID;
const CID = process.env.PUFFER_CLIENT_ID;
const CSEC = process.env.PUFFER_CLIENT_SECRET;

async function getToken() {
  const res = await fetch(`${ROOT}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: CID, client_secret: CSEC, scope: "server.files server.console" }).toString(),
  });
  return (await res.json()).access_token;
}

async function main() {
  const token = await getToken();
  
  const consoleRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/console`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await consoleRes.json();
  const logs = data.logs || "";
  const lines = logs.split('\n');
  console.log("=== CONSOLE LOGS ===");
  console.log(lines.slice(Math.max(lines.length - 40, 0)).join('\n'));

  const dirRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/dir/plugins`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const dirData = await dirRes.json();
  console.log("=== PLUGINS DIRECTORY ===");
  dirData.files.forEach(f => {
      if (f.name.includes("Skript") || f.name.includes("InstallerPlugin") || f.name.includes("dummy")) {
          console.log(`${f.name} - ${f.size} bytes`);
      }
  });

}

main().catch(console.error);
