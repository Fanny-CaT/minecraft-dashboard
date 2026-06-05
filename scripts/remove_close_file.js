const fs = require('fs');

let page = fs.readFileSync('app/page.tsx', 'utf8');
page = page.replace('              closeFile={closeFile}\n', '');
fs.writeFileSync('app/page.tsx', page);

let filesTab = fs.readFileSync('components/tabs/FilesTab.tsx', 'utf8');
filesTab = filesTab.replace('  closeFile,\n', '');
fs.writeFileSync('components/tabs/FilesTab.tsx', filesTab);

console.log("Removed closeFile");
