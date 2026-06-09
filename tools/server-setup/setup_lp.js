require('dotenv').config({ path: '.env.local' });

const ROOT = process.env.PUFFER_URL;
const ID = process.env.PUFFER_SERVER_ID;
const CID = process.env.PUFFER_CLIENT_ID;
const CSEC = process.env.PUFFER_CLIENT_SECRET;

async function getToken() {
  const res = await fetch(`${ROOT}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: CID, client_secret: CSEC, scope: "server.console" }).toString(),
  });
  const data = await res.json();
  return data.access_token;
}

async function sendCommand(token, command) {
  const res = await fetch(`${ROOT}/proxy/daemon/server/${ID}/console`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "text/plain" },
    body: command,
  });
  if (!res.ok) console.error(`Failed to send ${command}: ${res.status}`);
}

async function main() {
  const token = await getToken();

  const commands = [
    // DEFAULT
    'lp group default meta setprefix "&8[&7Member&8] &7"',
    'lp group default permission set essentials.spawn true',
    'lp group default permission set essentials.home true',
    'lp group default permission set essentials.sethome true',
    'lp group default permission set essentials.tpa true',
    'lp group default permission set essentials.tpaccept true',
    'lp group default permission set essentials.tpdeny true',
    'lp group default permission set essentials.msg true',
    'lp group default permission set skinrestorer.command.skin true',
    'lp group default permission set skinrestorer.command.skin.set true',
    'lp group default permission set skinrestorer.command.skin.clear true',

    // VIP
    'lp creategroup vip',
    'lp group vip parent add default',
    'lp group vip meta setprefix "&8[&aVIP&8] &a"',
    'lp group vip permission set essentials.hat true',
    'lp group vip permission set essentials.workbench true',

    // MOD
    'lp creategroup mod',
    'lp group mod parent add vip',
    'lp group mod meta setprefix "&8[&9Mod&8] &9"',
    'lp group mod permission set essentials.kick true',
    'lp group mod permission set essentials.mute true',
    'lp group mod permission set essentials.ban true',
    'lp group mod permission set essentials.tempban true',
    'lp group mod permission set essentials.fly true',
    'lp group mod permission set essentials.tp true',
    'lp group mod permission set coreprotect.inspect true',
    'lp group mod permission set coreprotect.lookup true',

    // ADMIN
    'lp creategroup admin',
    'lp group admin parent add mod',
    'lp group admin meta setprefix "&8[&cAdmin&8] &c"',
    'lp group admin permission set essentials.ban.ip true',
    'lp group admin permission set essentials.invsee true',
    'lp group admin permission set essentials.gamemode true',
    'lp group admin permission set coreprotect.* true',
    'lp group admin permission set griefprevention.adminclaims true',

    // OWNER
    'lp creategroup owner',
    'lp group owner meta setprefix "&8[&4Owner&8] &4"',
    'lp group owner permission set * true'
  ];

  for (const cmd of commands) {
    await sendCommand(token, cmd);
    await new Promise(r => setTimeout(r, 200)); // Sleep 200ms between commands so we don't spam the console too fast
  }
  
  console.log("LuckPerms setup complete!");
}

main();
