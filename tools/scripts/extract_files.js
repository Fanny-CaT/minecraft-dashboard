const fs = require('fs');

const content = fs.readFileSync('app/page.tsx', 'utf8');

const startIndex = content.indexOf('{activeTab === "files" && (');
const endIndexStr = '          {/* ══ PLUGINS ══ */}';
const endIndex = content.indexOf(endIndexStr);

if (startIndex !== -1 && endIndex !== -1) {
  const extracted = content.substring(startIndex, endIndex);

  // All dependencies needed by FilesTab
  const dependencies = [
    "TabHeader", "Ico", "loadDir", "S", "setEditingFileContent", 
    "OutlineBtn", "React", "selectedFile", "editingFileContent", 
    "saveFile", "closeFile", "showNewFile", "showNewFolder", 
    "doNewFile", "doNewFolder", "newName", "setNewName", 
    "Btn", "setShowNewFile", "setShowNewFolder", "pathParts", 
    "fileSearchQuery", "setFileSearchQuery", "setSelectedFileNames", 
    "setFileTypeFilter", "fileTypeFilter", "selectedFileNames", 
    "doBulkDelete", "bulkDeleting", "loadingFiles", "files", 
    "currentPath", "fmtFileSize", "downloadFile", "doDelete"
  ].filter(d => d !== "React" && d !== "Ico" && d !== "S");

  // Generate Props interface
  let propsInterface = `interface FilesTabProps {\n`;
  dependencies.forEach(d => {
    propsInterface += `  ${d}: any;\n`; // use any for now to keep it simple, we can refine later or let user refine
  });
  propsInterface += `}\n`;

  let componentCode = `import React from "react";
import { Ico } from "@/components/icons";
import { S } from "@/lib/constants";
import { fmtFileSize } from "@/lib/utils";

${propsInterface}

export const FilesTab: React.FC<FilesTabProps> = ({
  ${dependencies.join(',\n  ')}
}) => {
  return (
    <>
      ${extracted.trim().replace(/^\{activeTab === "files" && \(/, '').replace(/\)$/, '')}
    </>
  );
};
`;

  fs.writeFileSync('components/tabs/FilesTab.tsx', componentCode);

  let propsPassed = ``;
  dependencies.forEach(d => {
    propsPassed += `              ${d}={${d}}\n`;
  });

  const replacement = `{activeTab === "files" && (
            <FilesTab
${propsPassed}            />
          )}

`;

  const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  
  const importIndex = newContent.indexOf('import { ChatTab }');
  const finalContent = newContent.substring(0, importIndex) + 'import { FilesTab } from "@/components/tabs/FilesTab";\n' + newContent.substring(importIndex);
  
  fs.writeFileSync('app/page.tsx', finalContent);
  console.log("Successfully extracted FilesTab");
} else {
  console.log("Could not find boundaries.");
}
