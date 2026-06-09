import React, { useState } from "react";
import { Ico } from "@/components/icons";
import { S } from "@/lib/constants";
import { StatusData } from "@/lib/types";
import { AnsiUp } from "ansi_up";
import { TerminalSquare } from "lucide-react";

const ansiUp = new AnsiUp();

const COMMON_COMMANDS = [
  "help", "stop", "save-all", "save-on", "save-off", "tps", "gc", "ban", "ban-ip", "pardon", "pardon-ip", "kick", "op", "deop", "whitelist", "time", "weather", "say", "give", "tp", "gamemode", "difficulty", "kill", "seed", "reload", "plugins", "version", "geyser", "luckperms", "lp", "essentials", "eco", "pay", "spark", "discord", "list", "clear"
].sort();

interface ConsoleTabProps {
  wsStatus: string;
  wsMode: string;
  setLogs: (logs: string[]) => void;
  connectWs: () => void;
  wsAttempts: React.MutableRefObject<number>;
  isOnline: boolean;
  statusData: StatusData | null;
  ramMb: number;
  maxRamMb: number;
  PowerDropdown: React.FC;
  logs: string[];
  consoleEndRef: React.RefObject<HTMLDivElement | null>;
  autoScroll: boolean;
  setAutoScroll: (v: boolean) => void;
  sendCommandDirect: (cmd: string) => void;
  sendCmd: (cmd: string) => void;
  OutlineBtn: React.FC<{ label: string; onClick: () => void }>;
}

export const ConsoleTab: React.FC<ConsoleTabProps> = ({
  wsStatus,
  wsMode,
  setLogs,
  connectWs,
  wsAttempts,
  isOnline,
  statusData,
  ramMb,
  maxRamMb,
  PowerDropdown,
  logs,
  consoleEndRef,
  autoScroll,
  setAutoScroll,
  sendCommandDirect,
  sendCmd,
  OutlineBtn,
}) => {
  const [command, setCommand] = useState("");
  const [suggestion, setSuggestion] = useState("");

  React.useEffect(() => {
    if (!command) {
      setSuggestion("");
      return;
    }
    const rawCmd = command.startsWith("/") ? command.slice(1) : command;
    const match = COMMON_COMMANDS.find(c => c.startsWith(rawCmd.toLowerCase()));
    if (match && rawCmd.length > 0) {
      setSuggestion(command + match.substring(rawCmd.length));
    } else {
      setSuggestion("");
    }
  }, [command]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      sendCmd(command);
      setCommand("");
      setSuggestion("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (suggestion) {
        setCommand(suggestion + " ");
      }
    }
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
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)"
          }}>
            <TerminalSquare size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#fff", margin: 0, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>Live Console</h2>
            <p style={{ fontSize: "12px", color: S.muted, margin: 0 }}>Monitor and command your server</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "20px",
              background: "rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.05)",
              color: wsStatus === "connected" ? "#34d399" : S.muted,
            }}
          >
            <span
              style={{
                width: "8px", height: "8px", borderRadius: "50%",
                backgroundColor: wsStatus === "connected" ? "#34d399" : S.muted,
                boxShadow: wsStatus === "connected" ? "0 0 8px #34d399" : "none"
              }}
            />
            {wsMode === "live" ? "Live WebSocket" : "HTTP Polling"}
          </div>
          <OutlineBtn label="Copy" onClick={() => navigator.clipboard.writeText(logs.join('\n'))} />
          <OutlineBtn label="Clear" onClick={() => setLogs([])} />
          <OutlineBtn 
            label={autoScroll ? "Pause Scroll" : "Resume Scroll"} 
            onClick={() => setAutoScroll(!autoScroll)} 
          />
          {wsStatus !== "connected" && (
            <OutlineBtn
              label="Reconnect"
              onClick={() => {
                wsAttempts.current = 0;
                connectWs();
              }}
            />
          )}
        </div>
      </div>

      {/* Metrics Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
          padding: "10px 24px",
          background: "rgba(15, 23, 42, 0.4)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          backdropFilter: "blur(4px)",
          flexWrap: "wrap",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "10px", height: "10px", borderRadius: "50%",
              backgroundColor: statusData?.status === "online" ? "#10b981" : statusData?.status === "starting" || statusData?.status === "stopping" ? "#f59e0b" : "#ef4444",
              boxShadow: `0 0 10px ${statusData?.status === "online" ? "#10b981" : statusData?.status === "starting" || statusData?.status === "stopping" ? "#f59e0b" : "#ef4444"}`
            }}
          />
          <span
            style={{
              fontSize: "12px", fontWeight: 700, letterSpacing: "1px",
              color: statusData?.status === "online" ? "#10b981" : statusData?.status === "starting" || statusData?.status === "stopping" ? "#f59e0b" : "#ef4444",
            }}
          >
            {(statusData?.status || "OFFLINE").toUpperCase()}
          </span>
        </div>
        <span style={{ width: "1px", height: "14px", backgroundColor: "rgba(255,255,255,0.1)" }} />
        <div style={{ fontSize: "12px", color: S.muted, display: "flex", gap: "6px" }}>
          CPU:{" "}
          <span style={{ color: "#fff", fontWeight: 600 }}>
            {statusData?.cpu.toFixed(1) || "0.0"}%
          </span>
        </div>
        <span style={{ width: "1px", height: "14px", backgroundColor: "rgba(255,255,255,0.1)" }} />
        <div style={{ fontSize: "12px", color: S.muted, display: "flex", gap: "6px" }}>
          RAM:{" "}
          <span style={{ color: "#fff", fontWeight: 600 }}>
            {ramMb} / {maxRamMb} MB
          </span>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <PowerDropdown />
        </div>
      </div>

      {/* Logs Box */}
      <div
        style={{
          flex: 1,
          backgroundColor: "#0f111a", // Deep code editor background
          overflowY: "auto",
          padding: "16px 24px",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          fontSize: "13px",
          lineHeight: "1.7",
          minHeight: 0,
          boxShadow: "inset 0 10px 20px rgba(0,0,0,0.5)",
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            [ Waiting for server output... ]
          </div>
        ) : (
          logs.map((line, i) => {
            let color = "#cbd5e1";
            if (line.startsWith("> ")) {
              return <div key={i} style={{ color: "#38bdf8", wordBreak: "break-all", fontWeight: 500 }}>{line}</div>;
            }
            if (line.startsWith("[Dashboard]")) {
              return <div key={i} style={{ color: "#64748b", wordBreak: "break-all", fontStyle: "italic" }}>{line}</div>;
            }
            
            const html = ansiUp.ansi_to_html(line);
            return (
              <div 
                key={i} 
                style={{ color, wordBreak: "break-all" }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          })
        )}
        <div ref={consoleEndRef} />
      </div>

      {/* Quick Commands & Input Area */}
      <div style={{ background: "linear-gradient(180deg, rgba(15,23,42,0.8) 0%, rgba(30,41,59,0.95) 100%)", backdropFilter: "blur(10px)", flexShrink: 0 }}>
        {/* Quick Commands */}
        <div
          style={{
            display: "flex", gap: "8px", padding: "10px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            flexWrap: "wrap", alignItems: "center",
            opacity: isOnline ? 1 : 0.5,
            pointerEvents: isOnline ? "auto" : "none",
          }}
        >
          <span style={{ color: S.muted, fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginRight: "8px" }}>
            Quick Actions
          </span>
          {[
            { cmd: "gc", label: "GC", color: "#8b5cf6" },
            { cmd: "tps", label: "TPS", color: "#3b82f6" },
            { cmd: "save-all", label: "Save All", color: "#10b981" },
            { cmd: "reload confirm", label: "Reload", color: "#f59e0b" },
          ].map((btn) => (
            <button
              key={btn.cmd}
              onClick={() => sendCommandDirect(btn.cmd)}
              className="button-hover"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                border: `1px solid ${btn.color}40`,
                color: btn.color,
                padding: "4px 12px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                borderRadius: "6px",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${btn.color}20`; e.currentTarget.style.boxShadow = `0 0 10px ${btn.color}40`; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", padding: "12px 24px" }}
        >
          {!isOnline ? (
            <div
              style={{
                flex: 1, backgroundColor: "rgba(0,0,0,0.3)", color: S.muted,
                padding: "12px 16px", fontSize: "13px", fontStyle: "italic",
                borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)"
              }}
            >
              Console input is disabled while the server is offline.
            </div>
          ) : (
            <div style={{ 
              display: "flex", flex: 1, 
              background: "rgba(0,0,0,0.3)", 
              border: "1px solid rgba(255,255,255,0.1)", 
              borderRadius: "8px", 
              overflow: "hidden",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)"
            }}>
              <span
                style={{
                  padding: "12px 16px",
                  color: "#38bdf8",
                  fontFamily: "monospace",
                  fontWeight: 800,
                  fontSize: "14px",
                  userSelect: "none",
                  display: "flex", alignItems: "center"
                }}
              >
                $&gt;
              </span>
              <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
                {suggestion && (
                  <input
                    type="text"
                    value={suggestion}
                    disabled
                    style={{
                      position: "absolute", inset: 0,
                      backgroundColor: "transparent", color: "rgba(255, 255, 255, 0.2)",
                      border: "none", padding: "12px 0",
                      fontFamily: "'JetBrains Mono', monospace", fontSize: "14px",
                      outline: "none", pointerEvents: "none",
                    }}
                  />
                )}
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command..."
                  style={{
                    position: "relative", flex: 1, width: "100%",
                    backgroundColor: "transparent", color: "#fff",
                    border: "none", padding: "12px 0",
                    fontFamily: "'JetBrains Mono', monospace", fontSize: "14px",
                    outline: "none", zIndex: 1,
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={!command.trim()}
                style={{
                  padding: "0 24px",
                  background: command.trim() ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" : "rgba(255,255,255,0.05)",
                  color: command.trim() ? "#fff" : S.muted,
                  border: "none",
                  cursor: command.trim() ? "pointer" : "default",
                  fontSize: "13px",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                }}
              >
                Execute
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
