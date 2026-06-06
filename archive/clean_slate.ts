import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { pufferFetch } from './lib/pufferpanel';

async function run() {
  try {
    const res = await pufferFetch("/dir");
    const data = await res.json();
    const files = data.files.map((f: any) => f.name);
    
    console.log("Found files:", files);
    
    const toDelete = ["world", "world_nether", "world_the_end", "logs", "crash-reports", "usercache.json", "banned-ips.json", "banned-players.json", "ops.json", "whitelist.json", "plugins"];
    
    for (const file of files) {
      if (toDelete.includes(file)) {
        console.log(`Deleting ${file}...`);
        await pufferFetch(`/file/${file}`, { method: "DELETE" });
      }
    }
    console.log("Done.");
  } catch(e) {
    console.error(e);
  }
}
run();
