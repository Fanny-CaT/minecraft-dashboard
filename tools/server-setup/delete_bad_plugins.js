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

async function deleteFile(token, filename) {
  const encoded = encodeURIComponent(filename);
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/${encoded}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`🗑 Deleted ${filename}`);
}

async function main() {
  const token = await getToken();
  
  // Try to list the directory directly
  const res = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  // Pufferpanel typically returns an array of files in data (or data is just the array)
  // Let's assume data is the array, or data.files
  let filesArray = Array.isArray(data) ? data : data.files;
  
  if (!filesArray) {
    console.log("Could not find files array. Response was:", data);
    return;
  }
  
  for (const file of filesArray) {
    // some pufferpanel versions return {name: "..."}
    const name = typeof file === 'string' ? file : file.name;
    if (!name) continue;

    if (name.toLowerCase().includes('veinminer') || 
        name.toLowerCase().includes('nightcore') || 
        name.toLowerCase().includes('excellent') || 
        name.toLowerCase().includes('fabric')) {
      await deleteFile(token, name);
    }
  }

  console.log("Restarting server...");
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/kill`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
  });
  await new Promise(r => setTimeout(r, 2000));
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
  });
  console.log("Server starting!");
}

main().catch(console.error);
