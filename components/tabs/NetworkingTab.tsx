import React from "react";
import { S } from "@/lib/constants";
import { Network } from "lucide-react";

export function NetworkingTab({
  TabHeader,
  statusData,
  loadingNetwork,
  bindIp,
  setBindIp,
  bindPort,
  setBindPort,
  savingNetwork,
  saveNetworkSettingsAndRestart,
  showToast,
  Btn,
}: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <TabHeader label="Networking & Port Allocation" icon={<Network size={20} />} />

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Active ports card */}
        <div
          style={{
            backgroundColor: "#242424",
            border: `1px solid ${S.border}`,
            padding: "16px",
            borderRadius: "3px",
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: 600, color: S.white, marginBottom: "12px" }}>
            Active Network Bindings
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr
                style={{
                  borderBottom: `1px solid ${S.border}`,
                  color: S.muted,
                  textAlign: "left",
                }}
              >
                <th style={{ padding: "8px 6px" }}>Service</th>
                <th style={{ padding: "8px 6px" }}>Bind Interface</th>
                <th style={{ padding: "8px 6px" }}>Daemon Port</th>
                <th style={{ padding: "8px 6px" }}>Protocol</th>
                <th style={{ padding: "8px 6px", width: "90px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: `1px solid ${S.border}` }}>
                <td style={{ padding: "10px 6px", color: S.orange, fontWeight: "bold" }}>
                  Minecraft Server (Paper)
                </td>
                <td style={{ padding: "10px 6px", fontFamily: "monospace" }}>
                  {statusData?.bindIp || "0.0.0.0"}
                </td>
                <td style={{ padding: "10px 6px", fontFamily: "monospace", color: S.white }}>
                  {statusData?.port || 25565}
                </td>
                <td style={{ padding: "10px 6px", color: S.muted }}>TCP/UDP</td>
                <td style={{ padding: "10px 6px" }}>
                  <span style={{ color: S.green, fontWeight: "bold" }}>ACTIVE</span>
                </td>
              </tr>
              <tr style={{ borderBottom: `1px solid ${S.border}` }}>
                <td style={{ padding: "10px 6px", color: S.cyan, fontWeight: "bold" }}>
                  Secure File Transfer (SFTP)
                </td>
                <td style={{ padding: "10px 6px", fontFamily: "monospace" }}>0.0.0.0</td>
                <td style={{ padding: "10px 6px", fontFamily: "monospace", color: S.white }}>
                  {statusData?.sftpPort || 5657}
                </td>
                <td style={{ padding: "10px 6px", color: S.muted }}>TCP</td>
                <td style={{ padding: "10px 6px" }}>
                  <span style={{ color: S.green, fontWeight: "bold" }}>ACTIVE</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Configure Port Bindings card */}
        <div
          style={{
            backgroundColor: "#242424",
            border: `1px solid ${S.border}`,
            padding: "18px",
            borderRadius: "3px",
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: 600, color: S.white, marginBottom: "12px" }}>
            Configure Port Bindings
          </div>
          {loadingNetwork ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: S.muted, padding: "10px 0" }}>
              <div className="spinner" />
              <span style={{ fontSize: "12px" }}>Loading bindings configuration...</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <label style={{ display: "block", fontSize: "11px", color: S.muted, marginBottom: "6px" }}>BIND IP ADDRESS</label>
                  <input
                    type="text"
                    value={bindIp}
                    onChange={(e) => setBindIp(e.target.value)}
                    style={{
                      backgroundColor: S.input,
                      border: `1px solid ${S.inputBdr}`,
                      color: S.white,
                      padding: "8px 12px",
                      fontSize: "13px",
                      outline: "none",
                      borderRadius: "3px",
                      width: "100%",
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <label style={{ display: "block", fontSize: "11px", color: S.muted, marginBottom: "6px" }}>DAEMON PORT</label>
                  <input
                    type="number"
                    value={bindPort}
                    onChange={(e) => setBindPort(e.target.value)}
                    style={{
                      backgroundColor: S.input,
                      border: `1px solid ${S.inputBdr}`,
                      color: S.white,
                      padding: "8px 12px",
                      fontSize: "13px",
                      outline: "none",
                      borderRadius: "3px",
                      width: "100%",
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
                <Btn
                  label={savingNetwork ? "Saving & Restarting..." : "Save Bindings & Restart"}
                  color={S.orange}
                  onClick={saveNetworkSettingsAndRestart}
                  disabled={savingNetwork || loadingNetwork}
                />
              </div>
            </div>
          )}
        </div>

        {/* Connection Address info card */}
        <div
          style={{
            backgroundColor: "#242424",
            border: `1px solid ${S.border}`,
            padding: "18px",
            borderRadius: "3px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: S.white,
              marginBottom: "12px",
              borderBottom: `1px solid ${S.border}`,
              paddingBottom: "8px",
            }}
          >
            Quick Connections Addresses
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <div style={{ fontSize: "11px", color: S.muted }}>MINECRAFT GAME IP</div>
                <div style={{ fontSize: "14px", fontFamily: "monospace", color: S.white, fontWeight: "bold" }}>
                  play.meowtopia.mooo.com:{statusData?.port || 25565}
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`play.meowtopia.mooo.com:${statusData?.port || 25565}`);
                  showToast("Game connection IP address copied to clipboard.", "success");
                }}
                className="button-hover"
                style={{
                  backgroundColor: "#2a2a2a",
                  border: `1px solid ${S.border}`,
                  color: S.cyan,
                  padding: "5px 12px",
                  fontSize: "11px",
                  cursor: "pointer",
                  borderRadius: "3px",
                }}
              >
                Copy IP
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <div style={{ fontSize: "11px", color: S.muted }}>SFTP URI</div>
                <div style={{ fontSize: "14px", fontFamily: "monospace", color: S.white, fontWeight: "bold" }}>
                  sftp://{statusData?.sftpUsername || "agreeable_guy-946f16b4"}@
                  {statusData?.sftpHost || "play.meowtopia.mooo.com"}:
                  {statusData?.sftpPort || 5657}
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `sftp://${statusData?.sftpUsername || "agreeable_guy-946f16b4"}@${
                      statusData?.sftpHost || "play.meowtopia.mooo.com"
                    }:${statusData?.sftpPort || 5657}`
                  );
                  showToast("SFTP connection URI copied to clipboard.", "success");
                }}
                className="button-hover"
                style={{
                  backgroundColor: "#2a2a2a",
                  border: `1px solid ${S.border}`,
                  color: S.cyan,
                  padding: "5px 12px",
                  fontSize: "11px",
                  cursor: "pointer",
                  borderRadius: "3px",
                }}
              >
                Copy SFTP URI
              </button>
            </div>
          </div>
        </div>

        {/* Infrastructure specs card */}
        <div
          style={{
            backgroundColor: "#242424",
            border: `1px solid ${S.border}`,
            padding: "16px",
            borderRadius: "3px",
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: 600, color: S.white, marginBottom: "8px" }}>
            Infrastructure Hosting Context
          </div>
          <div style={{ fontSize: "12px", color: S.muted, lineHeight: "1.5" }}>
            This Minecraft server is running inside a Docker virtualization daemon container
            managed by PufferPanel. The environment is hosted on an{" "}
            <span style={{ color: S.white, fontWeight: "bold" }}>Oracle Cloud ARM Virtual Machine</span>{" "}
            (ubuntu). Allocated resources include:
            <ul style={{ margin: "6px 0", paddingLeft: "20px", color: S.white }}>
              <li>CPU cores capacity: 4 OCPUs (ARM64 architecture)</li>
              <li>Total host system memory: 24 GB RAM</li>
              <li>Allocated JVM heap space memory: {statusData?.allocatedMemory || 12288} MB</li>
              <li>Failsafe bandwidth throughput: 1 Gbps connection</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
