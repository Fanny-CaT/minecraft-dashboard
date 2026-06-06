import { getServerDetails, getPanelServerInfo } from "./lib/pufferpanel";
import { config } from "dotenv";
config({ path: ".env.local" }); // or .env

async function run() {
  const details = await getServerDetails();
  console.log("Details:", JSON.stringify(details, null, 2));

  const info = await getPanelServerInfo();
  console.log("Info:", JSON.stringify(info, null, 2));
}

run().catch(console.error);
