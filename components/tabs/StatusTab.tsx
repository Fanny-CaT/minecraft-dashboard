"use client";

import { S } from "@/lib/constants";
import { SparklineChart } from "@/components/SparklineChart";
import { BarChart } from "@/components/BarChart";
import type { StatusData } from "@/lib/types";

import { Card, CardHeader, SparkCard } from "@/components/ui/Cards";

// VersionManager has been moved to SoftwareTab.tsx

// ─── Main StatusTab export ────────────────────────────────────────────────────

interface StatusTabProps {
  statusData: StatusData | null;
  isOnline: boolean;
  cpuHistory: number[];
  ramHistory: number[];
  tpsHistory: number[];
  cpuPct: number;
  ramMb: number;
  maxRamMb: number;
  ramBoostOffset: number;
  hasStatsMod: boolean;
  setHasStatsMod: (v: boolean) => void;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  boostRam: () => void;
  boostingRam: boolean;
  mounted: boolean;
  fmtBytes: (n: number) => string;
  actionLoading: string | null;
  doPower: (action: string) => void;
  uptimeDisplay: string;
  TabHeader: React.FC<any>;
  players?: any[];
  logs?: string[];
}

export function StatusTab({
  statusData,
  isOnline,
  cpuHistory,
  ramHistory,
  tpsHistory,
  cpuPct,
  ramMb,
  maxRamMb,
  ramBoostOffset,
  hasStatsMod,
  setHasStatsMod,
  showToast,
  boostRam,
  boostingRam,
  mounted,
  fmtBytes,
  actionLoading,
  doPower,
  uptimeDisplay,
  TabHeader,
  players = [],
  logs = [],
}: StatusTabProps) {
  const tpsVal = tpsHistory.length ? tpsHistory[tpsHistory.length - 1] : 20;
  const cpuVal = cpuHistory.length ? cpuHistory[cpuHistory.length - 1] : 0;
  const ramVal = ramHistory.length ? ramHistory[ramHistory.length - 1] : 0;

  const tpsColor = !isOnline
    ? S.muted
    : tpsVal < 15
    ? S.red
    : tpsVal < 19
    ? S.orange
    : "#10b981";

  const tpsLabel = !isOnline
    ? "OFFLINE"
    : tpsVal < 15
    ? "CRITICAL"
    : tpsVal < 19
    ? "DEGRADED"
    : "HEALTHY";

  const cpuColor = cpuVal > 90 ? S.red : S.orange;
  const ramColor = ramVal > 90 ? S.red : S.cyan;

  const sampleMin = Math.round((tpsHistory.length * 5) / 60);

  return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <TabHeader label="Status & Control" icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>} />

          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* SERVER STATUS HERO CARD */}
            <div
              className="glass-card"
              style={{
                borderRadius: "8px",
                padding: "20px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "20px",
                position: "relative",
                overflow: "hidden"
              }}
            >
              {/* Left side: Server Identity */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1.5px", color: S.cyan }}>
                    Server Instance
                  </span>
                  <span style={{ fontSize: "10px", color: S.muted, fontFamily: "monospace", background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "150px" }}>
                    {statusData?.serverId ? `ID: ${statusData.serverId.substring(0, 36)}` : "ID: ········"}
                  </span>
                </div>
                <h1 style={{ fontSize: "22px", fontWeight: 700, color: S.white, letterSpacing: "-0.5px", margin: 0 }}>
                  MeowTopia Server
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px", fontSize: "12px", color: S.muted }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.7 }}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                    <path d="M2 12h20" />
                  </svg>
                  <span style={{ fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>
                    {statusData?.ip ? statusData.ip.substring(0, 64) : "play.meowtopia.mooo.com:25565"}
                  </span>
                </div>
              </div>

              {/* Center: Live Status Indicator */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", zIndex: 1, minWidth: "150px" }}>
                {actionLoading ? (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(221, 136, 0, 0.1)",
                    border: "1px solid rgba(221, 136, 0, 0.3)",
                    padding: "6px 14px",
                    borderRadius: "3px",
                    color: "#ffaa33",
                    fontWeight: "bold",
                    fontSize: "12px",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase"
                  }}>
                    <span className="spinner-mini" style={{ borderTopColor: "#ffaa33", width: "10px", height: "10px" }} />
                    {actionLoading}ING
                  </div>
                ) : statusData?.status === "online" ? (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(68, 170, 68, 0.1)",
                    border: "1px solid rgba(68, 170, 68, 0.3)",
                    padding: "6px 14px",
                    borderRadius: "3px",
                    color: "#66cc66",
                    fontWeight: "bold",
                    fontSize: "12px",
                    letterSpacing: "0.5px"
                  }}>
                    <span style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      backgroundColor: "#44aa44",
                      display: "inline-block"
                    }} />
                    ONLINE
                  </div>
                ) : statusData?.status === "starting" || statusData?.status === "stopping" ? (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(255, 170, 51, 0.1)",
                    border: "1px solid rgba(255, 170, 51, 0.3)",
                    padding: "6px 14px",
                    borderRadius: "3px",
                    color: S.orange,
                    fontWeight: "bold",
                    fontSize: "12px",
                    letterSpacing: "0.5px"
                  }}>
                    <span style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      backgroundColor: S.orange,
                      display: "inline-block"
                    }} />
                    {statusData?.status.toUpperCase()}
                  </div>
                ) : (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(204, 51, 51, 0.1)",
                    border: "1px solid rgba(204, 51, 51, 0.3)",
                    padding: "6px 14px",
                    borderRadius: "3px",
                    color: "#ff6666",
                    fontWeight: "bold",
                    fontSize: "12px",
                    letterSpacing: "0.5px"
                  }}>
                    <span style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      backgroundColor: "#cc3333",
                      display: "inline-block"
                    }} />
                    OFFLINE
                  </div>
                )}

                <span style={{ fontSize: "11px", color: S.muted, fontWeight: 500, fontFamily: "monospace" }}>
                  {isOnline ? `Uptime: ${uptimeDisplay}` : "Process Stopped"}
                </span>
              </div>

              {/* Right side: Power Controls */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center", zIndex: 1 }}>
                {/* Start Button */}
                <button
                  disabled={isOnline || !!actionLoading}
                  onClick={() => doPower("start")}
                  title="Start Server"
                  className="button-hover"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    backgroundColor: isOnline || !!actionLoading ? "rgba(255,255,255,0.02)" : "rgba(68, 170, 68, 0.08)",
                    border: `1px solid ${isOnline || !!actionLoading ? "rgba(255,255,255,0.05)" : "rgba(68, 170, 68, 0.3)"}`,
                    borderRadius: "3px",
                    color: isOnline || !!actionLoading ? S.muted : "#66cc66",
                    fontSize: "11.5px",
                    fontWeight: "bold",
                    cursor: isOnline || !!actionLoading ? "not-allowed" : "pointer",
                    opacity: isOnline || !!actionLoading ? 0.4 : 1,
                    pointerEvents: isOnline || !!actionLoading ? "none" : "auto",
                    transition: "all 0.1s ease"
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M3 2l10 6-10 6z" />
                  </svg>
                  Start
                </button>

                {/* Restart Button */}
                <button
                  disabled={!mounted || !isOnline || !!actionLoading}
                  onClick={() => doPower("restart")}
                  title="Restart Server"
                  className="button-hover"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    backgroundColor: !isOnline || !!actionLoading ? "rgba(255,255,255,0.02)" : "rgba(78, 201, 225, 0.08)",
                    border: `1px solid ${!isOnline || !!actionLoading ? "rgba(255,255,255,0.05)" : "rgba(78, 201, 225, 0.3)"}`,
                    borderRadius: "3px",
                    color: !isOnline || !!actionLoading ? S.muted : "#4ec9e1",
                    fontSize: "11.5px",
                    fontWeight: "bold",
                    cursor: !isOnline || !!actionLoading ? "not-allowed" : "pointer",
                    opacity: !isOnline || !!actionLoading ? 0.4 : 1,
                    pointerEvents: !isOnline || !!actionLoading ? "none" : "auto",
                    transition: "all 0.1s ease"
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M2 8a6 6 0 1 1 2.5 5" />
                    <polyline points="1.5,10.5 2.5,13.5 5.5,12.5" />
                  </svg>
                  Restart
                </button>

                {/* Stop Button */}
                <button
                  disabled={!mounted || !isOnline || !!actionLoading}
                  onClick={() => doPower("stop")}
                  title="Stop Server"
                  className="button-hover"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    backgroundColor: !isOnline || !!actionLoading ? "rgba(255,255,255,0.02)" : "rgba(204, 51, 51, 0.08)",
                    border: `1px solid ${!isOnline || !!actionLoading ? "rgba(255,255,255,0.05)" : "rgba(204, 51, 51, 0.3)"}`,
                    borderRadius: "3px",
                    color: !isOnline || !!actionLoading ? S.muted : "#ff6666",
                    fontSize: "11.5px",
                    fontWeight: "bold",
                    cursor: !isOnline || !!actionLoading ? "not-allowed" : "pointer",
                    opacity: !isOnline || !!actionLoading ? 0.4 : 1,
                    pointerEvents: !isOnline || !!actionLoading ? "none" : "auto",
                    transition: "all 0.1s ease"
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="3" y="3" width="10" height="10" />
                  </svg>
                  Stop
                </button>

                {/* Force Kill Button */}
                <button
                  disabled={!!actionLoading}
                  onClick={() => doPower("kill")}
                  title="Force Kill Server"
                  className="button-hover"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    backgroundColor: !!actionLoading ? "rgba(255,255,255,0.02)" : "rgba(136, 136, 136, 0.05)",
                    border: `1px solid ${!!actionLoading ? "rgba(255,255,255,0.05)" : "rgba(136, 136, 136, 0.25)"}`,
                    borderRadius: "3px",
                    color: S.muted,
                    fontSize: "11.5px",
                    fontWeight: "bold",
                    cursor: !!actionLoading ? "not-allowed" : "pointer",
                    opacity: !!actionLoading ? 0.4 : 1,
                    pointerEvents: !!actionLoading ? "none" : "auto",
                    transition: "all 0.1s ease"
                  }}
                >
                  <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M1 1l14 14M15 1l-14 14" />
                  </svg>
                  Kill
                </button>
              </div>
            </div>

        {/* Player List & Console Preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Card>
            <CardHeader title="Live Server Activity" subtitle="Players currently online and recent console logs" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px", marginTop: "4px" }}>
              {/* Players */}
              <div className="glass-card" style={{ borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ padding: "10px", borderBottom: `1px solid ${S.border}`, fontSize: "11px", fontWeight: "bold", color: S.muted, display: "flex", justifyContent: "space-between", letterSpacing: "1px" }}>
                  <span>PLAYERS</span>
                  <span style={{ color: S.cyan }}>{isOnline ? (statusData?.onlinePlayers || []).length : 0} ONLINE</span>
                </div>
                <div style={{ height: "240px", overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {!isOnline ? (
                    <div style={{ color: S.muted, fontSize: "11px", textAlign: "center", marginTop: "20px" }}>Server offline</div>
                  ) : (statusData?.onlinePlayers || []).length === 0 ? (
                    <div style={{ color: S.muted, fontSize: "11px", textAlign: "center", marginTop: "20px" }}>No players online</div>
                  ) : (
                    (statusData?.onlinePlayers || []).map((p, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", padding: "6px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "4px" }}>
                        <img src={`https://minotar.net/helm/${p.name}/24.png`} alt={p.name} style={{ width: "24px", height: "24px", borderRadius: "3px" }} />
                        <span>{p.name}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Console Preview */}
              <div className="glass-card" style={{ borderRadius: "8px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "10px", borderBottom: `1px solid ${S.border}`, fontSize: "11px", fontWeight: "bold", color: S.muted, letterSpacing: "1px" }}>
                  LATEST LOGS
                </div>
                <div style={{ height: "240px", overflowY: "auto", padding: "10px", fontFamily: "monospace", fontSize: "11px", color: "#ccc", display: "flex", flexDirection: "column-reverse" }}>
                  {logs.slice(-30).reverse().map((log, i) => (
                    <div key={i} style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px" }}>
                      {log.replace(/\[\d{2}:\d{2}:\d{2} \w+\]:? /g, "").substring(0, 150)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Performance History sparklines */}
        <Card style={{ gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <CardHeader
              title="Performance History"
              subtitle={`Live metrics · last ${sampleMin} min of data (${tpsHistory.length} samples @ 5s)`}
            />
            <div style={{ fontSize: "10px", color: S.muted, textAlign: "right" }}>
              <div>Polling every 5s</div>
              <div style={{ color: isOnline ? S.green : S.red, fontWeight: "bold", marginTop: "2px" }}>
                {isOnline ? "● LIVE" : "○ OFFLINE"}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
            <SparkCard
              title="Ticks Per Second (TPS)"
              value={!isOnline ? "–" : tpsVal.toFixed(1)}
              sub="Target: 20.0 · Below 15 = unplayable"
              valueColor={tpsColor}
              data={tpsHistory}
              sparkColor={tpsColor}
              gradientId="spark-tps"
              max={20}
              badge={isOnline ? { label: tpsLabel, color: tpsColor } : undefined}
            />
            <SparkCard
              title="CPU Usage"
              value={!isOnline ? "–" : `${cpuVal.toFixed(1)}%`}
              sub={statusData?.maxCpus ? `${statusData.maxCpus} cores allocated` : "No core limit"}
              valueColor={cpuColor}
              data={cpuHistory}
              sparkColor={S.orange}
              gradientId="spark-cpu"
              max={100}
            />
            <SparkCard
              title="Memory Usage"
              value={!isOnline ? "–" : `${ramVal.toFixed(1)}%`}
              sub={`${Math.max(0, Math.round((statusData?.memory || 0) / 1024 / 1024))} MB / ${Math.round((statusData?.maxMemory || 0) / 1024 / 1024)} MB`}
              valueColor={ramColor}
              data={ramHistory}
              sparkColor={S.cyan}
              gradientId="spark-ram"
              max={100}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
