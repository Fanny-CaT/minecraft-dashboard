const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/home/c7/Downloads/mcmyadmin-panel-log-export-2026-06-06T08-48-36.json', 'utf8'));

for (const entry of data) {
  if (entry.responseStatusCode && entry.responseStatusCode !== 200) {
    console.log(`Status ${entry.responseStatusCode} on ${entry.requestPath}`);
  }
  if (entry.level === 'error' || entry.message?.toLowerCase().includes('error')) {
    console.log(`Error: ${entry.message}`);
  }
}
