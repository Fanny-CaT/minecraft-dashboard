import { pufferFetch } from './lib/pufferpanel';

async function run() {
  const res = await pufferFetch("/dir");
  const data = await res.json();
  console.log(JSON.stringify(data.files.map((f: any) => f.name)));
}
run();
