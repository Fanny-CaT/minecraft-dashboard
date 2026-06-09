package com.c7;
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
