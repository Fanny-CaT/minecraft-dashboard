package com.c7;
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
