const fs = require('fs');

// 1. Fix FilesTab.tsx
let filesTab = fs.readFileSync('components/tabs/FilesTab.tsx', 'utf8');

// Replace old incorrect props with new correct props in the interface
filesTab = filesTab.replace('  setEditingFileContent: any;', '  fileContent: any;\n  setFileContent: any;');
filesTab = filesTab.replace('  editingFileContent: any;', '');
filesTab = filesTab.replace('  saveFile: any;', '  saveFileContent: any;\n  savingFile: any;\n  setSelectedFile: any;\n  uploadInputRef: any;\n  handleUpload: any;\n  fileError: any;\n  setFileError: any;\n  statusData: any;\n  loadingFile: any;\n  openFile: any;');

// Replace in the arguments list
filesTab = filesTab.replace('  setEditingFileContent,', '  fileContent,\n  setFileContent,');
filesTab = filesTab.replace('  editingFileContent,\n', '');
filesTab = filesTab.replace('  saveFile,', '  saveFileContent,\n  savingFile,\n  setSelectedFile,\n  uploadInputRef,\n  handleUpload,\n  fileError,\n  setFileError,\n  statusData,\n  loadingFile,\n  openFile,');

// Also suppress implicit any errors
filesTab = filesTab.replace(/part, index/g, 'part: any, index: any');
filesTab = filesTab.replace(/\(f\) =>/g, '(f: any) =>');
filesTab = filesTab.replace(/\(n\) =>/g, '(n: any) =>');
filesTab = filesTab.replace(/\(prev\) =>/g, '(prev: any) =>');
filesTab = filesTab.replace(/\(file\) =>/g, '(file: any) =>');

fs.writeFileSync('components/tabs/FilesTab.tsx', filesTab);

// 2. Fix app/page.tsx
let page = fs.readFileSync('app/page.tsx', 'utf8');

page = page.replace('setEditingFileContent={setEditingFileContent}', 'fileContent={fileContent}\n              setFileContent={setFileContent}');
page = page.replace('editingFileContent={editingFileContent}\n', '');
page = page.replace('saveFile={saveFile}', 'saveFileContent={saveFileContent}\n              savingFile={savingFile}\n              setSelectedFile={setSelectedFile}\n              uploadInputRef={uploadInputRef}\n              handleUpload={handleUpload}\n              fileError={fileError}\n              setFileError={setFileError}\n              statusData={statusData}\n              loadingFile={loadingFile}\n              openFile={openFile}');

fs.writeFileSync('app/page.tsx', page);
console.log("Fixed props.");
