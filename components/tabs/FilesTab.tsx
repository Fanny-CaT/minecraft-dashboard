import React from "react";
import { Ico } from "@/components/icons";
import { S } from "@/lib/constants";
import { fmtFileSize } from "@/lib/utils";
import { useContextMenu, ContextMenuAction } from "@/components/ui/ContextMenu";
import { FileDown, Edit, Move, Trash2, FolderOpen, FileCog } from "lucide-react";

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
  promptAction: (title: string, label: string, defaultValue?: string) => Promise<string | null>;
  confirmAction: (title: string, message: string) => Promise<boolean>;
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
  doMove,
  promptAction,
  confirmAction
}) => {
  const { showMenu } = useContextMenu();

  const handleContextMenu = (e: React.MouseEvent, file: any) => {
    const actions: ContextMenuAction[] = [];
    if (file.isFile) {
      actions.push({
        label: "Download",
        icon: <FileDown size={14} />,
        color: "#38bdf8",
        onClick: () => downloadFile(file)
      });
      actions.push({ separator: true, label: "", onClick: () => {} });
    }
    
    actions.push(
      {
        label: "Rename",
        icon: <Edit size={14} />,
        color: "#f59e0b",
        onClick: async () => {
          const newName = await promptAction(`Rename ${file.name}`, "Enter new name:", file.name);
          if (newName && newName !== file.name) doRename(file, newName);
        }
      },
      {
        label: "Move",
        icon: <Move size={14} />,
        color: "#a855f7",
        onClick: async () => {
          const defaultPath = currentPath ? `${currentPath}/${file.name}` : file.name;
          const newPath = await promptAction(`Move ${file.name}`, "Enter new destination path:", defaultPath);
          if (newPath && newPath !== defaultPath) doMove(file, newPath);
        }
      },
      { separator: true, label: "", onClick: () => {} },
      {
        label: "Delete",
        icon: <Trash2 size={14} />,
        color: "#ef4444",
        onClick: async () => {
          if (await confirmAction("Delete File", `Are you sure you want to delete ${file.name}?`)) {
            doDelete(file);
          }
        }
      }
    );

    showMenu(e, actions);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%", position: "relative" }}>
      {/* Sleek Glassmorphic Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          background: "linear-gradient(90deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "10px",
            background: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 15px rgba(168, 85, 247, 0.3)"
          }}>
            <FolderOpen size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#fff", margin: 0, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>File Manager</h2>
            <p style={{ fontSize: "12px", color: S.muted, margin: 0 }}>Manage your server files visually</p>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {selectedFile ? (
            <>
              <button
                onClick={saveFileContent}
                disabled={savingFile}
                className="button-hover"
                style={{
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px",
                  fontSize: "13px", fontWeight: 600, cursor: savingFile ? "default" : "pointer",
                  boxShadow: "0 4px 10px rgba(245, 158, 11, 0.3)", opacity: savingFile ? 0.6 : 1
                }}
              >
                {savingFile ? "Saving..." : "Save File"}
              </button>
              <OutlineBtn label="Close Editor" onClick={() => setSelectedFile(null)} />
            </>
          ) : (
            <>
              <button
                onClick={() => { setShowNewFile(true); setShowNewFolder(false); }}
                className="button-hover"
                style={{
                  background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px",
                  fontSize: "13px", fontWeight: 600, cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(59, 130, 246, 0.3)"
                }}
              >
                + File
              </button>
              <button
                onClick={() => { setShowNewFolder(true); setShowNewFile(false); }}
                className="button-hover"
                style={{
                  background: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)",
                  color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px",
                  fontSize: "13px", fontWeight: 600, cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(168, 85, 247, 0.3)"
                }}
              >
                + Folder
              </button>
              <button
                onClick={() => uploadInputRef.current?.click()}
                className="button-hover"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px",
                  fontSize: "13px", fontWeight: 600, cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(16, 185, 129, 0.3)"
                }}
              >
                Upload
              </button>
              <input type="file" ref={uploadInputRef} onChange={handleUpload} style={{ display: "none" }} />
              <OutlineBtn label="Refresh" onClick={() => loadDir(currentPath)} />
            </>
          )}
        </div>
      </div>

      {fileError && (
        <div style={{
          padding: "10px 24px", background: "rgba(239, 68, 68, 0.15)",
          borderBottom: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5",
          fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Trash2 size={16} color="#ef4444" />
            <span>{fileError}</span>
          </div>
          <button onClick={() => setFileError("")} style={{ background: "none", border: "none", color: "#fca5a5", cursor: "pointer", fontSize: "16px" }}>×</button>
        </div>
      )}

      {/* SFTP Credentials Bar */}
      {!selectedFile && (
        <div style={{
          margin: "16px 24px 0", background: "rgba(15, 23, 42, 0.5)",
          border: "1px solid rgba(255,255,255,0.05)", padding: "12px 16px",
          fontSize: "13px", display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: "10px", borderRadius: "8px",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)"
        }}>
          <div>
            <span style={{ color: S.muted, marginRight: "6px" }}>SFTP Host:</span>
            <span style={{ fontFamily: "monospace", color: "#38bdf8", marginRight: "20px", fontWeight: 600 }}>
              {statusData?.sftpHost || "play.meowtopia.mooo.com"}:
              {statusData?.sftpPort || 5657}
            </span>
            <span style={{ color: S.muted, marginRight: "6px" }}>SFTP User:</span>
            <span style={{ fontFamily: "monospace", color: "#fff", fontWeight: 600 }}>
              {statusData?.sftpUsername || `agreeable_guy-946f16b4`}
            </span>
          </div>
          <div style={{ color: S.muted, fontSize: "12px" }}>
            Password: <span style={{ color: "#fff" }}>Use your PufferPanel password</span>
          </div>
        </div>
      )}

      {/* Editor view */}
      {selectedFile && !loadingFile && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 24px", gap: "12px" }}>
          <div style={{ fontSize: "13px", color: S.muted, display: "flex", alignItems: "center", gap: "8px" }}>
            <FileCog size={16} color="#a855f7" />
            Editing: <span style={{ color: "#fff", fontWeight: 600 }}>{selectedFile.name}</span>
            {selectedFile.size !== undefined && (
              <span style={{ marginLeft: "8px", background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "12px", fontSize: "11px" }}>
                {fmtFileSize(selectedFile.size)}
              </span>
            )}
          </div>
          <textarea
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            style={{
              flex: 1, minHeight: "400px", backgroundColor: "#0f111a",
              color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px", padding: "16px",
              fontFamily: "'JetBrains Mono','Consolas',monospace", fontSize: "13px",
              lineHeight: "1.7", resize: "none", outline: "none",
              boxShadow: "inset 0 4px 10px rgba(0,0,0,0.3)"
            }}
          />
        </div>
      )}

      {/* New file/folder inline form */}
      {!selectedFile && (showNewFile || showNewFolder) && (
        <form
          onSubmit={showNewFile ? doNewFile : doNewFolder}
          style={{ padding: "16px 24px 0", display: "flex", gap: "12px", alignItems: "center" }}
        >
          <span style={{ color: "#fff", fontSize: "13px", fontWeight: 500 }}>
            Create {showNewFile ? "File" : "Folder"}:
          </span>
          <input
            type="text"
            placeholder="Enter name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            style={{
              backgroundColor: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff", padding: "8px 12px", fontSize: "13px", outline: "none",
              borderRadius: "6px", width: "250px",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)"
            }}
          />
          <button
            type="submit"
            className="button-hover"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px",
              fontSize: "13px", fontWeight: 600, cursor: "pointer",
            }}
          >
            Create
          </button>
          <OutlineBtn label="Cancel" onClick={() => { setShowNewFile(false); setShowNewFolder(false); setNewName(""); }} />
        </form>
      )}

      {/* Directory listing */}
      {!selectedFile && (
        <div style={{ flex: 1, padding: "16px 24px", overflow: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Breadcrumbs */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#38bdf8", fontWeight: 500 }}>
            <span onClick={() => loadDir("")} style={{ cursor: "pointer" }} className="hover-underline">root</span>
            {pathParts.map((part: any, index: any) => {
              const partialPath = pathParts.slice(0, index + 1).join("/");
              return (
                <React.Fragment key={index}>
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
                  <span onClick={() => loadDir(partialPath)} style={{ cursor: "pointer" }} className="hover-underline">{part}</span>
                </React.Fragment>
              );
            })}
          </div>

          {/* Search + Filter toolbar */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", background: "rgba(15,23,42,0.4)", padding: "8px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <input
              type="text"
              placeholder="🔍 Filter files..."
              value={fileSearchQuery}
              onChange={(e) => { setFileSearchQuery(e.target.value); setSelectedFileNames(new Set()); }}
              style={{
                flex: 1, minWidth: "200px", backgroundColor: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.1)", color: "#fff",
                padding: "8px 12px", fontSize: "13px", outline: "none", borderRadius: "6px",
              }}
            />
            {(["all", "files", "folders"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setFileTypeFilter(t); setSelectedFileNames(new Set()); }}
                style={{
                  padding: "8px 16px", fontSize: "12px", fontWeight: 600,
                  border: `1px solid ${fileTypeFilter === t ? "#a855f7" : "rgba(255,255,255,0.1)"}`,
                  backgroundColor: fileTypeFilter === t ? "rgba(168, 85, 247, 0.15)" : "transparent",
                  color: fileTypeFilter === t ? "#c084fc" : S.muted,
                  cursor: "pointer", borderRadius: "6px", transition: "all 0.2s ease",
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Bulk-selection toolbar */}
          {selectedFileNames.size > 0 && (
            <div
              style={{
                display: "flex", alignItems: "center", gap: "16px", padding: "10px 16px",
                backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "8px", fontSize: "13px",
              }}
            >
              <span style={{ color: "#fff" }}>
                <strong style={{ color: "#fca5a5" }}>{selectedFileNames.size}</strong> item{selectedFileNames.size !== 1 ? "s" : ""} selected
              </span>
              <button
                onClick={doBulkDelete}
                disabled={bulkDeleting}
                className="button-hover"
                style={{
                  backgroundColor: "#ef4444", border: "none", color: "#fff",
                  padding: "6px 14px", fontSize: "12px", fontWeight: 600,
                  cursor: bulkDeleting ? "not-allowed" : "pointer", borderRadius: "6px",
                  opacity: bulkDeleting ? 0.6 : 1, boxShadow: "0 4px 10px rgba(239, 68, 68, 0.3)"
                }}
              >
                {bulkDeleting ? "Deleting..." : "🗑 Delete Selected"}
              </button>
              <button
                onClick={() => setSelectedFileNames(new Set())}
                style={{
                  backgroundColor: "transparent", border: "none", color: S.muted,
                  cursor: "pointer", fontSize: "12px", textDecoration: "underline",
                }}
              >
                Clear selection
              </button>
            </div>
          )}

          {loadingFiles ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px", gap: "16px", color: S.muted }}>
              <div className="spinner" style={{ width: "30px", height: "30px", borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#a855f7" }} />
              <span style={{ fontSize: "14px", fontWeight: 500 }}>Loading directory contents...</span>
            </div>
          ) : (() => {
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
              <div style={{ background: "rgba(15,23,42,0.4)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(255,255,255,0.05)", color: S.muted }}>
                      <th style={{ padding: "12px", width: "40px", textAlign: "center" }}>
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
                          style={{ cursor: "pointer", accentColor: "#a855f7", width: "16px", height: "16px" }}
                        />
                      </th>
                      <th style={{ padding: "12px", fontWeight: 600 }}>File Name</th>
                      <th style={{ padding: "12px", width: "120px", fontWeight: 600 }}>Size</th>
                      <th style={{ padding: "12px", width: "180px", fontWeight: 600 }}>Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPath && (
                      <tr
                        className="tab-hover"
                        onClick={() => { const up = currentPath.split("/").slice(0, -1).join("/"); loadDir(up); }}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", color: "#38bdf8", background: "rgba(56, 189, 248, 0.05)" }}
                      >
                        <td style={{ padding: "12px" }} />
                        <td style={{ padding: "12px", fontWeight: 500 }} colSpan={3}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                            <FolderOpen size={16} /> .. (Go up)
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>–</td>
                      </tr>
                    )}
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: "60px 20px", textAlign: "center" }}>
                          {files.length === 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", color: S.muted }}>
                              <div style={{ background: "rgba(255,255,255,0.05)", padding: "20px", borderRadius: "50%" }}>
                                <FolderOpen size={48} color="rgba(255,255,255,0.2)" />
                              </div>
                              <div>
                                <h3 style={{ margin: "0 0 4px 0", color: "#fff", fontSize: "16px", fontWeight: 600 }}>Empty Directory</h3>
                                <p style={{ margin: 0, fontSize: "13px", maxWidth: "250px" }}>No files or folders found here.</p>
                              </div>
                              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                                <button
                                  onClick={() => setShowNewFile(true)}
                                  className="button-hover"
                                  style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                                >
                                  + New File
                                </button>
                                <button
                                  onClick={() => setShowNewFolder(true)}
                                  className="button-hover"
                                  style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                                >
                                  + New Folder
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ color: S.muted, fontSize: "14px" }}>No files match your search filter.</div>
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
                              borderBottom: "1px solid rgba(255,255,255,0.05)",
                              backgroundColor: isChecked ? "rgba(168, 85, 247, 0.15)" : "transparent",
                              transition: "background 0.2s"
                            }}
                            onContextMenu={(e) => handleContextMenu(e, file)}
                          >
                            <td style={{ padding: "12px", textAlign: "center" }}>
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
                                style={{ cursor: "pointer", accentColor: "#a855f7", width: "16px", height: "16px" }}
                              />
                            </td>
                            <td
                              style={{ padding: "12px", cursor: "pointer", fontWeight: file.isFile ? 400 : 600, color: file.isFile ? "#e2e8f0" : "#fff" }}
                              onClick={() => {
                                if (file.isFile) openFile(file);
                                else loadDir(currentPath ? `${currentPath}/${file.name}` : file.name);
                              }}
                            >
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                                {file.isFile ? <FileCog size={16} color="#94a3b8" /> : <FolderOpen size={16} color="#a855f7" />}
                                {file.name}
                              </span>
                            </td>
                            <td style={{ padding: "12px", color: S.muted }}>
                              {file.isFile ? (
                                <span style={{ background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "12px", fontSize: "11px" }}>
                                  {fmtFileSize(file.size)}
                                </span>
                              ) : "DIR"}
                            </td>
                            <td style={{ padding: "12px", color: S.muted, fontSize: "12px" }}>
                              {file.modifyTime ? new Date(file.modifyTime * 1000).toLocaleString(undefined, {
                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                              }) : "–"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
