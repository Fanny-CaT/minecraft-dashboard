const ROOT = "https://meowtopia-panel.duckdns.org";
const ID = "946f16b4";
const CID = "028831fc-688b-4811-a1f8-ce7008958cb6";
const CSEC = "nel4nBv8VvSnTog0od8Oy-43045LSEn-jO56MRA9g7ngJwq3";

const PURE_JAVA_COMMAND = `java\${javaversion} -Xmx\${memory}M -Dterminal.jline=false -Dterminal.ansi=true -Djline.terminal=jline.UnsupportedTerminal -Dlog4j2.formatMsgNoLookups=true -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 -Dusing.aikars.flags=https://mcflags.emc.gs -Daikars.new.flags=true -jar paper.jar nogui`;

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

    console.log("2. Fetching current configuration...");
    const getRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const config = await getRes.json();

    // Set repair command using pure java command
    const repairCommand = `bash -c "rm -f plugins && mkdir -p plugins && ${PURE_JAVA_COMMAND}"`;
    console.log("Repair Command:", repairCommand);

    config.run.command = repairCommand;

    console.log("3. Updating config to repair command...");
    const postRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(config)
    });
    console.log("POST status:", postRes.status);
    if (postRes.status !== 204) {
      console.error("Failed to update config");
      return;
    }

    // Stop server first to make sure we can boot it fresh
    console.log("4. Sending STOP command to server...");
    await fetch(`${ROOT}/proxy/daemon/server/${ID}/stop`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("5. Sending START command to server...");
    const startRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Start status:", startRes.status);

    console.log("6. Waiting for execution (4 seconds)...");
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // Restore original command
    console.log("7. Restoring original pure java command...");
    config.run.command = PURE_JAVA_COMMAND;
    const restoreRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(config)
    });
    console.log("Restore status:", restoreRes.status);
    console.log("Repair process completed successfully!");
  } catch (err) {
    console.error("Error during repair:", err);
  }
}

main();
