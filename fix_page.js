const fs = require('fs');
const content = fs.readFileSync('app/page.tsx', 'utf8');
const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.includes('// ─── Types ────────'));
const endIdx = lines.findIndex(l => l.includes('// ─── Main Component ────────'));

// Since the comments have a lot of dashes, let's use a simpler match
const start = lines.findIndex(l => l.startsWith('// ─── Types '));
const end = lines.findIndex(l => l.startsWith('// ─── Main Component '));

if (start !== -1 && end !== -1) {
  const imports = `import { StatusData, FileEntry, PlayerEntry, Tab, Toast } from "@/lib/types";
import { S, POPULAR_PLUGINS_META } from "@/lib/constants";
import { Ico } from "@/components/icons";
import { BarChart } from "@/components/BarChart";
import { PluginIcon } from "@/components/PluginIcon";
`;
  lines.splice(start, end - start, imports);
  fs.writeFileSync('app/page.tsx', lines.join('\n'));
  console.log("Successfully replaced imports in app/page.tsx");
} else {
  console.log("Could not find start or end index.", start, end);
}
