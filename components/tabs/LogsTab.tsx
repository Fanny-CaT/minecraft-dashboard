import React from "react";
import { S } from "@/lib/constants";
import { ScrollText } from "lucide-react";

export function LogsTab({
  selectedLogFile,
  setSelectedLogFile,
  logsSearch,
  setLogsSearch,
  loadLogsContent,
  loadingLogs,
  clearLogFile,
  loadingLogFiles,
  logFiles,
  logsContent,
}: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px 11px", borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ScrollText size={24} />
          <span style={{ fontSize: "18px", fontWeight: 300 }}>
            Server Logs
          </span>
          <span style={{ fontSize: "12px", color: S.muted, fontFamily: "monospace", background: "rgba(255,255,255,0.05)", padding: "1px 8px", borderRadius: "3px" }}>
            {selectedLogFile.replace("logs/", "")}
          </span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Filter log lines..."
            value={logsSearch}
            onChange={(e) => setLogsSearch(e.target.value)}
            style={{ backgroundColor: S.input, border: `1px solid ${S.inputBdr}`, color: S.white, padding: "4px 8px", fontSize: "12px", outline: "none", width: "180px", borderRadius: "2px" }}
          />
          <button
            onClick={() => loadLogsContent(selectedLogFile)}
            disabled={loadingLogs}
            className="button-hover"
            style={{ backgroundColor: "transparent", border: `1px solid ${S.cyan}`, color: S.cyan, cursor: "pointer", padding: "4px 10px", fontSize: "12px", borderRadius: "2px" }}
          >
            ↻ Refresh
          </button>
          <button
            onClick={() => window.open(`/api/files/download?path=${encodeURIComponent(selectedLogFile)}`, "_blank")}
            className="button-hover"
            style={{ backgroundColor: "transparent", border: `1px solid ${S.green}`, color: S.green, cursor: "pointer", padding: "4px 10px", fontSize: "12px", borderRadius: "2px" }}
          >
            ↓ Download
          </button>
          {selectedLogFile === "logs/latest.log" && (
            <button
              onClick={clearLogFile}
              className="button-hover"
              style={{ backgroundColor: "transparent", border: `1px solid ${S.red}`, color: S.red, cursor: "pointer", padding: "4px 10px", fontSize: "12px", borderRadius: "2px" }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Body: sidebar + viewer */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* File list sidebar */}
        <div style={{ width: "210px", flexShrink: 0, borderRight: `1px solid ${S.border}`, overflowY: "auto", backgroundColor: S.bg }}>
          <div style={{ padding: "8px 12px 4px", fontSize: "10px", color: S.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Log Files
          </div>
          {loadingLogFiles ? (
            <div style={{ padding: "12px", color: S.muted, fontSize: "12px" }}>Loading...</div>
          ) : (
            <>
              {/* latest.log always pinned top */}
              {[{ name: "latest.log", size: 0, modifyTime: 0 }, ...logFiles.filter((f: any) => f.name !== "latest.log")].map((f) => {
                const fullPath = `logs/${f.name}`;
                const isSelected = selectedLogFile === fullPath;
                const isLatest = f.name === "latest.log";
                return (
                  <button
                    key={f.name}
                    onClick={() => {
                      setSelectedLogFile(fullPath);
                      setLogsSearch("");
                      loadLogsContent(fullPath);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "7px 12px",
                      backgroundColor: isSelected ? "rgba(0,220,200,0.08)" : "transparent",
                      borderLeft: isSelected ? `2px solid ${S.cyan}` : "2px solid transparent",
                      color: isSelected ? S.cyan : isLatest ? S.white : S.muted,
                      fontSize: "11.5px",
                      fontFamily: "monospace",
                      border: "none",
                      borderBottom: `1px solid ${S.border}`,
                      cursor: "pointer",
                      wordBreak: "break-all",
                    }}
                  >
                    {isLatest ? "📄 " : f.name.endsWith(".gz") ? "🗜 " : "📋 "}
                    {f.name}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Log content viewer */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {loadingLogs ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "12px", color: S.muted }}>
              <div className="spinner" />
              <span>Reading {selectedLogFile.replace("logs/", "")}...</span>
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                backgroundColor: S.bg,
                margin: "12px",
                border: `1px solid ${S.border}`,
                padding: "12px 14px",
                fontFamily: "'Consolas','Courier New',monospace",
                fontSize: "12px",
                lineHeight: "1.65",
                color: "#bbb",
                overflowY: "auto",
                whiteSpace: "pre-wrap",
                borderRadius: "3px",
              }}
            >
              {(() => {
                const lines = logsContent.split("\n");
                const filtered = logsSearch
                  ? lines.filter((l: string) => l.toLowerCase().includes(logsSearch.toLowerCase()))
                  : lines;

                if (filtered.length === 0 || (filtered.length === 1 && !filtered[0])) {
                  return <span style={{ color: "#555" }}>[No log entries found — the file may be empty]</span>;
                }

                return filtered.map((line: string, idx: number) => {
                  let color = "#bbb";
                  if (/ERROR|Exception|SEVERE/.test(line)) color = "#dd6666";
                  else if (/WARN/.test(line)) color = S.orange;
                  else if (/INFO/.test(line)) color = "#ccc";
                  else if (/\[Server\]|\[Rcon\]/.test(line)) color = S.cyan;

                  return (
                    <div key={idx} style={{ color }}>
                      {line}
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
