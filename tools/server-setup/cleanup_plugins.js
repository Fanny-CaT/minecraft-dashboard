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

async function listFiles(token) {
  const res = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.files; // Array of { name, isFile }
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
  try {
    const files = await listFiles(token);
    for (const file of files) {
      if (file.name.toLowerCase().includes('veinminer') || 
          file.name.toLowerCase().includes('nightcore') || 
          file.name.toLowerCase().includes('excellent') || 
          file.name.toLowerCase().includes('fabric')) {
        await deleteFile(token, file.name);
      }
    }

    console.log("Restarting server...");
    await fetch(`${ROOT}/proxy/daemon/server/${ID}/console`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain' },
        body: 'restart'
    });
  } catch(e) {
    console.error(e);
  }
}
main();
