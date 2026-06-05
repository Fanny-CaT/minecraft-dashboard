const fs = require('fs');
const filesTabContent = fs.readFileSync('scratch/files_tab.txt', 'utf8');

// The extracted text is like: `{activeTab === "files" && ( ... )}`
// We just want what's inside the `&& (` and `)`
const cleanContent = filesTabContent.substring(filesTabContent.indexOf('(') + 1, filesTabContent.lastIndexOf(')'));

const analyzerContent = `import React from 'react';
export const FilesTabAnalyzer = () => {
  return (
    <>
      ${cleanContent}
    </>
  );
};
`;

fs.writeFileSync('scratch/FilesTabAnalyzer.tsx', analyzerContent);
console.log("Analyzer written.");
