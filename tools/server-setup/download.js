const fs = require('fs');
const path = require('path');
const https = require('https');

const plugins = [
  { name: 'Geyser-Spigot.jar', url: 'https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/spigot' },
  { name: 'Floodgate-Spigot.jar', url: 'https://download.geysermc.org/v2/projects/floodgate/versions/latest/builds/latest/downloads/spigot' },
  { name: 'GrimAC.jar', url: 'https://github.com/GrimAnticheat/Grim/releases/latest/download/grimac.jar' }, // Needs redirect handling
  { name: 'LuckPerms.jar', url: 'https://download.luckperms.net/1555/bukkit/loader/LuckPerms-Bukkit-5.4.148.jar' },
  { name: 'EssentialsX.jar', url: 'https://github.com/EssentialsX/Essentials/releases/download/2.20.1/EssentialsX-2.20.1.jar' },
  { name: 'EssentialsXChat.jar', url: 'https://github.com/EssentialsX/Essentials/releases/download/2.20.1/EssentialsXChat-2.20.1.jar' },
  // Let's use PvPToggle for consent pvp
  { name: 'PvPToggle.jar', url: 'https://github.com/kixmc/PvPToggle/releases/download/v1.7.5/PvPToggle-1.7.5.jar' },
  // CoreProtect for block logging
  { name: 'CoreProtect.jar', url: 'https://github.com/PlayPro/CoreProtect/releases/download/v22.4/CoreProtect-22.4.jar' },
  // GriefPrevention for land claims
  { name: 'GriefPrevention.jar', url: 'https://github.com/TechFortress/GriefPrevention/releases/download/16.18.3/GriefPrevention.jar' },
  // ClearLag / Optimization
  { name: 'ClearLag.jar', url: 'https://dev.bukkit.org/projects/clearlagg/files/latest' } // Just an example, maybe better to use native Paper/Purpur configs for lag
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = (url) => {
      https.get(url, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          console.log(`Redirecting to ${response.headers.location}`);
          get(response.headers.location);
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    };
    get(url);
  });
}

async function main() {
  for (const p of plugins) {
    if (p.name === 'ClearLag.jar') continue; // We will use Purpur native optimizations instead of ClearLag
    console.log(`Downloading ${p.name}...`);
    try {
      await download(p.url, path.join(__dirname, 'plugins', p.name));
      console.log(`✅ Downloaded ${p.name}`);
    } catch (e) {
      console.error(`❌ Failed ${p.name}:`, e.message);
    }
  }
}
main();
