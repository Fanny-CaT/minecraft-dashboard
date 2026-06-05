const fs = require('fs');

const content = fs.readFileSync('app/page.tsx', 'utf8');

const startIndex = content.indexOf('{activeTab === "chat" && (');
const endIndexStr = '          {/* ══ FILES ══ */}';
const endIndex = content.indexOf(endIndexStr);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `{activeTab === "chat" && (
            <ChatTab
              chatMessages={chatMessages}
              chatEndRef={chatEndRef}
              sendChat={sendChat}
              isOnline={isOnline}
              chatInput={chatInput}
              setChatInput={setChatInput}
              TabHeader={TabHeader}
            />
          )}

`;

  const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  
  const importIndex = newContent.indexOf('import { ConsoleTab }');
  const finalContent = newContent.substring(0, importIndex) + 'import { ChatTab } from "@/components/tabs/ChatTab";\n' + newContent.substring(importIndex);
  
  fs.writeFileSync('app/page.tsx', finalContent);
  console.log("Successfully replaced Chat tab in app/page.tsx");
} else {
  console.log("Could not find start or end index for chat tab.", startIndex, endIndex);
}
