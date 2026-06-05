"use client";

import { S } from "@/lib/constants";
import { SparklineChart } from "@/components/SparklineChart";
import { BarChart } from "@/components/BarChart";
import type { StatusData } from "@/lib/types";

// ─── Shared sub-components ──────────────────────────────────────────────────

/** Consistent label style across all stat displays */
const LABEL_STYLE: React.CSSProperties = {
  fontSize: "10px",
  color: S.muted,
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  display: "block",
};

/** Card wrapper used by every section */
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        backgroundColor: "#1c1c1c",
        border: `1px solid ${S.border}`,
        padding: "20px",
        borderRadius: "4px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 style={{ fontSize: "14px", fontWeight: "bold", color: S.white, margin: 0 }}>{title}</h2>
      <p style={{ fontSize: "11px", color: S.muted, margin: "4px 0 0" }}>{subtitle}</p>
    </div>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  desc: string;
  color?: string;
  locked?: boolean;
  offline?: boolean;
}

function StatCard({ label, value, desc, color = S.white, locked = false }: StatCardProps) {
  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "#161616",
        border: `1px solid ${S.border}`,
        borderRadius: "3px",
        padding: "16px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "96px",
        overflow: "hidden",
      }}
    >
      {locked && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(18,18,18,0.93)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2px",
            zIndex: 2,
          }}
        >
          <span style={{ fontSize: "10px", color: S.orange, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.6px" }}>
            Stats Mod
          </span>
          <span style={{ fontSize: "9px", color: S.muted, textTransform: "uppercase", letterSpacing: "0.6px" }}>
            Required
          </span>
        </div>
      )}
      <div style={{ filter: locked ? "blur(3px)" : "none", width: "100%", zIndex: 1 }}>
        <span style={LABEL_STYLE}>{label}</span>
        <div style={{ fontSize: "20px", fontWeight: 700, color, marginTop: "6px", fontFamily: "monospace" }}>
          {value}
        </div>
        <span style={{ fontSize: "10px", color: S.muted, marginTop: "4px", display: "block" }}>{desc}</span>
      </div>
    </div>
  );
}

// ─── SparkCard ───────────────────────────────────────────────────────────────

interface SparkCardProps {
  title: string;
  value: string;
  sub: string;
  valueColor: string;
  data: number[];
  sparkColor: string;
  gradientId: string;
  max: number;
  badge?: { label: string; color: string };
}

function SparkCard({ title, value, sub, valueColor, data, sparkColor, gradientId, max, badge }: SparkCardProps) {
  return (
    <div
      style={{
        backgroundColor: "#161616",
        border: `1px solid ${S.border}`,
        borderRadius: "3px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span style={LABEL_STYLE}>{title}</span>
          <div style={{ fontSize: "22px", fontWeight: 700, color: valueColor, fontFamily: "monospace", marginTop: "4px" }}>
            {value}
          </div>
          <div style={{ fontSize: "10px", color: S.muted, marginTop: "2px" }}>{sub}</div>
        </div>
        {badge && (
          <div
            style={{
              fontSize: "9px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: badge.color,
              border: `1px solid ${badge.color}`,
              borderRadius: "2px",
              padding: "2px 8px",
              opacity: 0.9,
              whiteSpace: "nowrap",
            }}
          >
            {badge.label}
          </div>
        )}
      </div>
      <div style={{ height: "52px", borderRadius: "2px", overflow: "hidden" }}>
        <SparklineChart data={data} color={sparkColor} gradientId={gradientId} max={max} height={52} />
      </div>
    </div>
  );
}

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
  heroSection: React.ReactNode;
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
  heroSection,
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
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Hero card */}
        {heroSection}

        {/* System + Diagnostics grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "20px" }}>

          {/* System Resources */}
          <Card>
            <CardHeader title="System Resources" subtitle="Process hardware usage overview" />
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* CPU */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: S.white, fontWeight: 500 }}>CPU Usage</span>
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: S.orange, fontFamily: "monospace" }}>{cpuPct.toFixed(1)}%</span>
                </div>
                <div style={{ height: "60px", border: `1px solid ${S.border}`, overflow: "hidden" }}>
                  <BarChart values={cpuHistory} color={S.chartOrange} />
                </div>
                <span style={{ fontSize: "10px", color: S.muted, marginTop: "4px", display: "block" }}>
                  {statusData?.maxCpus ? `${statusData.maxCpus} core limit` : "No core limit set"}
                </span>
              </div>
              {/* RAM */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: S.white, fontWeight: 500 }}>Memory Usage</span>
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: S.cyan, fontFamily: "monospace" }}>
                    {Math.max(0, (((statusData?.memory || 0) - ramBoostOffset * 1024 * 1024) / (statusData?.maxMemory || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div style={{ height: "60px", border: `1px solid ${S.border}`, overflow: "hidden" }}>
                  <BarChart values={ramHistory.map((v) => Math.max(0, v - ramBoostOffset / 1024))} color={S.chartBlue} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                  <span style={{ fontSize: "10px", color: S.muted }}>
                    {Math.max(0, Math.round(ramMb) - ramBoostOffset)} MB used / {maxRamMb} MB allocated
                  </span>
                  <button
                    onClick={boostRam}
                    disabled={!mounted || boostingRam || !isOnline}
                    className="button-hover"
                    style={{
                      display: "flex", alignItems: "center", gap: "4px",
                      padding: "4px 10px",
                      backgroundColor: boostingRam || !isOnline ? "rgba(255,255,255,0.02)" : "rgba(59,130,246,0.08)",
                      border: `1px solid ${boostingRam || !isOnline ? S.border : "rgba(59,130,246,0.3)"}`,
                      borderRadius: "3px",
                      color: boostingRam || !isOnline ? S.muted : S.cyan,
                      fontSize: "11px", fontWeight: "bold",
                      cursor: boostingRam || !isOnline ? "not-allowed" : "pointer",
                      opacity: isOnline ? 1 : 0.5,
                      pointerEvents: isOnline ? "auto" : "none",
                      transition: "all 0.1s",
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 22h20L12 2z" /></svg>
                    <span>{boostingRam ? "Boosting..." : "Boost RAM"}</span>
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Diagnostics & Telemetry */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <CardHeader title="Diagnostics & Telemetry" subtitle="In-game stats & network load" />
              <button
                onClick={() => {
                  setHasStatsMod(!hasStatsMod);
                  showToast(hasStatsMod ? "Stats Add-on disabled." : "Stats Add-on enabled.", hasStatsMod ? "info" : "success");
                }}
                className="tab-hover"
                style={{
                  padding: "4px 8px",
                  backgroundColor: hasStatsMod ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${hasStatsMod ? "rgba(16,185,129,0.3)" : S.border}`,
                  borderRadius: "3px",
                  color: hasStatsMod ? S.green : S.cyan,
                  fontSize: "11px", fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.1s",
                  whiteSpace: "nowrap",
                }}
              >
                {hasStatsMod ? "Stats Mod: Active" : "Enable Stats Mod"}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {[
                { label: "TPS", value: !isOnline ? "–" : (statusData?.tps || 20).toFixed(1), desc: "Target: 20.0", locked: !hasStatsMod && isOnline, color: tpsColor },
                { label: "Chunks", value: !isOnline ? "–" : (statusData?.loadedChunks || 0).toLocaleString(), desc: "Loaded regions", locked: !hasStatsMod && isOnline, color: S.cyan },
                { label: "Entities", value: !isOnline ? "–" : (statusData?.loadedEntities || 0).toLocaleString(), desc: "Active mobs/items", locked: !hasStatsMod && isOnline, color: S.orange },
                { label: "Disk Space", value: fmtBytes(statusData?.diskUsageBytes || 3.46 * 1024 * 1024 * 1024), desc: "World folder size", locked: false, color: S.white },
                { label: "Net In", value: !isOnline ? "0 B/s" : `${fmtBytes(statusData?.networkIncoming || 0)}/s`, desc: "Download rate", locked: false, color: S.white },
                { label: "Net Out", value: !isOnline ? "0 B/s" : `${fmtBytes(statusData?.networkOutgoing || 0)}/s`, desc: "Upload rate", locked: false, color: S.white },
              ].map((c) => (
                <StatCard key={c.label} label={c.label} value={c.value} desc={c.desc} color={c.color} locked={c.locked} />
              ))}
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
