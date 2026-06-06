import React, { useState, useEffect } from "react";
import { S } from "@/lib/constants";
import { Shield, ShieldAlert, UserCheck, Users, Search, Trash2, Plus } from "lucide-react";

interface PlayersTabProps {
  TabHeader: React.FC<any>;
  sendCmd: (cmd: string) => void;
  isOnline: boolean;
  statusData: any;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

interface PlayerRecord {
  uuid: string;
  name: string;
}

export function PlayersTab({
  TabHeader,
  sendCmd,
  isOnline,
  statusData,
  showToast,
}: PlayersTabProps) {
  const [whitelist, setWhitelist] = useState<PlayerRecord[]>([]);
  const [ops, setOps] = useState<PlayerRecord[]>([]);
  const [banned, setBanned] = useState<PlayerRecord[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [addInputs, setAddInputs] = useState({ whitelist: "", ops: "", banned: "" });

  const fetchPlayerLists = async () => {
    setLoading(true);
    try {
      const fetchJson = async (filename: string) => {
        const res = await fetch(`/api/files?path=${filename}&read=1`, { cache: "no-store" });
        if (!res.ok) return [];
        const text = await res.text();
        return text ? JSON.parse(text) : [];
      };

      const [wList, oList, bList] = await Promise.all([
        fetchJson("whitelist.json"),
        fetchJson("ops.json"),
        fetchJson("banned-players.json")
      ]);

      setWhitelist(Array.isArray(wList) ? wList : []);
      setOps(Array.isArray(oList) ? oList : []);
      setBanned(Array.isArray(bList) ? bList : []);
    } catch (err) {
      console.error("Failed to load player lists", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerLists();
  }, []);

  const handleAction = async (type: "whitelist" | "ops" | "banned", action: "add" | "remove", player: string) => {
    if (!isOnline) {
      showToast("Server must be online to run player commands.", "error");
      return;
    }
    if (!player.trim()) return;

    let cmd = "";
    if (type === "whitelist") cmd = `whitelist ${action} ${player}`;
    if (type === "ops") cmd = action === "add" ? `op ${player}` : `deop ${player}`;
    if (type === "banned") cmd = action === "add" ? `ban ${player}` : `pardon ${player}`;

    sendCmd(cmd);
    showToast(`Command sent: /${cmd}`, "info");
    
    if (action === "add") {
      setAddInputs(prev => ({ ...prev, [type]: "" }));
    }

    // Refresh after a short delay to let the server write to JSON
    setTimeout(() => fetchPlayerLists(), 1500);
  };

  const renderSection = (
    title: string,
    description: string,
    type: "whitelist" | "ops" | "banned",
    icon: React.ReactNode,
    data: PlayerRecord[],
    color: string
  ) => {
    return (
      <div style={{
        backgroundColor: "#1e1e1e",
        border: `1px solid ${S.border}`,
        borderRadius: "4px",
        overflow: "hidden"
      }}>
        <div style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${S.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#222"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ color }}>{icon}</div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "bold", color: S.white }}>{title}</div>
              <div style={{ fontSize: "11px", color: S.muted }}>{description}</div>
            </div>
          </div>
          <div style={{ fontSize: "12px", color: S.muted, backgroundColor: "#111", padding: "4px 8px", borderRadius: "10px" }}>
            {data.length} records
          </div>
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Add input */}
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder={`Player name to add to ${title.toLowerCase()}`}
              value={addInputs[type]}
              onChange={(e) => setAddInputs(prev => ({ ...prev, [type]: e.target.value }))}
              style={{
                flex: 1,
                backgroundColor: S.input,
                border: `1px solid ${S.inputBdr}`,
                color: S.white,
                padding: "8px 12px",
                fontSize: "13px",
                borderRadius: "4px",
                outline: "none"
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAction(type, "add", addInputs[type]);
              }}
            />
            <button
              onClick={() => handleAction(type, "add", addInputs[type])}
              disabled={!addInputs[type].trim() || !isOnline}
              className="button-hover"
              style={{
                backgroundColor: color,
                color: "#111",
                border: "none",
                borderRadius: "4px",
                padding: "0 14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: "bold",
                cursor: (!addInputs[type].trim() || !isOnline) ? "not-allowed" : "pointer",
                opacity: (!addInputs[type].trim() || !isOnline) ? 0.5 : 1
              }}
            >
              <Plus size={16} /> Add
            </button>
          </div>

          {/* List */}
          <div style={{
            border: `1px solid ${S.border}`,
            borderRadius: "4px",
            maxHeight: "200px",
            overflowY: "auto",
            backgroundColor: "#161616"
          }}>
            {loading ? (
              <div style={{ padding: "16px", textAlign: "center", color: S.muted, fontSize: "12px" }}>Loading {title.toLowerCase()}...</div>
            ) : data.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", color: S.muted, fontSize: "12px" }}>List is empty.</div>
            ) : (
              data.map((p, i) => (
                <div key={p.uuid || i} style={{
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: i < data.length - 1 ? `1px solid ${S.border}` : "none",
                  fontSize: "13px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <img src={`https://crafatar.com/avatars/${p.uuid || p.name}?size=24&overlay=true`} alt="head" style={{ width: 24, height: 24, borderRadius: "4px", backgroundColor: "#333" }} onError={(e) => (e.currentTarget.style.display = 'none')} />
                    <span style={{ color: S.white, fontWeight: 500 }}>{p.name}</span>
                    <span style={{ color: "#666", fontSize: "10px", fontFamily: "monospace" }}>{p.uuid}</span>
                  </div>
                  <button
                    onClick={() => handleAction(type, "remove", p.name)}
                    disabled={!isOnline}
                    style={{
                      background: "none",
                      border: "none",
                      color: S.red,
                      cursor: isOnline ? "pointer" : "not-allowed",
                      opacity: isOnline ? 0.8 : 0.3,
                      display: "flex",
                      alignItems: "center"
                    }}
                    title={`Remove ${p.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%" }}>
      <TabHeader label="Player Management" icon={<Users size={20} />} />

      <div style={{
        padding: "20px",
        flex: 1,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "24px"
      }}>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#2a2a2a",
          padding: "16px",
          borderRadius: "6px",
          border: `1px solid ${S.border}`
        }}>
          <div>
            <div style={{ color: S.white, fontSize: "16px", fontWeight: "bold" }}>Online Players</div>
            <div style={{ color: S.muted, fontSize: "12px", marginTop: "2px" }}>
              Currently connected to the server
            </div>
          </div>
          <div style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: S.green,
            backgroundColor: "#1e1e1e",
            padding: "8px 16px",
            borderRadius: "4px",
            border: `1px solid ${S.border}`
          }}>
            {statusData?.currentPlayers ?? 0} <span style={{ color: S.muted, fontSize: "14px" }}>/ {statusData?.maxPlayers ?? 0}</span>
          </div>
        </div>

        {!isOnline && (
          <div style={{ color: S.orange, backgroundColor: "#332200", padding: "12px", borderRadius: "4px", fontSize: "12px", border: "1px solid #553300" }}>
            ⚠️ The server is currently offline. You cannot add or remove players from these lists until the server is running. (Lists are read-only).
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "20px" }}>
          {renderSection("Whitelist", "Players allowed to join", "whitelist", <UserCheck size={20} />, whitelist, S.green)}
          {renderSection("Server Operators (OPs)", "Players with admin permissions", "ops", <Shield size={20} />, ops, S.cyan)}
          {renderSection("Banned Players", "Players blocked from joining", "banned", <ShieldAlert size={20} />, banned, S.red)}
        </div>

      </div>
    </div>
  );
}
