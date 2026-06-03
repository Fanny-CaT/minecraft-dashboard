const WebSocket = require('ws');

async function get_token() {
    const url = "https://meowtopia-panel.duckdns.org/oauth2/token";
    const data = "grant_type=client_credentials&client_id=028831fc-688b-4811-a1f8-ce7008958cb6&client_secret=nel4nBv8VvSnTog0od8Oy-43045LSEn-jO56MRA9g7ngJwq3";
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: data
    });
    const json = await res.json();
    return json.access_token;
}

const paths = [
    "/proxy/daemon/server/946f16b4/console",
    "/api/servers/946f16b4/console",
    "/api/servers/946f16b4/socket",
    "/api/server/946f16b4/console",
    "/api/servers/946f16b4/ws",
];

async function test_path(token, path) {
    console.log(`\n--- Testing path: ${path} ---`);
    
    // Test 1: ws with query param ?token=
    await new Promise((resolve) => {
        const url = `wss://meowtopia-panel.duckdns.org${path}?token=${token}`;
        const ws = new WebSocket(url);
        ws.on('open', () => {
            console.log(`  [OK] Connected via ?token=`);
            ws.close();
            resolve(true);
        });
        ws.on('error', (err) => {
            console.log(`  [FAIL] ?token= failed:`, err.message);
            resolve(false);
        });
    });

    // Test 2: ws with Auth header
    await new Promise((resolve) => {
        const url = `wss://meowtopia-panel.duckdns.org${path}`;
        const ws = new WebSocket(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        ws.on('open', () => {
            console.log(`  [OK] Connected via Authorization header`);
            ws.close();
            resolve(true);
        });
        ws.on('error', (err) => {
            console.log(`  [FAIL] Auth header failed:`, err.message);
            resolve(false);
        });
    });

    // Test 3: ws with subprotocol
    await new Promise((resolve) => {
        const url = `wss://meowtopia-panel.duckdns.org${path}`;
        const ws = new WebSocket(url, ["bearer", token]);
        ws.on('open', () => {
            console.log(`  [OK] Connected via subprotocol`);
            ws.close();
            resolve(true);
        });
        ws.on('error', (err) => {
            console.log(`  [FAIL] subprotocol failed:`, err.message);
            resolve(false);
        });
    });
}

async function main() {
    const token = await get_token();
    console.log("Token fetched.");
    for (const p of paths) {
        await test_path(token, p);
    }
}

main().catch(console.error);
