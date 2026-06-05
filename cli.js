#!/usr/bin/env node
const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

const PUFFER_URL = process.env.PUFFER_URL;
const PUFFER_SERVER_ID = process.env.PUFFER_SERVER_ID;
const PUFFER_CLIENT_ID = process.env.PUFFER_CLIENT_ID;
const PUFFER_CLIENT_SECRET = process.env.PUFFER_CLIENT_SECRET;
const MINECRAFT_IP = process.env.MINECRAFT_IP || 'localhost';

async function getToken() {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", PUFFER_CLIENT_ID);
  params.append("client_secret", PUFFER_CLIENT_SECRET);
  params.append("scope", "server.files server.view server.console server.power");

  const res = await fetch(`${PUFFER_URL}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to authenticate with PufferPanel");
  return data.access_token;
}

async function pufferFetch(endpoint, options = {}) {
  const token = await getToken();
  const url = `${PUFFER_URL}/proxy/daemon/server/${PUFFER_SERVER_ID}${endpoint}`;
  
  const headers = {
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });
  return res;
}

program
  .name('mc-admin')
  .description('CLI to manage Minecraft Server and Stress Test')
  .version('1.0.0');

program.command('list')
  .description('List files in the server directory')
  .argument('[dir]', 'Directory path to list', '')
  .action(async (dir) => {
    try {
      const res = await pufferFetch(`/file/${dir}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      const files = data.files || [];
      console.log(`\nDirectory listing for /${dir}:\n`);
      files.forEach(f => {
        const type = f.isFile ? 'FILE' : 'DIR ';
        const size = f.isFile ? `${(f.size / 1024).toFixed(1)} KB` : '';
        console.log(`[${type}] ${f.name.padEnd(30)} ${size}`);
      });
      console.log();
    } catch (e) {
      console.error('Error listing files:', e.message);
    }
  });

program.command('download')
  .description('Download a file from the server')
  .argument('<remotePath>', 'Path on the server')
  .argument('[localPath]', 'Local destination path')
  .action(async (remotePath, localPath) => {
    try {
      const dest = localPath || path.basename(remotePath);
      const res = await pufferFetch(`/file/${remotePath}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = await res.arrayBuffer();
      fs.writeFileSync(dest, Buffer.from(buffer));
      console.log(`Successfully downloaded ${remotePath} to ${dest}`);
    } catch (e) {
      console.error('Error downloading file:', e.message);
    }
  });

program.command('upload')
  .description('Upload a file to the server')
  .argument('<localPath>', 'Local file path')
  .argument('[remotePath]', 'Path on the server')
  .action(async (localPath, remotePath) => {
    try {
      const dest = remotePath || path.basename(localPath);
      const buffer = fs.readFileSync(localPath);
      const res = await pufferFetch(`/file/${dest}`, {
        method: 'PUT',
        body: buffer
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      console.log(`Successfully uploaded ${localPath} to ${dest}`);
    } catch (e) {
      console.error('Error uploading file:', e.message);
    }
  });

program.command('stress')
  .description('Spawn Mineflayer bots to stress test the server')
  .option('-b, --bots <number>', 'Number of bots to spawn', '5')
  .option('-h, --host <string>', 'Server IP', MINECRAFT_IP)
  .option('-p, --port <number>', 'Server Port', '25565')
  .action(async (options) => {
    const mineflayer = require('mineflayer');
    const botsCount = parseInt(options.bots, 10);
    const host = options.host;
    const port = parseInt(options.port, 10);

    console.log(`\nSpawning ${botsCount} bots on ${host}:${port}...\n`);

    let bots = [];
    let connected = 0;

    for (let i = 0; i < botsCount; i++) {
      setTimeout(() => {
        const username = `StressBot_${i+1}`;
        console.log(`[Bot ${i+1}] Connecting as ${username}...`);
        
        const bot = mineflayer.createBot({
          host,
          port,
          username,
        });

        bot.on('login', () => {
          console.log(`[Bot ${i+1}] Successfully logged in!`);
          connected++;
          if (connected === botsCount) {
            console.log(`\n✅ All ${botsCount} bots connected successfully! Press Ctrl+C to stop.\n`);
          }
        });

        bot.on('kicked', (reason) => {
          console.log(`[Bot ${i+1}] Kicked:`, JSON.parse(reason).text || reason);
        });

        bot.on('error', (err) => {
          console.log(`[Bot ${i+1}] Error:`, err.message);
        });

        // Make bots jump randomly to simulate load
        setInterval(() => {
          if (bot.entity) {
            bot.setControlState('jump', true);
            bot.setControlState('jump', false);
          }
        }, 5000 + Math.random() * 5000);

        bots.push(bot);
      }, i * 1500); // Stagger joins by 1.5s
    }
  });

program.parse();
