const https = require('https');
const fs = require('fs');
const path = require('path');

const slugs = ['grim-anticheat', 'coreprotect', 'griefprevention', 'luckperms', 'pvptoggle'];
const destDir = path.join(__dirname, 'plugins');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MinecraftDashboard/1.0' } }, (res) => {
      let data = '';
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(get(res.headers.location));
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'MinecraftDashboard/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(downloadFile(res.headers.location, dest));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  for (const slug of slugs) {
    try {
      console.log(`Fetching versions for ${slug}...`);
      const versions = await get(`https://api.modrinth.com/v2/project/${slug}/version`);
      if (!versions || !versions.length) {
        console.error(`No versions found for ${slug}`);
        continue;
      }
      
      const latest = versions[0];
      const primaryFile = latest.files.find(f => f.primary) || latest.files[0];
      
      console.log(`Downloading ${primaryFile.filename}...`);
      await downloadFile(primaryFile.url, path.join(destDir, primaryFile.filename));
      console.log(`✅ Downloaded ${primaryFile.filename}`);
    } catch (e) {
      console.error(`❌ Failed ${slug}:`, e.message);
    }
  }
}

main();
