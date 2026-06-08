import React, { useState } from "react";
import { Ico } from "@/components/icons";
import { S } from "@/lib/constants";
import { StatusData } from "@/lib/types";
import { AnsiUp } from "ansi_up";

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
          <Ico.Console />
          <span style={{ fontSize: "18px", fontWeight: 300 }}>Console Logs</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px" }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              color: wsStatus === "connected" ? S.green : S.muted,
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                display: "inline-block",
                backgroundColor: wsStatus === "connected" ? S.green : S.muted,
              }}
            />
            {wsMode === "live" ? "Live WebSocket" : "HTTP Polling"}
          </span>
          <OutlineBtn label="Copy Console" onClick={() => navigator.clipboard.writeText(logs.join('\n'))} />
          <OutlineBtn label="Clear Screen" onClick={() => setLogs([])} />
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

      {/* Console live metrics bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "18px",
          padding: "8px 20px",
          borderBottom: `1px solid ${S.border}`,
          backgroundColor: "#1f1f1f",
          flexWrap: "wrap",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: statusData?.status === "online" ? S.green : statusData?.status === "starting" || statusData?.status === "stopping" ? S.orange : S.red,
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              color: statusData?.status === "online" ? S.green : statusData?.status === "starting" || statusData?.status === "stopping" ? S.orange : S.red,
            }}
          >
            {(statusData?.status || "offline").toUpperCase()}
          </span>
        </div>
        <span style={{ width: "1px", height: "12px", backgroundColor: S.border }} />
        <div style={{ fontSize: "11.5px", color: S.muted }}>
          CPU:{" "}
          <span style={{ color: S.white, fontWeight: "bold" }}>
            {statusData?.cpu.toFixed(1) || "0.0"}%
          </span>
        </div>
        <span style={{ width: "1px", height: "12px", backgroundColor: S.border }} />
        <div style={{ fontSize: "11.5px", color: S.muted }}>
          RAM:{" "}
          <span style={{ color: S.white, fontWeight: "bold" }}>
            {ramMb} / {maxRamMb} MB
          </span>
        </div>
        <span style={{ width: "1px", height: "12px", backgroundColor: S.border }} />
        <div style={{ fontSize: "11.5px", color: S.muted }}>
          Version:{" "}
          <span style={{ color: S.white, fontWeight: "bold" }}>
            {statusData?.mcVersion || "1.21.1"}
          </span>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <PowerDropdown />
        </div>
      </div>

      {/* Logs terminal box */}
      <div
        style={{
          flex: 1,
          backgroundColor: S.bg,
          overflowY: "auto",
          padding: "12px 16px",
          fontFamily: "'JetBrains Mono', 'Consolas', 'Courier New', monospace",
          fontSize: "12px",
          lineHeight: "1.6",
          minHeight: 0,
        }}
      >
        {logs.length === 0 ? (
          <span style={{ color: "#555" }}>[No console output yet]</span>
        ) : (
          logs.map((line, i) => {
            let color = "#bbb";
            if (line.startsWith("> ")) {
              return <div key={i} style={{ color: S.cyan, wordBreak: "break-all" }}>{line}</div>;
            }
            if (line.startsWith("[Dashboard]")) {
              return <div key={i} style={{ color: "#667788", wordBreak: "break-all" }}>{line}</div>;
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

      {/* Console Quick commands actions */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          padding: "8px 12px",
          borderTop: `1px solid ${S.border}`,
          backgroundColor: S.content,
          flexWrap: "wrap",
          alignItems: "center",
          flexShrink: 0,
          opacity: isOnline ? 1 : 0.5,
          pointerEvents: isOnline ? "auto" : "none",
        }}
      >
        <span style={{ color: S.muted, fontSize: "11px", marginRight: "6px" }}>
          Quick Commands:
        </span>
        <button
          onClick={() => sendCommandDirect("gc")}
          className="button-hover"
          style={{
            backgroundColor: "#2e2e2e",
            border: `1px solid ${S.border}`,
            color: S.white,
            padding: "3px 8px",
            fontSize: "11px",
            cursor: "pointer",
            borderRadius: "3px",
          }}
          title="Force Java garbage collection"
        >
          GC
        </button>
        <button
          onClick={() => sendCommandDirect("tps")}
          className="button-hover"
          style={{
            backgroundColor: "#2e2e2e",
            border: `1px solid ${S.border}`,
            color: S.white,
            padding: "3px 8px",
            fontSize: "11px",
            cursor: "pointer",
            borderRadius: "3px",
          }}
          title="Check Server tick performance"
        >
          TPS
        </button>
        <button
          onClick={() => sendCommandDirect("save-all")}
          className="button-hover"
          style={{
            backgroundColor: "#2e2e2e",
            border: `1px solid ${S.border}`,
            color: S.white,
            padding: "3px 8px",
            fontSize: "11px",
            cursor: "pointer",
            borderRadius: "3px",
          }}
          title="Force world data save"
        >
          Save
        </button>
        <button
          onClick={() => sendCommandDirect("reload confirm")}
          className="button-hover"
          style={{
            backgroundColor: "#2e2e2e",
            border: `1px solid ${S.border}`,
            color: S.white,
            padding: "3px 8px",
            fontSize: "11px",
            cursor: "pointer",
            borderRadius: "3px",
          }}
          title="Reload plugins configuration"
        >
          Reload
        </button>
      </div>

      {/* Command input form */}
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", borderTop: `1px solid ${S.border}`, flexShrink: 0 }}
      >
        {!isOnline ? (
          <div
            style={{
              flex: 1,
              backgroundColor: S.bg,
              color: S.muted,
              padding: "10px 14px",
              fontSize: "12px",
              fontStyle: "italic",
              userSelect: "none",
            }}
          >
            Console command input is disabled because the server process is offline.
          </div>
        ) : (
          <>
            <span
              style={{
                padding: "10px 12px",
                backgroundColor: S.bg,
                color: S.cyan,
                fontFamily: "monospace",
                fontWeight: "bold",
                borderRight: `1px solid ${S.border}`,
                userSelect: "none",
              }}
            >
              &gt;
            </span>
            <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", backgroundColor: S.input }}>
              {suggestion && (
                <input
                  type="text"
                  value={suggestion}
                  disabled
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "transparent",
                    color: "rgba(255, 255, 255, 0.3)",
                    border: "none",
                    padding: "10px 12px",
                    fontFamily: "monospace",
                    fontSize: "12.5px",
                    outline: "none",
                    pointerEvents: "none",
                  }}
                />
              )}
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter server command..."
                style={{
                  position: "relative",
                  flex: 1,
                  width: "100%",
                  backgroundColor: "transparent",
                  color: S.white,
                  border: "none",
                  padding: "10px 12px",
                  fontFamily: "monospace",
                  fontSize: "12.5px",
                  outline: "none",
                  zIndex: 1,
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!command.trim()}
              className="button-hover"
              style={{
                padding: "10px 18px",
                backgroundColor: "transparent",
                color: S.cyan,
                border: "none",
                borderLeft: `1px solid ${S.border}`,
                cursor: "pointer",
                fontSize: "12px",
                opacity: !command.trim() ? 0.4 : 1,
                outline: "none",
              }}
            >
              Send
            </button>
          </>
        )}
      </form>
    </div>
  );
};
