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
        getLogger().info("Downloading Skript.jar...");
        Bukkit.getScheduler().runTaskAsynchronously(this, () -> {
            try {
                URL url = new URL("https://github.com/SkriptLang/Skript/releases/download/2.9.2/Skript.jar");
                Path dest = Paths.get("plugins", "Skript.jar");
                try (InputStream in = url.openStream()) {
                    Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
                }
                getLogger().info("Skript.jar downloaded successfully! Please restart the server again to load it.");
                
                // We'll also rename ourselves so we don't run again
                Path me = Paths.get("plugins", "InstallerPlugin.jar");
                Path off = Paths.get("plugins", "InstallerPlugin.disabled");
                Files.move(me, off, StandardCopyOption.REPLACE_EXISTING);
                
                // Restart automatically
                Bukkit.getScheduler().runTask(this, () -> {
                    Bukkit.getServer().shutdown();
                });
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

async function main() {
  fs.mkdirSync('src/com/c7', { recursive: true });
  fs.writeFileSync('src/com/c7/InstallerPlugin.java', javaCode);
  fs.writeFileSync('installer_plugin.yml', pluginYml);

  console.log("Compiling InstallerPlugin...");
  execSync('javac --release 21 -cp paper-api.jar src/com/c7/InstallerPlugin.java');
  execSync('jar cf InstallerPlugin.jar -C src com');
  execSync('jar uf InstallerPlugin.jar -C . installer_plugin.yml'); // wait jar uf syntax requires standard structure, I'll use standard jar cf
  
  // Actually, wait, let's just use jar cf InstallerPlugin.jar -C src com and then add plugin.yml manually
  // I will just write a cleaner compilation block
}

main().catch(console.error);
