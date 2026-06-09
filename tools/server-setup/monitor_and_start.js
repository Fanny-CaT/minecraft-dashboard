require('dotenv').config({ path: '.env.local' });

const ROOT = process.env.PUFFER_URL;
const ID = process.env.PUFFER_SERVER_ID;
const CID = process.env.PUFFER_CLIENT_ID;
const CSEC = process.env.PUFFER_CLIENT_SECRET;

async function getToken() {
  const res = await fetch(`${ROOT}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: CID, client_secret: CSEC, scope: "server.files server.console server.stats" }).toString(),
  });
  return (await res.json()).access_token;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const token = await getToken();
  let offlineChecks = 0;
  
  while(true) {
    try {
      const res = await fetch(`${ROOT}/proxy/daemon/server/${ID}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      const isOffline = data.server.running === false;
      
      if (isOffline) {
        offlineChecks++;
        if (offlineChecks > 1) { // ensure it's truly offline
          console.log("Server is offline! Sending START command...");
          await fetch(`${ROOT}/proxy/daemon/server/${ID}/start`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
          console.log("Start command sent! Monitoring finished.");
          break;
        }
      } else {
        offlineChecks = 0;
        console.log("Server is running... waiting for it to download Skript and stop.");
      }
    } catch(e) {
      console.log("Error checking status", e.message);
    }
    await sleep(5000);
  }
}

main().catch(console.error);
