"use client";

import React, { useState } from "react";
import { S } from "@/lib/constants";
import { Ico } from "@/components/icons";

const OutlineBtn = ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="button-hover"
    style={{
      backgroundColor: "transparent",
      color: S.white,
      border: `1px solid ${S.border}`,
      padding: "6px 14px",
      fontSize: "12px",
      fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      borderRadius: "3px",
      transition: "all 0.15s ease",
    }}
  >
    {label}
  </button>
);

const Btn = ({
  label,
  onClick,
  color,
  disabled,
}: {
  label: string;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="button-hover"
    style={{
      backgroundColor: disabled ? "#2a2a2a" : color || S.cyan,
      color: disabled ? S.muted : "#1a1a1a",
      border: "none",
      padding: "8px 18px",
      fontSize: "13px",
      fontWeight: "bold",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.7 : 1,
      borderRadius: "3px",
      transition: "all 0.2s ease",
    }}
  >
    {label}
  </button>
);

export default function UsersTab({
  userList,
  setUserList,
  loadUsers,
  loadingUsers,
  userError,
  handleAction,
  players,
  userCmd,
  setUserCmd,
  sendUserCmd,
}: {
  userList: "ops" | "whitelist" | "banned-players" | "banned-ips" | "all-players";
  setUserList: React.Dispatch<React.SetStateAction<"ops" | "whitelist" | "banned-players" | "banned-ips" | "all-players">>;
  loadUsers: (list: "ops" | "whitelist" | "banned-players" | "banned-ips" | "all-players") => void;
  loadingUsers: boolean;
  userError: string;
  handleAction: (cmd: string) => void;
  players: any[];
  userCmd: string;
  setUserCmd: React.Dispatch<React.SetStateAction<string>>;
  sendUserCmd: (e: React.FormEvent) => void;
}) {
  const [whitelistInput, setWhitelistInput] = useState("");
  const [opInput, setOpInput] = useState("");
  const [banPlayerInput, setBanPlayerInput] = useState("");
  const [banReasonInput, setBanReasonInput] = useState("");
  const [banIpInput, setBanIpInput] = useState("");
  const [banIpReasonInput, setBanIpReasonInput] = useState("");
  const [whitelistRemoveInput, setWhitelistRemoveInput] = useState("");
  const [deopInput, setDeopInput] = useState("");
  const [kickPlayerInput, setKickPlayerInput] = useState("");
  const [kickReasonInput, setKickReasonInput] = useState("");
  const [pardonInput, setPardonInput] = useState("");
  const [pardonIpInput, setPardonIpInput] = useState("");

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
          <Ico.Users />
          <span style={{ fontSize: "18px", fontWeight: 300 }}>Players & Permissions</span>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              border: `1px solid ${S.border}`,
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            {(["all-players", "ops", "whitelist", "banned-players", "banned-ips"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setUserList(l)}
                style={{
                  padding: "4px 10px",
                  backgroundColor: userList === l ? S.orange : "transparent",
                  color: S.white,
                  border: "none",
                  fontSize: "11px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {l === "banned-players" ? "BANNED PLAYERS" : l === "banned-ips" ? "BANNED IPS" : l === "all-players" ? "ALL PLAYERS" : l.toUpperCase()}
              </button>
            ))}
          </div>
          <OutlineBtn label="Refresh" onClick={() => loadUsers(userList)} disabled={loadingUsers} />
        </div>
      </div>

      {userError && (
        <div
          style={{
            padding: "7px 18px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderBottom: `1px solid rgba(239, 68, 68, 0.3)`,
            color: S.red,
            fontSize: "12px",
          }}
        >
          {userError}
        </div>
      )}

      <div style={{ flex: 1, padding: "18px", overflow: "auto", display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* Whitelist Switch Card & Action Forms Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {/* Whitelist Controls */}
          <div
            style={{
              border: `1px solid ${S.border}`,
              backgroundColor: S.content,
              padding: "16px",
              borderRadius: "3px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: S.white, marginBottom: "4px" }}>
                Global Whitelist Control
              </div>
              <div style={{ fontSize: "11px", color: S.muted, marginBottom: "12px" }}>
                Toggle enforce whitelist on this server.
              </div>
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button onClick={() => handleAction("whitelist on")} className="button-hover" style={{ backgroundColor: "#2e2e2e", border: `1px solid ${S.border}`, color: S.cyan, padding: "5px 10px", fontSize: "11px", cursor: "pointer", borderRadius: "3px", fontWeight: "bold" }}>Enable</button>
              <button onClick={() => handleAction("whitelist off")} className="button-hover" style={{ backgroundColor: "#2e2e2e", border: `1px solid ${S.border}`, color: S.red, padding: "5px 10px", fontSize: "11px", cursor: "pointer", borderRadius: "3px", fontWeight: "bold" }}>Disable</button>
              <button onClick={() => handleAction("whitelist reload")} className="button-hover" style={{ backgroundColor: "#2e2e2e", border: `1px solid ${S.border}`, color: S.orange, padding: "5px 10px", fontSize: "11px", cursor: "pointer", borderRadius: "3px", fontWeight: "bold" }}>Reload</button>
            </div>
          </div>

          {/* Add to Whitelist */}
          <div style={{ border: `1px solid ${S.border}`, backgroundColor: S.content, padding: "16px", borderRadius: "3px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: S.white, marginBottom: "4px" }}>Add to Whitelist</div>
            <div style={{ fontSize: "11px", color: S.muted, marginBottom: "12px" }}>Allow a player to join when whitelist is enabled.</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input type="text" placeholder="Player username" value={whitelistInput} onChange={(e) => setWhitelistInput(e.target.value)} style={{ flex: 1, backgroundColor: S.input, border: `1px solid ${S.inputBdr}`, color: S.white, padding: "5px 8px", fontSize: "12px", outline: "none" }} />
              <button onClick={() => { if (!whitelistInput.trim()) return; handleAction(`whitelist add ${whitelistInput.trim()}`); setWhitelistInput(""); }} className="button-hover" style={{ backgroundColor: S.cyan, border: "none", color: "#1a1a1a", padding: "5px 12px", fontSize: "11px", cursor: "pointer", borderRadius: "2px", fontWeight: "bold" }}>Add</button>
            </div>
          </div>

          {/* OP Player */}
          <div style={{ border: `1px solid ${S.border}`, backgroundColor: S.content, padding: "16px", borderRadius: "3px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: S.white, marginBottom: "4px" }}>Promote to Operator (OP)</div>
            <div style={{ fontSize: "11px", color: S.muted, marginBottom: "12px" }}>Grant full admin/moderator permissions.</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input type="text" placeholder="Player username" value={opInput} onChange={(e) => setOpInput(e.target.value)} style={{ flex: 1, backgroundColor: S.input, border: `1px solid ${S.inputBdr}`, color: S.white, padding: "5px 8px", fontSize: "12px", outline: "none" }} />
              <button onClick={() => { if (!opInput.trim()) return; handleAction(`op ${opInput.trim()}`); setOpInput(""); }} className="button-hover" style={{ backgroundColor: S.cyan, border: "none", color: "#1a1a1a", padding: "5px 12px", fontSize: "11px", cursor: "pointer", borderRadius: "2px", fontWeight: "bold" }}>OP</button>
            </div>
          </div>

          {/* Ban Player */}
          <div style={{ border: `1px solid ${S.border}`, backgroundColor: S.content, padding: "16px", borderRadius: "3px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: S.white, marginBottom: "4px" }}>Ban Player</div>
            <div style={{ fontSize: "11px", color: S.muted, marginBottom: "12px" }}>Prevent player from connecting to the server.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <input type="text" placeholder="Player username" value={banPlayerInput} onChange={(e) => setBanPlayerInput(e.target.value)} style={{ backgroundColor: S.input, border: `1px solid ${S.inputBdr}`, color: S.white, padding: "5px 8px", fontSize: "12px", outline: "none" }} />
              <div style={{ display: "flex", gap: "8px" }}>
                <input type="text" placeholder="Reason (optional)" value={banReasonInput} onChange={(e) => setBanReasonInput(e.target.value)} style={{ flex: 1, backgroundColor: S.input, border: `1px solid ${S.inputBdr}`, color: S.white, padding: "5px 8px", fontSize: "12px", outline: "none" }} />
                <button onClick={() => { if (!banPlayerInput.trim()) return; const cmd = banReasonInput.trim() ? `ban ${banPlayerInput.trim()} ${banReasonInput.trim()}` : `ban ${banPlayerInput.trim()}`; handleAction(cmd); setBanPlayerInput(""); setBanReasonInput(""); }} className="button-hover" style={{ backgroundColor: "#ff4d4d", border: "none", color: S.white, padding: "5px 12px", fontSize: "11px", cursor: "pointer", borderRadius: "2px", fontWeight: "bold" }}>Ban</button>
              </div>
            </div>
          </div>
        </div>

        {/* Send action commands */}
        <div style={{ border: `1px solid ${S.border}`, backgroundColor: S.content, padding: "16px", borderRadius: "3px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: S.white, marginBottom: "10px" }}>Quick Management Command</div>
          <form onSubmit={sendUserCmd} style={{ display: "flex", gap: "10px" }}>
            <input type="text" placeholder="e.g. whitelist add Notch, op agreeable_guy, ban Herobrine..." value={userCmd} onChange={(e) => setUserCmd(e.target.value)} style={{ flex: 1, backgroundColor: S.input, border: `1px solid ${S.inputBdr}`, color: S.white, padding: "8px 12px", fontSize: "13px", outline: "none" }} />
            <Btn label="Run Command" color={S.cyan} onClick={() => {}} />
          </form>
        </div>

        {/* Players Listing Table */}
        <div style={{ border: `1px solid ${S.border}`, backgroundColor: S.content, borderRadius: "3px", overflow: "hidden" }}>
          {loadingUsers ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", gap: "10px", color: S.muted }}>
              <div className="spinner" />
              <span>Loading player files...</span>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${S.border}`, backgroundColor: S.bg, color: S.muted, textAlign: "left" }}>
                  <th style={{ padding: "8px 12px" }}>{userList === "banned-ips" ? "IP Address" : "UUID"}</th>
                  <th style={{ padding: "8px 12px" }}>{userList === "banned-ips" ? "Banned On" : "Username"}</th>
                  {userList === "ops" && <th style={{ padding: "8px 12px" }}>OP Level</th>}
                  {userList === "banned-players" && (
                    <>
                      <th style={{ padding: "8px 12px" }}>Banned On</th>
                      <th style={{ padding: "8px 12px" }}>Reason</th>
                    </>
                  )}
                  {userList === "banned-ips" && (
                    <>
                      <th style={{ padding: "8px 12px" }}>Banned By</th>
                      <th style={{ padding: "8px 12px" }}>Reason</th>
                    </>
                  )}
                  {userList === "all-players" && (
                    <th style={{ padding: "8px 12px" }}>Last Seen</th>
                  )}
                  <th style={{ padding: "8px 12px", width: "240px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: S.muted, fontStyle: "italic" }}>
                      This list is empty. No players found.
                    </td>
                  </tr>
                ) : (
                  players.map((p) => (
                    <tr key={p.uuid || p.name || p.ip} className="tab-hover" style={{ borderBottom: `1px solid ${S.border}` }}>
                      <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: "11.5px", color: S.muted }}>
                        {userList === "banned-ips" ? (p.ip || "–") : (p.uuid || "–")}
                      </td>
                      <td style={{ padding: "8px 12px", fontWeight: "bold", color: S.white }}>
                        {userList === "banned-ips" ? (p.created || "–") : p.name}
                      </td>
                      {userList === "ops" && <td style={{ padding: "8px 12px", color: S.cyan }}>{p.level || "4"}</td>}
                      {userList === "banned-players" && (
                        <>
                          <td style={{ padding: "8px 12px", color: S.muted }}>{p.created || "–"}</td>
                          <td style={{ padding: "8px 12px", color: S.orange }}>{p.reason || "No reason given"}</td>
                        </>
                      )}
                      {userList === "banned-ips" && (
                        <>
                          <td style={{ padding: "8px 12px", color: S.muted }}>{p.source || "–"}</td>
                          <td style={{ padding: "8px 12px", color: S.orange }}>{p.reason || "No reason given"}</td>
                        </>
                      )}
                      {userList === "all-players" && (
                        <td style={{ padding: "8px 12px", color: S.muted }}>{p.expiresOn ? p.expiresOn.split(" ")[0] : "–"}</td>
                      )}
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "5px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                          {userList === "ops" && (<>
                            <button onClick={() => handleAction(`deop ${p.name}`)} className="button-hover" style={{ backgroundColor: "transparent", color: S.orange, border: `1px solid ${S.orange}`, cursor: "pointer", padding: "2px 8px", fontSize: "11px", borderRadius: "2px" }}>De-OP</button>
                            <button onClick={() => handleAction(`whitelist add ${p.name}`)} className="button-hover" style={{ backgroundColor: "transparent", color: S.cyan, border: `1px solid ${S.cyan}`, cursor: "pointer", padding: "2px 8px", fontSize: "11px", borderRadius: "2px" }}>+Whitelist</button>
                            <button onClick={() => handleAction(`ban ${p.name}`)} className="button-hover" style={{ backgroundColor: "transparent", color: S.red, border: `1px solid ${S.red}`, cursor: "pointer", padding: "2px 8px", fontSize: "11px", borderRadius: "2px" }}>Ban</button>
                          </>)}
                          {userList === "whitelist" && (<>
                            <button onClick={() => handleAction(`op ${p.name}`)} className="button-hover" style={{ backgroundColor: "transparent", color: S.green, border: `1px solid ${S.green}`, cursor: "pointer", padding: "2px 8px", fontSize: "11px", borderRadius: "2px" }}>OP</button>
                            <button onClick={() => handleAction(`whitelist remove ${p.name}`)} className="button-hover" style={{ backgroundColor: "transparent", color: S.orange, border: `1px solid ${S.orange}`, cursor: "pointer", padding: "2px 8px", fontSize: "11px", borderRadius: "2px" }}>Remove</button>
                            <button onClick={() => handleAction(`ban ${p.name}`)} className="button-hover" style={{ backgroundColor: "transparent", color: S.red, border: `1px solid ${S.red}`, cursor: "pointer", padding: "2px 8px", fontSize: "11px", borderRadius: "2px" }}>Ban</button>
                          </>)}
                          {userList === "banned-players" && (<>
                            <button onClick={() => handleAction(`pardon ${p.name}`)} className="button-hover" style={{ backgroundColor: "transparent", color: S.cyan, border: `1px solid ${S.cyan}`, cursor: "pointer", padding: "2px 8px", fontSize: "11px", borderRadius: "2px" }}>Pardon</button>
                          </>)}
                          {userList === "banned-ips" && (
                            <button onClick={() => handleAction(`pardon-ip ${p.ip}`)} className="button-hover" style={{ backgroundColor: "transparent", color: S.cyan, border: `1px solid ${S.cyan}`, cursor: "pointer", padding: "2px 8px", fontSize: "11px", borderRadius: "2px" }}>Pardon IP</button>
                          )}
                          {userList === "all-players" && (<>
                            <button onClick={() => handleAction(`gamemode creative ${p.name}`)} className="button-hover" style={{ backgroundColor: "transparent", color: "#a855f7", border: `1px solid #a855f7`, cursor: "pointer", padding: "2px 8px", fontSize: "11px", borderRadius: "2px" }}>Creative</button>
                            <button onClick={() => handleAction(`gamemode survival ${p.name}`)} className="button-hover" style={{ backgroundColor: "transparent", color: S.green, border: `1px solid ${S.green}`, cursor: "pointer", padding: "2px 8px", fontSize: "11px", borderRadius: "2px" }}>Survival</button>
                            <button onClick={() => handleAction(`clear ${p.name}`)} className="button-hover" style={{ backgroundColor: "transparent", color: S.orange, border: `1px solid ${S.orange}`, cursor: "pointer", padding: "2px 8px", fontSize: "11px", borderRadius: "2px" }}>Clear Inv</button>
                            <button onClick={() => handleAction(`clear-data ${p.uuid} ${p.name}`)} className="button-hover" style={{ backgroundColor: "transparent", color: "#ef4444", border: `1px solid #ef4444`, cursor: "pointer", padding: "2px 8px", fontSize: "11px", borderRadius: "2px" }}>Clear Data</button>
                            <button onClick={() => handleAction(`kill ${p.name}`)} className="button-hover" style={{ backgroundColor: "transparent", color: S.red, border: `1px solid ${S.red}`, cursor: "pointer", padding: "2px 8px", fontSize: "11px", borderRadius: "2px" }}>Kill</button>
                            <button onClick={() => handleAction(`xp add ${p.name} 30 levels`)} className="button-hover" style={{ backgroundColor: "transparent", color: "#10b981", border: `1px solid #10b981`, cursor: "pointer", padding: "2px 8px", fontSize: "11px", borderRadius: "2px" }}>+30 LVL</button>
                          </>)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
