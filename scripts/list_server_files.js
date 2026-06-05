

const ROOT = process.env.PUFFER_URL;
const ID = process.env.PUFFER_SERVER_ID;
const CID = process.env.PUFFER_CLIENT_ID;
const CSEC = process.env.PUFFER_CLIENT_SECRET;

async function listFiles(path = "") {
  const tokenRes = await fetch(`${ROOT}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CID,
      client_secret: CSEC,
      scope: 'server.files'
    })
  });
  const { access_token } = await tokenRes.json();

  const clean = path.replace(/^\//, "");
  const res = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/${clean}`, {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  
  const files = await res.json();
  console.log(`Files in /${clean}:`);
  files.forEach(f => {
    console.log(`${f.isFile ? '📄' : '📁'} ${f.name} (${f.size} bytes)`);
  });
}

listFiles(process.argv[2] || "");
