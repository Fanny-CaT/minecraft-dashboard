require('dotenv').config({ path: '.env.local' });
const Client = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');

const sftp = new Client();

async function main() {
  const host = process.env.MINECRAFT_IP || 'play.meowtopia.mooo.com';
  // PufferPanel's default SFTP port is usually 5657
  const port = 5657; 
  
  // Format is email|server_id
  const email = process.env.PUFFER_SFTP_EMAIL;
  const password = process.env.PUFFER_SFTP_PASSWORD;
  const serverId = process.env.PUFFER_SERVER_ID || '946f16b4';

  if (!email || !password) {
    console.error("❌ Missing SFTP Credentials!");
    console.error("Please add the following to your .env.local file:");
    console.error("PUFFER_SFTP_EMAIL=your_pufferpanel_email@example.com");
    console.error("PUFFER_SFTP_PASSWORD=your_pufferpanel_password");
    process.exit(1);
  }

  const username = `${email}|${serverId}`;
  const localDir = path.join(__dirname, '../server_files');
  
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }

  try {
    console.log(`🔌 Connecting to SFTP at ${host}:${port}...`);
    console.log(`👤 Username: ${username}`);
    
    await sftp.connect({
      host,
      port,
      username,
      password,
      readyTimeout: 10000,
      // PufferPanel SFTP doesn't always support modern algos, so let's be safe
      algorithms: {
        serverHostKey: ['ssh-ed25519', 'ecdsa-sha2-nistp256', 'ecdsa-sha2-nistp384', 'ecdsa-sha2-nistp521', 'rsa-sha2-512', 'rsa-sha2-256', 'ssh-rsa']
      }
    });

    console.log("✅ Connected successfully!");
    
    const remoteLogs = '/logs/latest.log';
    const localLogs = path.join(localDir, 'latest.log');
    
    console.log(`📥 Downloading latest.log to analyze plugin failures...`);
    await sftp.fastGet(remoteLogs, localLogs);
    console.log(`✅ Downloaded server log successfully.`);

    console.log(`📥 Downloading plugins directory...`);
    const remotePlugins = '/plugins';
    const localPlugins = path.join(localDir, 'plugins');
    
    if (!fs.existsSync(localPlugins)) fs.mkdirSync(localPlugins, { recursive: true });
    
    // Download the entire plugins directory
    await sftp.downloadDir(remotePlugins, localPlugins);
    console.log(`✅ Downloaded all plugins successfully.`);
    
    console.log(`\n🎉 SFTP Sync complete. Server files are now located in: ${localDir}`);
    
  } catch (err) {
    console.error("❌ SFTP Error:", err.message);
  } finally {
    await sftp.end();
  }
}

main();
