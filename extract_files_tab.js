const fs = require('fs');
const content = fs.readFileSync('app/page.tsx', 'utf8');

const startIndex = content.indexOf('{activeTab === "files" && (');
const endIndexStr = '          {/* ══ PLUGINS ══ */}';
const endIndex = content.indexOf(endIndexStr);

if (startIndex !== -1 && endIndex !== -1) {
  const extracted = content.substring(startIndex, endIndex);
  if (!fs.existsSync('scratch')) fs.mkdirSync('scratch');
  fs.writeFileSync('scratch/files_tab.txt', extracted);
  console.log("Successfully extracted files tab to scratch/files_tab.txt");
} else {
  console.log("Could not find start or end index for files tab.");
}
