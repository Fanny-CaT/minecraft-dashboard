const fs = require('fs');
const content = fs.readFileSync('app/page.tsx', 'utf8');
const lines = content.split('\n');

const importIdx = lines.findIndex(l => l.includes('import { PluginIcon }'));
if (importIdx !== -1) {
  lines.splice(importIdx + 1, 0, 'import { fmtMb, fmtFileSize, stripAnsi, CHAT_RE } from "@/lib/utils";');
  fs.writeFileSync('app/page.tsx', lines.join('\n'));
  console.log("Successfully added utils import to app/page.tsx");
} else {
  console.log("Could not find import statement.");
}
