const fs = require('fs');

const content = fs.readFileSync('app/page.tsx', 'utf8');

const startIndex = content.indexOf('{activeTab === "console" && (');
const endIndexStr = '          {/* ══ CHAT ══ */}';
const endIndex = content.indexOf(endIndexStr);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `{activeTab === "console" && (
            <ConsoleTab
              wsStatus={wsStatus}
              wsMode={wsMode}
              setLogs={setLogs}
              connectWs={connectWs}
              wsAttempts={wsAttempts}
              isOnline={isOnline}
              statusData={statusData}
              ramMb={ramMb}
              maxRamMb={maxRamMb}
              PowerDropdown={PowerDropdown}
              logs={logs}
              consoleEndRef={consoleEndRef}
              sendCommandDirect={sendCommandDirect}
              sendCmd={sendCmd}
              command={command}
              setCommand={setCommand}
              OutlineBtn={OutlineBtn}
            />
          )}

`;

  const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  
  // Also add the import at the top
  const importIndex = newContent.indexOf('import { PluginIcon }');
  const finalContent = newContent.substring(0, importIndex) + 'import { ConsoleTab } from "@/components/tabs/ConsoleTab";\n' + newContent.substring(importIndex);
  
  fs.writeFileSync('app/page.tsx', finalContent);
  console.log("Successfully replaced Console tab in app/page.tsx");
} else {
  console.log("Could not find start or end index for console tab.", startIndex, endIndex);
}
