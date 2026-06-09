const fs = require('fs');
const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.local' });
const PAPER_API_URL = "https://repo.papermc.io/repository/maven-public/io/papermc/paper/paper-api/1.21.1-R0.1-SNAPSHOT/paper-api-1.21.1-R0.1-20250328.161643-128.jar";

async function main() {
  console.log("Using downloaded Paper API...");
  // const apiRes = await fetch(PAPER_API_URL);
  // const apiBuffer = await apiRes.arrayBuffer();
  // fs.writeFileSync('paper-api.jar', Buffer.from(apiBuffer));

  const pluginYml = `name: CleanerPlugin
version: 1.0
main: com.c7.CleanerPlugin
api-version: '1.21'
`;

  const javaCode = `package com.c7;
import org.bukkit.plugin.java.JavaPlugin;
import java.io.File;

public class CleanerPlugin extends JavaPlugin {
    @Override
    public void onLoad() {
        getLogger().info("CleanerPlugin loaded! NUKING BAD PLUGINS...");
        File pluginsDir = getDataFolder().getParentFile();
        if (pluginsDir != null && pluginsDir.isDirectory()) {
            for (File file : pluginsDir.listFiles()) {
                String name = file.getName().toLowerCase();
                if (name.contains("veinminer") || 
                    name.contains("nightcore") || 
                    name.contains("excellent") || 
                    name.contains("fabric") ||
                    name.equals("skinrestorer.jar") ||
                    name.equals("grimac.jar") && !name.contains("2.3.74")) {
                    getLogger().info("Disabling: " + file.getAbsolutePath());
                    file.renameTo(new File(file.getParentFile(), file.getName() + ".disabled"));
                }
            }
        }
    }
}
`;

  fs.mkdirSync('src/com/c7', { recursive: true });
  fs.writeFileSync('src/com/c7/CleanerPlugin.java', javaCode);
  fs.writeFileSync('plugin.yml', pluginYml);

  console.log("Compiling...");
  execSync('javac --release 21 -cp paper-api.jar src/com/c7/CleanerPlugin.java');

  console.log("Packaging...");
  execSync('jar cf CleanerPlugin.jar plugin.yml -C src com');
  
  console.log("Done! Uploading...");
  
  const ROOT = process.env.PUFFER_URL;
  const ID = process.env.PUFFER_SERVER_ID;
  const CID = process.env.PUFFER_CLIENT_ID;
  const CSEC = process.env.PUFFER_CLIENT_SECRET;

  const res = await fetch(`${ROOT}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: CID, client_secret: CSEC, scope: "server.files server.console" }).toString(),
  });
  const token = (await res.json()).access_token;
  
  const pluginBuffer = fs.readFileSync('CleanerPlugin.jar');
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/CleanerPlugin.jar`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body: pluginBuffer
  });

  console.log("Restarting server...");
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/kill`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
  await new Promise(r => setTimeout(r, 2000));
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/start`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
  console.log("Server restarting with CleanerPlugin!");
}

main().catch(console.error);
