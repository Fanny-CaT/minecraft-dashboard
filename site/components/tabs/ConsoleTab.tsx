import React, { useState } from "react";
import Ansi from "ansi-to-react";
import { Ico } from "@/components/icons";
import { S } from "@/lib/constants";
import { StatusData } from "@/lib/types";

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
  sendCommandDirect: (cmd: string) => void;
  sendCmd: (cmd: string) => void;
  OutlineBtn: React.FC<{ label: string; onClick: () => void }>;
}

const commonCommands = [
  "help", "whitelist add ", "whitelist remove ", "whitelist list", "whitelist on", "whitelist off",
  "op ", "deop ", "ban ", "pardon ", "ban-ip ", "pardon-ip ", "kick ", "say ", "tell ", "msg ", 
  "time set ", "time add ", "weather clear", "weather rain", "weather thunder", "tp ", "gamemode survival ", 
  "gamemode creative ", "gamemode spectator ", "give ", "stop", "restart", "plugins", "version", "reload", "list",
  "difficulty ", "seed", "gamerule "
];

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
  sendCommandDirect,
  sendCmd,
  OutlineBtn,
}) => {
  const [command, setCommand] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCommand(val);
    if (!val) {
      setSuggestions([]);
    } else {
      const match = commonCommands.filter((c) => c.toLowerCase().startsWith(val.toLowerCase()) && c !== val.toLowerCase());
      setSuggestions(match.slice(0, 5)); // limit to 5
      setSelectedIndex(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      } else if (e.key === "Tab") {
        e.preventDefault();
        setCommand(suggestions[selectedIndex]);
        setSuggestions([]);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      sendCmd(command);
      setCommand("");
      setSuggestions([]);
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
          backgroundColor: "#111",
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
            return (
              <div key={i} style={{ wordBreak: "break-all" }}>
                <Ansi>{line}</Ansi>
              </div>
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
          backgroundColor: "#1c1c1c",
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

      {/* Command input form with relative position for suggestions */}
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", borderTop: `1px solid ${S.border}`, flexShrink: 0, position: "relative" }}
      >
        {suggestions.length > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              left: "40px",
              backgroundColor: "#222",
              border: `1px solid ${S.border}`,
              borderBottom: "none",
              borderRadius: "4px 4px 0 0",
              overflow: "hidden",
              zIndex: 10,
              minWidth: "200px"
            }}
          >
            {suggestions.map((sug, idx) => (
              <div
                key={sug}
                style={{
                  padding: "8px 12px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  color: idx === selectedIndex ? S.cyan : S.white,
                  backgroundColor: idx === selectedIndex ? "#333" : "transparent",
                  cursor: "pointer"
                }}
                onClick={() => {
                  setCommand(sug);
                  setSuggestions([]);
                }}
              >
                {sug}
              </div>
            ))}
          </div>
        )}
        {!isOnline ? (
          <div
            style={{
              flex: 1,
              backgroundColor: "#161616",
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
                backgroundColor: "#161616",
                color: S.cyan,
                fontFamily: "monospace",
                fontWeight: "bold",
                borderRight: `1px solid ${S.border}`,
                userSelect: "none",
              }}
            >
              &gt;
            </span>
            <input
              type="text"
              value={command}
              onChange={handleCommandChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter server command... (Tab to autocomplete)"
              style={{
                flex: 1,
                backgroundColor: S.input,
                color: S.white,
                border: "none",
                padding: "10px 12px",
                fontFamily: "monospace",
                fontSize: "12.5px",
                outline: "none",
              }}
            />
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
