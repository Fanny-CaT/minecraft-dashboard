const fs = require('fs');
const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.local' });

const PAPER_API_URL = "https://repo.papermc.io/repository/maven-public/io/papermc/paper/paper-api/1.21.1-R0.1-SNAPSHOT/paper-api-1.21.1-R0.1-20250328.161643-128.jar";

async function main() {
  const pluginYml = `name: MeowTips
version: 1.0
main: com.c7.MeowTips
api-version: '1.21'
`;

  const javaCode = `package com.c7;
import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.plugin.java.JavaPlugin;

public class MeowTips extends JavaPlugin {

    private final String[] tips = {
        "&8[&bTip&8] &7Did you know? You can type &b/sit &7anywhere to take a break!",
        "&8[&bTip&8] &7Use a &eGolden Shovel &7to claim your land and protect it from griefers.",
        "&8[&bTip&8] &7Want to fight a friend? Type &c/pvp toggle &7to turn on PvP mode!",
        "&8[&bTip&8] &7Look out for custom enchantments like &aVeinminer &7and &6Lumberjack &7in the enchanting table!",
        "&8[&bFun Fact&8] &7Only 1 person needs to sleep to skip the night. Sweet dreams!",
        "&8[&bTip&8] &7When you chop down trees, the leaves will decay instantly. No more floating trees!"
    };

    private int currentIndex = 0;

    @Override
    public void onEnable() {
        // Run every 5 minutes (20 ticks * 60 seconds * 5)
        Bukkit.getScheduler().scheduleSyncRepeatingTask(this, () -> {
            if (Bukkit.getOnlinePlayers().isEmpty()) return; // Don't spam empty server
            
            String tip = tips[currentIndex];
            Bukkit.broadcastMessage(ChatColor.translateAlternateColorCodes('&', tip));
            
            currentIndex++;
            if (currentIndex >= tips.length) {
                currentIndex = 0;
            }
        }, 20 * 60 * 5, 20 * 60 * 5);
        
        getLogger().info("MeowTips enabled! Broadcasting every 5 minutes.");
    }
}
`;

  fs.mkdirSync('src/com/c7', { recursive: true });
  fs.writeFileSync('src/com/c7/MeowTips.java', javaCode);
  fs.writeFileSync('plugin.yml', pluginYml);

  console.log("Compiling...");
  execSync('javac --release 21 -cp paper-api.jar src/com/c7/MeowTips.java');

  console.log("Packaging...");
  execSync('jar cf MeowTips.jar plugin.yml -C src com');
  
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
  
  const pluginBuffer = fs.readFileSync('MeowTips.jar');
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/MeowTips.jar`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body: pluginBuffer
  });

  console.log("Restarting server...");
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/kill`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
  await new Promise(r => setTimeout(r, 2000));
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/start`, {method:'POST',headers:{Authorization:`Bearer ${token}`}});
  console.log("Server restarting with MeowTips!");
}

main().catch(console.error);
