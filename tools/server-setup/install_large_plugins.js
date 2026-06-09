require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { execSync } = require('child_process');

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

  // 2. Create InstallerPlugin
  const javaCode = `package com.c7;
import org.bukkit.Bukkit;
import org.bukkit.plugin.java.JavaPlugin;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.net.URL;

public class InstallerPlugin extends JavaPlugin {
    @Override
    public void onEnable() {
        getLogger().info("Downloading large Discord plugins securely...");
        Bukkit.getScheduler().runTaskAsynchronously(this, () -> {
            try {
                String[][] plugins = {
                    {"DiscordSRV.jar", "https://cdn.modrinth.com/data/UmLGoGij/versions/ATlquwiT/DiscordSRV-Build-1.30.5.jar"},
                    {"voicechat-bukkit.jar", "https://cdn.modrinth.com/data/9eGKb6K1/versions/7ROzE7Qh/voicechat-bukkit-2.6.18.jar"},
                    {"voicechat-discord.jar", "https://cdn.modrinth.com/data/S1jG5YV5/versions/cAaWO31V/voicechat-discord-paper-3.1.4.jar"}
                };
                
                for(String[] p : plugins) {
                    getLogger().info("Fetching " + p[0]);
                    URL url = new URL(p[1]);
                    Path dest = Paths.get("plugins", p[0]);
                    try (InputStream in = url.openStream()) {
                        Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
                    }
                }
                
                getLogger().info("✅ Discord plugins downloaded! Restarting server in 5 seconds to load them...");
                
                Path me = Paths.get("plugins", "InstallerPlugin.jar");
                Path off = Paths.get("plugins", "InstallerPlugin.disabled");
                Files.move(me, off, StandardCopyOption.REPLACE_EXISTING);
                
                Thread.sleep(5000);
                Bukkit.getLogger().info("Shutting down to apply Discord plugins!");
                System.exit(0);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }
}
`;

  const pluginYml = `name: InstallerPlugin
version: 1.0
main: com.c7.InstallerPlugin
api-version: '1.21'
`;

  fs.mkdirSync('src/com/c7', { recursive: true });
  fs.writeFileSync('src/com/c7/InstallerPlugin.java', javaCode);
  fs.writeFileSync('src/plugin.yml', pluginYml);

  console.log("Compiling InstallerPlugin...");
  execSync('javac --release 21 -cp paper-api.jar src/com/c7/InstallerPlugin.java');
  execSync('jar cf InstallerPlugin.jar -C src com -C src plugin.yml');
  
  const pluginBuffer = fs.readFileSync('InstallerPlugin.jar');
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/InstallerPlugin.jar`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body: pluginBuffer
  });
  
  console.log("Uploaded InstallerPlugin.jar.");
  
  // Restart server
  console.log("Killing server and starting...");
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/kill`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
  await new Promise(r => setTimeout(r, 2000));
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/start`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
  
  console.log("Server starting! InstallerPlugin will now fetch the 3 plugins properly.");
}

main().catch(console.error);
