const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '../app/api');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (file === 'route.ts') {
      let content = fs.readFileSync(fullPath, 'utf-8');
      
      // Skip if already locked down
      if (content.includes('verifyAdmin')) continue;

      let newContent = `import { verifyAdmin } from "@/lib/authGuard";\n` + content;

      // Add the check to all exported async functions (GET, POST, DELETE, etc)
      newContent = newContent.replace(/export\s+async\s+function\s+(GET|POST|DELETE|PUT|PATCH)\s*\(\s*(request|req)\s*:\s*NextRequest\s*\)\s*\{/g, (match, method, reqName) => {
        return `${match}\n  const authResult = await verifyAdmin(${reqName});\n  if (authResult instanceof Response) return authResult;\n`;
      });

      fs.writeFileSync(fullPath, newContent, 'utf-8');
      console.log(`Locked down ${fullPath}`);
    }
  }
}

processDir(apiDir);
