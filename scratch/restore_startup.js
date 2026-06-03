const ROOT = "https://meowtopia-panel.duckdns.org";
const ID = "946f16b4";
const CID = "028831fc-688b-4811-a1f8-ce7008958cb6";
const CSEC = "nel4nBv8VvSnTog0od8Oy-43045LSEn-jO56MRA9g7ngJwq3";

const PURE_JAVA_COMMAND = `java\${javaversion} -Xmx\${memory}M -Dterminal.jline=false -Dterminal.ansi=true -Djline.terminal=jline.UnsupportedTerminal -Dlog4j2.formatMsgNoLookups=true -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 -Dusing.aikars.flags=https://mcflags.emc.gs -Daikars.new.flags=true -jar paper.jar nogui`;

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

    console.log("Fetching current configuration...");
    const getRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const config = await getRes.json();

    console.log("Restoring command to pure Java...");
    config.run.command = PURE_JAVA_COMMAND;

    const postRes = await fetch(`${ROOT}/proxy/daemon/server/${ID}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(config)
    });
    console.log("POST status:", postRes.status);
    console.log("Startup command restored.");
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
