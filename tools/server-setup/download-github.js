const fs = require('fs');
const path = require('path');
const https = require('https');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MinecraftDashboard/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(download(res.headers.location, dest));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function downloadLatestGithubAsset(repo, assetNameMatch) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.github.com/repos/${repo}/releases/latest`, { headers: { 'User-Agent': 'Node.js' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        try {
          const json = JSON.parse(data);
          if (!json.assets) throw new Error("No assets found for " + repo);
          let asset;
          if (assetNameMatch) {
            asset = json.assets.find(a => a.name.includes(assetNameMatch));
          } else {
            asset = json.assets[0];
          }
          if (!asset) throw new Error("Could not find matching asset for " + repo);
          
          console.log(`Downloading ${asset.name} from ${repo}...`);
          await download(asset.browser_download_url, path.join(__dirname, 'plugins', asset.name));
          console.log(`✅ Downloaded ${asset.name}`);
          resolve(asset.name);
        } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    await downloadLatestGithubAsset('NEZNAMY/TAB', 'TAB');
    await downloadLatestGithubAsset('NoChanceSD/PvPManager', 'PvPManager');
    await downloadLatestGithubAsset('GrimAnticheat/Grim', 'grimac');
    
    // For LuckPerms, we use their API
    const lpUrl = 'https://download.luckperms.net/1555/bukkit/loader/LuckPerms-Bukkit-5.4.148.jar';
    console.log("Downloading LuckPerms...");
    await download(lpUrl, path.join(__dirname, 'plugins', 'LuckPerms.jar'));
    console.log("✅ Downloaded LuckPerms.jar");
  } catch (e) {
    console.error(e);
  }
}
main();
