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
  
  // 1. Create a valid dummy zip file to overwrite the corrupted Skript.jar
  console.log("Creating dummy Skript.jar to overwrite corrupted file...");
  fs.writeFileSync('dummy.txt', 'dummy');
  execSync('jar cf dummy_skript.jar dummy.txt');
  const dummyBuffer = fs.readFileSync('dummy_skript.jar');
  
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/Skript.jar`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body: dummyBuffer
  });
  
  console.log("Uploaded dummy Skript.jar to un-brick the server.");

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
        getLogger().info("Downloading Skript.jar securely...");
        Bukkit.getScheduler().runTaskAsynchronously(this, () -> {
            try {
                URL url = new URL("https://github.com/SkriptLang/Skript/releases/download/2.15.3/Skript-2.15.3.jar");
                Path dest = Paths.get("plugins", "Skript.jar");
                try (InputStream in = url.openStream()) {
                    Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
                }
                getLogger().info("✅ Skript downloaded! Restarting server in 5 seconds to load it...");
                
                Path me = Paths.get("plugins", "InstallerPlugin.jar");
                Path off = Paths.get("plugins", "InstallerPlugin.disabled");
                Files.move(me, off, StandardCopyOption.REPLACE_EXISTING);
                
                Thread.sleep(5000);
                Thread.sleep(5000);
                Bukkit.getLogger().info("Shutting down to apply Skript!");
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
  console.log("Killing frozen server and starting...");
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/kill`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
  await new Promise(r => setTimeout(r, 2000));
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/start`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
  
  console.log("Server starting! InstallerPlugin will now fetch Skript properly.");
}

main().catch(console.error);
