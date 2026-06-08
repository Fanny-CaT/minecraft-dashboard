import React from "react";
import { S } from "@/lib/constants";
import { Archive } from "lucide-react";

export function BackupsTab({
  creatingBackup,
  createBackup,
  loadingBackups,
  backups,
  fmtFileSize,
  restoreBackup,
  restoringBackup,
  deleteBackup,
  Btn,
}: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%" }}>
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
          <Archive size={24} />
          <span style={{ fontSize: "18px", fontWeight: 300 }}>Backup Manager</span>
        </div>
        <div>
          <Btn
            label={creatingBackup ? "Creating ZIP backup..." : "Create Backup Now"}
            color={S.orange}
            onClick={createBackup}
            disabled={creatingBackup || loadingBackups}
          />
        </div>
      </div>

      {creatingBackup && (
        <div style={{ padding: "12px 18px", backgroundColor: "#202020", color: S.orange, borderBottom: `1px solid ${S.border}`, fontSize: "12.5px" }}>
          ⏳ Creating backup ZIP archive... This process packages all server root files (excluding backups/) and runs asynchronously on PufferPanel.
        </div>
      )}

      <div style={{ flex: 1, padding: "18px", overflow: "auto" }}>
        {loadingBackups ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "50px", gap: "12px", color: S.muted }}>
            <div className="spinner" />
            <span>Loading backup zip archives list...</span>
          </div>
        ) : backups.length === 0 ? (
          <div
            style={{
              border: `1px solid ${S.border}`,
              backgroundColor: S.content,
              padding: "30px 20px",
              textAlign: "center",
              color: S.muted,
              borderRadius: "3px",
            }}
          >
            <div style={{ fontSize: "14px", color: S.white, marginBottom: "8px" }}>
              No Backups Created Yet
            </div>
            <div style={{ fontSize: "12px", marginBottom: "16px" }}>
              Store secure copy backups of your Minecraft world, configuration, and plugins.
            </div>
            <Btn
              label={creatingBackup ? "Creating..." : "Create World Backup"}
              color={S.orange}
              onClick={createBackup}
              disabled={creatingBackup}
            />
          </div>
        ) : (
          <div
            style={{
              border: `1px solid ${S.border}`,
              backgroundColor: S.content,
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "12px 14px", fontSize: "13px", fontWeight: "bold", borderBottom: `1px solid ${S.border}`, color: S.white }}>
              Available Backup Archives (.zip)
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${S.border}`, backgroundColor: S.content, color: S.muted }}>
                  <th style={{ padding: "10px 14px" }}>Archive Filename</th>
                  <th style={{ padding: "10px 14px", width: "120px" }}>Size</th>
                  <th style={{ padding: "10px 14px", width: "180px" }}>Created</th>
                  <th style={{ padding: "10px 14px", width: "200px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup: any) => (
                  <tr key={backup.name} className="tab-hover" style={{ borderBottom: `1px solid ${S.border}` }}>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", color: S.cyan }}>
                      💾 {backup.name}
                    </td>
                    <td style={{ padding: "10px 14px", color: S.white }}>
                      {fmtFileSize(backup.size)}
                    </td>
                    <td style={{ padding: "10px 14px", color: S.muted }}>
                      {new Date(backup.modifyTime * 1000).toLocaleString()}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => restoreBackup(backup.name)}
                        disabled={restoringBackup !== null}
                        className="button-hover"
                        style={{
                          backgroundColor: "transparent",
                          border: `1px solid ${S.orange}`,
                          color: S.orange,
                          padding: "3px 9px",
                          fontSize: "11px",
                          cursor: "pointer",
                          borderRadius: "2px",
                        }}
                      >
                        {restoringBackup === backup.name ? "Extracting..." : "Restore"}
                      </button>
                      <button
                        onClick={() =>
                          window.open(
                            `/api/files/download?path=backups/${encodeURIComponent(backup.name)}/${encodeURIComponent(backup.name)}.zip`,
                            "_blank"
                          )
                        }
                        className="button-hover"
                        style={{
                          backgroundColor: "transparent",
                          border: `1px solid ${S.cyan}`,
                          color: S.cyan,
                          padding: "3px 9px",
                          fontSize: "11px",
                          cursor: "pointer",
                          borderRadius: "2px",
                        }}
                      >
                        Download
                      </button>
                      <button
                        onClick={() => deleteBackup(backup.name)}
                        className="button-hover"
                        style={{
                          backgroundColor: "transparent",
                          border: `1px solid ${S.red}`,
                          color: S.red,
                          padding: "3px 9px",
                          fontSize: "11px",
                          cursor: "pointer",
                          borderRadius: "2px",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
