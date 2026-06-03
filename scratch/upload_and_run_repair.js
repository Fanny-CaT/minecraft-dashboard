const fs = require('fs');
const path = require('path');

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

    console.log("2. Reading scratch/paper.jar...");
    const jarPath = path.join(__dirname, 'paper.jar');
    const jarBytes = fs.readFileSync(jarPath);
    console.log(`Read ${jarBytes.length} bytes.`);

    console.log("3. Uploading paper.jar to server...");
    const uploadRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/paper.jar`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream"
      },
      body: jarBytes
    });
    console.log("Upload status:", uploadRes.status);
    if (uploadRes.status > 299) {
      console.error("Upload failed:", await uploadRes.text());
      return;
    }

    // Stop server first to make sure it runs the new jar fresh
    console.log("4. Ensuring server is stopped...");
    await fetch(`${ROOT}/proxy/daemon/server/${ID}/stop`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("5. Starting server (running java -jar paper.jar)...");
    const startRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Start status:", startRes.status);

    console.log("6. Waiting for execution (5 seconds)...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log("7. Stopping server...");
    await fetch(`${ROOT}/proxy/daemon/server/${ID}/stop`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("8. Checking server files...");
    const filesRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const files = await filesRes.json();
    console.log("Files:", JSON.stringify(files, null, 2));

    const pluginsEntry = files.find(f => f.name === "plugins");
    if (pluginsEntry) {
      console.log(`Success! plugins entry type: ${pluginsEntry.isFile ? "FILE" : "DIRECTORY"}`);
    } else {
      console.log("plugins entry not found!");
    }
  } catch (err) {
    console.error("Error during upload & run:", err);
  }
}

main();
