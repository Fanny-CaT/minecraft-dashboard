require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const ROOT = process.env.PUFFER_URL;
const ID = process.env.PUFFER_SERVER_ID;
const CID = process.env.PUFFER_CLIENT_ID;
const CSEC = process.env.PUFFER_CLIENT_SECRET;

async function getToken() {
  const res = await fetch(`${ROOT}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: CID, client_secret: CSEC, scope: "server.files server.console" }).toString(),
  });
  return (await res.json()).access_token;
}

const skriptCode = `command /enchants:
    aliases: /ce, /customenchants, /superenchants
    trigger:
        set metadata tag "enchants_gui" of player to chest inventory with 3 rows named "&d&lCustom Enchantments"
        
        set {_glass} to black stained glass pane named " "
        loop 27 times:
            set slot loop-number - 1 of metadata tag "enchants_gui" of player to {_glass}
            
        set slot 10 of metadata tag "enchants_gui" of player to diamond pickaxe named "&a&lVeinminer" with lore "&7Mine entire veins of ore at once!", "", "&e&lHow to obtain:", "&f✨ Enchanting Table", "&f📚 Librarian Villagers", "&f📦 Dungeon Loot"
        
        set slot 12 of metadata tag "enchants_gui" of player to iron axe named "&6&lLumberjack" with lore "&7Chop down entire trees instantly!", "", "&e&lHow to obtain:", "&f✨ Enchanting Table", "&f📚 Librarian Villagers", "&f📦 Dungeon Loot"
        
        set slot 14 of metadata tag "enchants_gui" of player to golden sword named "&c&lIgnite" with lore "&7Set enemies on fire on hit!", "", "&e&lHow to obtain:", "&f✨ Enchanting Table", "&f📚 Librarian Villagers", "&f📦 Dungeon Loot"
        
        set slot 16 of metadata tag "enchants_gui" of player to iron chestplate named "&b&lHeavy Armor" with lore "&7Take less knockback from attacks!", "", "&e&lHow to obtain:", "&f✨ Enchanting Table", "&f📚 Librarian Villagers", "&f📦 Dungeon Loot"
        
        set slot 26 of metadata tag "enchants_gui" of player to barrier named "&c&lClose Menu"
        
        open (metadata tag "enchants_gui" of player) to player

on inventory click:
    if event-inventory = (metadata tag "enchants_gui" of player):
        cancel event
        if index of event-slot is 26:
            close player's inventory
        else if index of event-slot is 10 or 12 or 14 or 16:
            play sound "entity.experience_orb.pickup" with volume 0.5 and pitch 1 at player
`;

async function main() {
  const token = await getToken();
  
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/file/plugins/Skript/scripts/enchants.sk`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body: skriptCode
  });
  
  console.log("Uploaded enchants.sk!");
  
  await fetch(`${ROOT}/proxy/daemon/server/${ID}/console`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: "sk reload enchants\n"
  });
}

main().catch(console.error);
