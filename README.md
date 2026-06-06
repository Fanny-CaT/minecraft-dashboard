# Minecraft Admin Dashboard

A modern, fast, and fully-featured Minecraft Server Management Dashboard built with Next.js, React, and Firebase. This dashboard acts as an elevated frontend connecting to a PufferPanel backend, allowing seamless control over your Minecraft servers.

## Features

- **Real-Time Status:** Monitor CPU, RAM, and Server Status in real time.
- **Console & Chat:** Send commands via live console and manage the in-game chat.
- **File Manager:** Full filesystem access with native code editing, file uploads, and downloads.
- **Player Management:** Comprehensive tools for whitelists, ops, bans, and live player data tampering (Gamemodes, XP, Inventory).
- **Software Management:** Easily switch between server software (Paper, Purpur, Spigot, Vanilla).
- **Server Settings:** Modify `server.properties` and PufferPanel daemon variables right from the UI.
- **CLI Tool:** Includes a native `cli.js` tool to manage files and stress-test your server using Mineflayer bots!

## Tech Stack

- Next.js (App Router)
- React 19
- Firebase (Auth & Firestore)
- PufferPanel API (Backend integration)
- TailwindCSS (Styling)

## Setup and Deployment

### 1. Vercel Deployment (Recommended)
This dashboard is optimized for Vercel. 
1. Push this repository to GitHub.
2. Link the repository to your Vercel account.
3. Configure the following Environment Variables in Vercel:

```env
PUFFER_URL=your_pufferpanel_url
PUFFER_SERVER_ID=your_server_id
PUFFER_CLIENT_ID=your_oauth_client_id
PUFFER_CLIENT_SECRET=your_oauth_client_secret
```

### 2. Local Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Setup your `.env.local` with the above variables.
4. Run the development server: `npm run dev`

### 3. CLI Tool Usage
You can run the bundled CLI tool directly on your server VM:
```bash
node cli.js --help
node cli.js stress -b 5 -h your_server_ip
node cli.js list /
```

## Copyright & License

Copyright (c) 2026 Fanny-CaT. All Rights Reserved.
Licensed under the MIT License.
