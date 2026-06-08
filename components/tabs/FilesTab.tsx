import React from "react";
import { Ico } from "@/components/icons";
import { S } from "@/lib/constants";
import { fmtFileSize } from "@/lib/utils";

interface FilesTabProps {
  TabHeader: any;
  loadDir: any;
  fileContent: any;
  setFileContent: any;
  OutlineBtn: any;
  selectedFile: any;

  saveFileContent: any;
  savingFile: any;
  setSelectedFile: any;
  uploadInputRef: any;
  handleUpload: any;
  fileError: any;
  setFileError: any;
  statusData: any;
  loadingFile: any;
  openFile: any;
  showNewFile: any;
  showNewFolder: any;
  doNewFile: any;
  doNewFolder: any;
  newName: any;
  setNewName: any;
  Btn: any;
  setShowNewFile: any;
  setShowNewFolder: any;
  pathParts: any;
  fileSearchQuery: any;
  setFileSearchQuery: any;
  setSelectedFileNames: any;
  setFileTypeFilter: any;
  fileTypeFilter: any;
  selectedFileNames: any;
  doBulkDelete: any;
  bulkDeleting: any;
  loadingFiles: any;
  files: any;
  currentPath: any;
  fmtFileSize: any;
  downloadFile: any;
  doDelete: any;
  doRename: (file: any, newName: string) => void;
  doMove: (file: any, newPath: string) => void;
}


export const FilesTab: React.FC<FilesTabProps> = ({
  TabHeader,
  loadDir,
  fileContent,
  setFileContent,
  OutlineBtn,
  selectedFile,
  saveFileContent,
  savingFile,
  setSelectedFile,
  uploadInputRef,
  handleUpload,
  fileError,
  setFileError,
  statusData,
  loadingFile,
  openFile,
  showNewFile,
  showNewFolder,
  doNewFile,
  doNewFolder,
  newName,
  setNewName,
  Btn,
  setShowNewFile,
  setShowNewFolder,
  pathParts,
  fileSearchQuery,
  setFileSearchQuery,
  setSelectedFileNames,
  setFileTypeFilter,
  fileTypeFilter,
  selectedFileNames,
  doBulkDelete,
  bulkDeleting,
  loadingFiles,
  files,
  currentPath,
  fmtFileSize,
  downloadFile,
  doDelete,
  doRename,
  doMove
}) => {
  return (
    <>
      
            <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%" }}>
              {/* ── Header bar ── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "13px 20px 11px",
                  borderBottom: `1px solid ${S.border}`,
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Ico.Files />
                  <span style={{ fontSize: "18px", fontWeight: 300 }}>Files Manager</span>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {selectedFile ? (
                    <>
                      <Btn
                        label={savingFile ? "Saving..." : "Save File"}
                        color={S.orange}
                        onClick={saveFileContent}
                        disabled={savingFile}
                      />
                      <OutlineBtn label="Close Editor" onClick={() => setSelectedFile(null)} />
                    </>
                  ) : (
                    <>
                      <Btn
                        label="New File"
                        color={S.cyan}
                        onClick={() => {
                          setShowNewFile(true);
                          setShowNewFolder(false);
                        }}
                      />
                      <Btn
                        label="New Folder"
                        color={S.purple}
                        onClick={() => {
                          setShowNewFolder(true);
                          setShowNewFile(false);
                        }}
                      />
                      <Btn
                        label="Upload File"
                        color={S.green}
                        onClick={() => uploadInputRef.current?.click()}
                      />
                      <input
                        type="file"
                        ref={uploadInputRef}
                        onChange={handleUpload}
                        style={{ display: "none" }}
                      />
                      <OutlineBtn label="Refresh" onClick={() => loadDir(currentPath)} />
                    </>
                  )}
                </div>
              </div>

              {fileError && (
                <div
                  style={{
                    padding: "7px 18px",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    borderBottom: `1px solid rgba(239, 68, 68, 0.3)`,
                    color: S.red,
                    fontSize: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{fileError}</span>
                  <button
                    onClick={() => setFileError("")}
                    style={{ background: "none", border: "none", color: S.red, cursor: "pointer" }}
                  >
                    ×
                  </button>
                </div>
              )}

              {/* ── SFTP Credentials Bar ── */}
              {!selectedFile && (
                <div
                  style={{
                    margin: "14px 18px 0",
                    backgroundColor: S.content,
                    border: `1px solid ${S.border}`,
                    padding: "10px 14px",
                    fontSize: "12.5px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                    borderRadius: "3px",
                  }}
                >
                  <div>
                    <span style={{ color: S.muted, marginRight: "4px" }}>SFTP Host:</span>
                    <span style={{ fontFamily: "monospace", color: S.cyan, marginRight: "16px" }}>
                      {statusData?.sftpHost || "play.meowtopia.mooo.com"}:
                      {statusData?.sftpPort || 5657}
                    </span>
                    <span style={{ color: S.muted, marginRight: "4px" }}>SFTP User:</span>
                    <span style={{ fontFamily: "monospace", color: S.white }}>
                      {statusData?.sftpUsername || `agreeable_guy-946f16b4`}
                    </span>
                  </div>
                  <div style={{ color: S.muted, fontSize: "11.5px" }}>
                    Password: <span style={{ color: S.white }}>Use your PufferPanel password</span>
                  </div>
                </div>
              )}

              {/* ── Editor ── */}
              {selectedFile && !loadingFile && (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    padding: "14px 18px",
                    gap: "10px",
                  }}
                >
                  <div style={{ fontSize: "12px", color: S.muted }}>
                    Editing: <span style={{ color: S.white }}>{selectedFile.name}</span>
                    {selectedFile.size !== undefined && (
                      <span style={{ marginLeft: "8px" }}>({fmtFileSize(selectedFile.size)})</span>
                    )}
                  </div>
                  <textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    style={{
                      flex: 1,
                      minHeight: "400px",
                      backgroundColor: S.bg,
                      color: "#ccc",
                      border: `1px solid ${S.border}`,
                      padding: "10px",
                      fontFamily: "'Consolas','Courier New',monospace",
                      fontSize: "12.5px",
                      lineHeight: "1.6",
                      resize: "none",
                      outline: "none",
                    }}
                  />
                </div>
              )}

              {/* ── New file / folder inline form ── */}
              {!selectedFile && (showNewFile || showNewFolder) && (
                <form
                  onSubmit={showNewFile ? doNewFile : doNewFolder}
                  style={{
                    padding: "14px 18px 0",
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: S.white, fontSize: "12px" }}>
                    Create {showNewFile ? "File" : "Folder"}:
                  </span>
                  <input
                    type="text"
                    placeholder="Enter name..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{
                      backgroundColor: S.input,
                      border: `1px solid ${S.inputBdr}`,
                      color: S.white,
                      padding: "5px 10px",
                      fontSize: "12.5px",
                      outline: "none",
                    }}
                  />
                  <Btn label="Create" color={S.orange} onClick={() => {}} />
                  <OutlineBtn
                    label="Cancel"
                    onClick={() => {
                      setShowNewFile(false);
                      setShowNewFolder(false);
                      setNewName("");
                    }}
                  />
                </form>
              )}

              {/* ── Directory listing ── */}
              {!selectedFile && (
                <div style={{ flex: 1, padding: "14px 18px", overflow: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>

                  {/* Breadcrumbs */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: S.cyan }}>
                    <span onClick={() => loadDir("")} style={{ cursor: "pointer", textDecoration: "underline" }}>root</span>
                    {pathParts.map((part: any, index: any) => {
                      const partialPath = pathParts.slice(0, index + 1).join("/");
                      return (
                        <React.Fragment key={index}>
                          <span style={{ color: S.muted }}>/</span>
                          <span onClick={() => loadDir(partialPath)} style={{ cursor: "pointer", textDecoration: "underline" }}>{part}</span>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* ── Search + Filter toolbar ── */}
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      placeholder="🔍 Filter files..."
                      value={fileSearchQuery}
                      onChange={(e) => { setFileSearchQuery(e.target.value); setSelectedFileNames(new Set()); }}
                      style={{
                        flex: 1,
                        minWidth: "160px",
                        backgroundColor: S.input,
                        border: `1px solid ${S.inputBdr}`,
                        color: S.white,
                        padding: "5px 10px",
                        fontSize: "12.5px",
                        outline: "none",
                        borderRadius: "3px",
                      }}
                    />
                    {(["all", "files", "folders"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => { setFileTypeFilter(t); setSelectedFileNames(new Set()); }}
                        style={{
                          padding: "5px 12px",
                          fontSize: "11.5px",
                          border: `1px solid ${fileTypeFilter === t ? S.cyan : S.border}`,
                          backgroundColor: fileTypeFilter === t ? "rgba(0,200,220,0.12)" : "transparent",
                          color: fileTypeFilter === t ? S.cyan : S.muted,
                          cursor: "pointer",
                          borderRadius: "3px",
                          transition: "all 0.15s",
                        }}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* ── Bulk-selection toolbar (shown when ≥1 selected) ── */}
                  {selectedFileNames.size > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "7px 12px",
                        backgroundColor: "rgba(200,80,80,0.08)",
                        border: `1px solid rgba(200,80,80,0.3)`,
                        borderRadius: "3px",
                        fontSize: "12.5px",
                      }}
                    >
                      <span style={{ color: S.white }}>
                        <strong style={{ color: "#e07070" }}>{selectedFileNames.size}</strong> item{selectedFileNames.size !== 1 ? "s" : ""} selected
                      </span>
                      <button
                        onClick={doBulkDelete}
                        disabled={bulkDeleting}
                        style={{
                          backgroundColor: "#7a2020",
                          border: "1px solid #aa3333",
                          color: "#ffaaaa",
                          padding: "4px 12px",
                          fontSize: "11.5px",
                          cursor: bulkDeleting ? "not-allowed" : "pointer",
                          borderRadius: "3px",
                          opacity: bulkDeleting ? 0.6 : 1,
                        }}
                      >
                        {bulkDeleting ? "Deleting..." : "🗑 Delete Selected"}
                      </button>
                      <button
                        onClick={() => setSelectedFileNames(new Set())}
                        style={{
                          backgroundColor: "transparent",
                          border: "none",
                          color: S.muted,
                          cursor: "pointer",
                          fontSize: "11.5px",
                          textDecoration: "underline",
                        }}
                      >
                        Clear selection
                      </button>
                    </div>
                  )}

                  {loadingFiles ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "50px", gap: "12px", color: S.muted }}>
                      <div className="spinner" />
                      <span>Loading directory contents...</span>
                    </div>
                  ) : (() => {
                    // Apply search + type filter
                    const q = fileSearchQuery.trim().toLowerCase();
                    const filtered = files.filter((f: any) => {
                      if (fileTypeFilter === "files" && !f.isFile) return false;
                      if (fileTypeFilter === "folders" && f.isFile) return false;
                      if (q && !f.name.toLowerCase().includes(q)) return false;
                      return true;
                    });
                    const allNames = filtered.map((f: any) => f.name);
                    const allSelected = allNames.length > 0 && allNames.every((n: any) => selectedFileNames.has(n));
                    const someSelected = !allSelected && allNames.some((n: any) => selectedFileNames.has(n));

                    return (
                      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${S.border}`, color: S.muted }}>
                            <th style={{ padding: "8px 6px", width: "32px" }}>
                              <input
                                type="checkbox"
                                checked={allSelected}
                                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                onChange={() => {
                                  if (allSelected) {
                                    setSelectedFileNames((prev: any) => {
                                      const next = new Set(prev);
                                      allNames.forEach((n: any) => next.delete(n));
                                      return next;
                                    });
                                  } else {
                                    setSelectedFileNames((prev: any) => new Set([...prev, ...allNames]));
                                  }
                                }}
                                style={{ cursor: "pointer", accentColor: S.cyan }}
                              />
                            </th>
                            <th style={{ padding: "8px 6px" }}>File Name</th>
                            <th style={{ padding: "8px 6px", width: "100px" }}>Size</th>
                            <th style={{ padding: "8px 6px", width: "160px" }}>Modified</th>
                            <th style={{ padding: "8px 6px", width: "150px", textAlign: "right" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentPath && (
                            <tr
                              className="tab-hover"
                              onClick={() => { const up = currentPath.split("/").slice(0, -1).join("/"); loadDir(up); }}
                              style={{ borderBottom: `1px solid ${S.border}`, cursor: "pointer", color: S.cyan }}
                            >
                              <td style={{ padding: "9px 6px" }} />
                              <td style={{ padding: "9px 6px" }} colSpan={3}>📁 .. (Go up)</td>
                              <td style={{ padding: "9px 6px" }}>–</td>
                            </tr>
                          )}
                          {filtered.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ padding: "40px 20px", textAlign: "center" }}>
                                {files.length === 0 ? (
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: S.muted }}>
                                    <div style={{ fontSize: "40px", opacity: 0.5 }}>📂</div>
                                    <h3 style={{ margin: 0, color: S.white, fontSize: "16px", fontWeight: "bold" }}>This directory is empty</h3>
                                    <p style={{ margin: 0, fontSize: "13px", maxWidth: "250px" }}>There are no files or folders here. You can create a new file to get started.</p>
                                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                                      <Btn label="New File" color={S.cyan} onClick={() => setShowNewFile(true)} />
                                      <OutlineBtn label="New Folder" onClick={() => setShowNewFolder(true)} />
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ color: S.muted, fontSize: "13px" }}>No files match your search filter.</div>
                                )}
                              </td>
                            </tr>
                          ) : (
                            filtered.map((file: any) => {
                              const isChecked = selectedFileNames.has(file.name);
                              return (
                                <tr
                                  key={file.name}
                                  className="tab-hover"
                                  style={{
                                    borderBottom: `1px solid ${S.border}`,
                                    backgroundColor: isChecked ? "rgba(0,200,220,0.05)" : undefined,
                                  }}
                                >
                                  {/* Checkbox */}
                                  <td style={{ padding: "9px 6px" }}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        setSelectedFileNames((prev: any) => {
                                          const next = new Set(prev);
                                          if (isChecked) next.delete(file.name); else next.add(file.name);
                                          return next;
                                        });
                                      }}
                                      style={{ cursor: "pointer", accentColor: S.cyan }}
                                    />
                                  </td>
                                  {/* Name */}
                                  <td
                                    style={{ padding: "9px 6px", cursor: "pointer", fontWeight: file.isFile ? "normal" : "bold" }}
                                    onClick={() => {
                                      if (file.isFile) openFile(file);
                                      else loadDir(currentPath ? `${currentPath}/${file.name}` : file.name);
                                    }}
                                  >
                                    {file.isFile ? "📄" : "📁"} {file.name}
                                  </td>
                                  {/* Size */}
                                  <td style={{ padding: "9px 6px", color: S.muted }}>
                                    {file.isFile ? fmtFileSize(file.size) : "DIR"}
                                  </td>
                                  {/* Modified */}
                                  <td style={{ padding: "9px 6px", color: S.muted }}>
                                    {file.modifyTime ? new Date(file.modifyTime * 1000).toLocaleString() : "–"}
                                  </td>
                                  {/* Actions */}
                                  <td style={{ padding: "9px 6px", textAlign: "right", display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                    {file.isFile && (
                                      <button
                                        onClick={() => downloadFile(file)}
                                        className="button-hover"
                                        style={{ backgroundColor: "transparent", color: S.cyan, border: "none", cursor: "pointer", fontSize: "11px", textDecoration: "underline" }}
                                      >
                                        Download
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        const newName = window.prompt(`Enter new name for ${file.name}:`, file.name);
                                        if (newName && newName !== file.name) doRename(file, newName);
                                      }}
                                      className="button-hover"
                                      style={{ backgroundColor: "transparent", color: S.orange, border: "none", cursor: "pointer", fontSize: "11px", textDecoration: "underline" }}
                                    >
                                      Rename
                                    </button>
                                    <button
                                      onClick={() => {
                                        const defaultPath = currentPath ? `${currentPath}/${file.name}` : file.name;
                                        const newPath = window.prompt(`Enter new destination path for ${file.name}:`, defaultPath);
                                        if (newPath && newPath !== defaultPath) doMove(file, newPath);
                                      }}
                                      className="button-hover"
                                      style={{ backgroundColor: "transparent", color: S.purple, border: "none", cursor: "pointer", fontSize: "11px", textDecoration: "underline" }}
                                    >
                                      Move
                                    </button>
                                    <button
                                      onClick={() => doDelete(file)}
                                      className="button-hover"
                                      style={{ backgroundColor: "transparent", color: "#aa4444", border: "none", cursor: "pointer", fontSize: "11px", textDecoration: "underline" }}
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              )}
            </div>
    </>
  );
};
