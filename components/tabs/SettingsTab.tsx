import React from "react";
import { S } from "@/lib/constants";
import { StatusData } from "@/lib/types";
import { Card, CardHeader } from "./StatusTab";

interface SettingsTabProps {
  statusData: StatusData | null;
  startupForm: React.ReactNode;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export function SettingsTab({ statusData, startupForm, showToast }: SettingsTabProps) {
  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "20px" }}>
        {/* SERVER SPECIFICATIONS & METADATA */}
        <div style={{
          backgroundColor: "#1c1c1c",
          border: `1px solid ${S.border}`,
          padding: "20px",
          borderRadius: "4px",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          <div>
            <h2 style={{ fontSize: "14px", fontWeight: "bold", color: S.white, margin: 0 }}>Server Specifications</h2>
            <p style={{ fontSize: "11px", color: S.muted, margin: "4px 0 0" }}>Host environment and network parameters</p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px 24px",
            fontSize: "12px",
            lineHeight: "1.6"
          }}>
            <div>
              <span style={{ color: S.muted, display: "block", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.8px" }}>Minecraft Software</span>
              <span style={{ color: S.white, fontWeight: 500 }}>{statusData?.mcVersion || "Unknown"}</span>
            </div>
            <div>
              <span style={{ color: S.muted, display: "block", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.8px" }}>Java Environment</span>
              <span style={{ color: S.white, fontWeight: 500 }}>Java {statusData?.javaVersion || "21"} (64-Bit)</span>
            </div>
            <div>
              <span style={{ color: S.muted, display: "block", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.8px" }}>Allocated Memory</span>
              <span style={{ color: S.white, fontWeight: 500 }}>{statusData?.allocatedMemory || 12288} MB</span>
            </div>
            <div>
              <span style={{ color: S.muted, display: "block", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.8px" }}>Network Interface</span>
              <span style={{ color: S.white, fontWeight: 500 }}>{statusData?.bindIp || "0.0.0.0"}:{statusData?.port || 25565}</span>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <span style={{ color: S.muted, display: "block", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" }}>Message of the Day (MOTD)</span>
              <div style={{
                color: S.white,
                fontFamily: "monospace",
                fontSize: "11px",
                backgroundColor: "#161616",
                padding: "8px 12px",
                borderRadius: "3px",
                border: `1px solid ${S.border}`,
                lineHeight: "1.5",
              }}>
                {statusData?.motd?.replace(/§[0-9a-fk-or]/g, "").replace(/\\u00A7[0-9a-fk-or]/g, "") || "No MOTD available"}
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1", borderTop: `1px solid ${S.border}`, paddingTop: "12px", marginTop: "4px" }}>
              <span style={{ color: S.muted, display: "block", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px" }}>Quick Connect Info</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#161616", padding: "8px 12px", borderRadius: "3px", border: `1px solid ${S.border}` }}>
                  <span style={{ fontFamily: "monospace", fontSize: "11px", color: S.white }}>
                    IP: play.meowtopia.mooo.com:{statusData?.port || 25565}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`play.meowtopia.mooo.com:${statusData?.port || 25565}`);
                      showToast("Game connection IP address copied to clipboard.", "success");
                    }}
                    style={{ backgroundColor: "rgba(59,130,246,0.08)", border: `1px solid rgba(59,130,246,0.25)`, color: S.cyan, padding: "2px 8px", fontSize: "10px", fontWeight: "bold", cursor: "pointer", borderRadius: "3px" }}
                    className="button-hover"
                  >
                    Copy IP
                  </button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#161616", padding: "8px 12px", borderRadius: "3px", border: `1px solid ${S.border}` }}>
                  <span style={{ fontFamily: "monospace", fontSize: "11px", color: statusData?.sftpUsername ? S.white : S.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
                    {statusData?.sftpUsername
                      ? `SFTP: sftp://${statusData.sftpUsername}@${statusData.sftpHost || "play.meowtopia.mooo.com"}:${statusData.sftpPort || 5657}`
                      : "SFTP: Login to view credentials"}
                  </span>
                  {statusData?.sftpUsername && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`sftp://${statusData.sftpUsername}@${statusData.sftpHost || "play.meowtopia.mooo.com"}:${statusData.sftpPort || 5657}`);
                        showToast("SFTP connection URI copied to clipboard.", "success");
                      }}
                      style={{ backgroundColor: "rgba(59,130,246,0.08)", border: `1px solid rgba(59,130,246,0.25)`, color: S.cyan, padding: "2px 8px", fontSize: "10px", fontWeight: "bold", cursor: "pointer", borderRadius: "3px" }}
                      className="button-hover"
                    >
                      Copy SFTP
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "10px" }}>
        <div style={{
          backgroundColor: "rgba(255, 170, 51, 0.1)",
          border: `1px solid rgba(255, 170, 51, 0.3)`,
          padding: "16px",
          borderRadius: "4px",
          marginBottom: "20px"
        }}>
          <h3 style={{ margin: "0 0 8px 0", color: S.orange, fontSize: "14px" }}>⚠️ Important: Environment Variables vs Configs</h3>
          <p style={{ margin: 0, color: S.muted, fontSize: "12px", lineHeight: "1.5" }}>
            The settings below control the <strong>PufferPanel Environment Variables</strong> used to start the server (e.g., RAM, Java Version).<br/>
            They <strong>DO NOT</strong> modify your <code>server.properties</code> file. To change your server's Port, MOTD, or Max Players, please go to the <strong>Files</strong> tab and edit <code>server.properties</code> directly.
          </p>
        </div>
        {startupForm}
      </div>

    </div>
  );
}
