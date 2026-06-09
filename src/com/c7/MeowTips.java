package com.c7;
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
