import React, { useState } from "react";
import { S } from "@/lib/constants";
import { Card, CardHeader } from "./StatusTab";

// ─── Supported Providers & Versions ──────────────────────────────────────────

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: S.muted,
  marginBottom: "8px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const PROVIDERS = [
  { id: "paper", name: "PaperMC", desc: "High performance (Recommended)" },
  { id: "purpur", name: "Purpur", desc: "Feature-rich Paper fork" },
  { id: "vanilla", name: "Vanilla", desc: "Official unmodified server" },
  { id: "spigot", name: "Spigot", desc: "Legacy plugin support" },
];

const VERSIONS: Record<string, { value: string; label: string; tag?: string }[]> = {
  paper: [
    { value: "1.21.11", label: "1.21.11", tag: "Latest" },
    { value: "1.21.4",  label: "1.21.4",  tag: "Stable" },
    { value: "1.21.1",  label: "1.21.1" },
    { value: "1.20.4",  label: "1.20.4",  tag: "Recommended" },
    { value: "1.20.1",  label: "1.20.1",  tag: "Popular Modded" },
    { value: "1.19.4",  label: "1.19.4" },
    { value: "1.18.2",  label: "1.18.2" },
    { value: "1.16.5",  label: "1.16.5",  tag: "Legacy" },
  ],
  purpur: [
    { value: "1.21.11", label: "1.21.11", tag: "Latest" },
    { value: "1.21.4",  label: "1.21.4",  tag: "Stable" },
    { value: "1.21.1",  label: "1.21.1" },
    { value: "1.20.4",  label: "1.20.4" },
    { value: "1.20.1",  label: "1.20.1" },
  ],
  vanilla: [
    { value: "1.21.4",  label: "1.21.4",  tag: "Latest" },
    { value: "1.21.1",  label: "1.21.1" },
    { value: "1.20.4",  label: "1.20.4" },
    { value: "1.20.1",  label: "1.20.1" },
    { value: "1.19.4",  label: "1.19.4" },
    { value: "1.12.2",  label: "1.12.2",  tag: "Legacy" },
  ],
  spigot: [
    { value: "1.21.4",  label: "1.21.4",  tag: "Latest" },
    { value: "1.21.1",  label: "1.21.1" },
    { value: "1.20.4",  label: "1.20.4" },
    { value: "1.20.1",  label: "1.20.1" },
    { value: "1.16.5",  label: "1.16.5" },
    { value: "1.8.8",   label: "1.8.8",   tag: "PvP Classic" },
  ],
};

interface SoftwareTabProps {
  currentVersion: string | undefined;
  selectedVersion: string;
  setSelectedVersion: (v: string) => void;
  reinstalling: boolean;
  onInstallClick: (provider: string, version: string) => void;
}

export function SoftwareTab({
  currentVersion,
  selectedVersion,
  setSelectedVersion,
  reinstalling,
  onInstallClick,
}: SoftwareTabProps) {
  const [selectedProvider, setSelectedProvider] = useState("paper");
  const isSameVersion = selectedVersion === currentVersion && selectedProvider === "paper"; // Simplification for now

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <Card>
        <CardHeader title="Server Software" subtitle="Change provider or reinstall your server version" />

        {/* Provider Selection */}
        <div style={{ marginBottom: "20px" }}>
          <span style={{ ...LABEL_STYLE, marginBottom: "10px" }}>Select Provider</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
            {PROVIDERS.map((p) => {
              const isSelected = p.id === selectedProvider;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProvider(p.id);
                    // Reset version selection if current selection doesn't exist in new provider
                    const hasVersion = VERSIONS[p.id].find(v => v.value === selectedVersion);
                    if (!hasVersion) setSelectedVersion(VERSIONS[p.id][0].value);
                  }}
                  className="button-hover"
                  style={{
                    padding: "14px",
                    backgroundColor: isSelected ? "rgba(59, 130, 246, 0.12)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isSelected ? S.cyan : S.border}`,
                    borderRadius: "4px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ color: isSelected ? S.cyan : S.white, fontWeight: "bold", fontSize: "14px", marginBottom: "4px" }}>
                    {p.name}
                  </div>
                  <div style={{ color: S.muted, fontSize: "11px" }}>
                    {p.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Version grid */}
        <div>
          <span style={{ ...LABEL_STYLE, marginBottom: "10px" }}>Select Target Version</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "8px" }}>
            {(VERSIONS[selectedProvider] || []).map((v) => {
              // Mark as current only if the provider is paper (since we don't track provider properly yet)
              const isCurrent = v.value === currentVersion && selectedProvider === "paper";
              const isSelected = v.value === selectedVersion;
              return (
                <button
                  key={v.value}
                  onClick={() => setSelectedVersion(v.value)}
                  className="button-hover"
                  style={{
                    padding: "10px 8px",
                    backgroundColor: isSelected
                      ? "rgba(59, 130, 246, 0.12)"
                      : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isSelected ? S.cyan : isCurrent ? "rgba(16,185,129,0.35)" : S.border}`,
                    borderRadius: "3px",
                    color: isSelected ? S.cyan : isCurrent ? S.green : S.muted,
                    fontSize: "12px",
                    fontWeight: isSelected ? "bold" : 500,
                    fontFamily: "monospace",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.1s",
                    position: "relative",
                  }}
                >
                  {v.value}
                  {isCurrent && (
                    <span
                      style={{
                        display: "block",
                        fontSize: "8px",
                        color: S.green,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginTop: "2px",
                        fontFamily: "sans-serif",
                      }}
                    >
                      ● Current
                    </span>
                  )}
                  {!isCurrent && v.tag && (
                    <span
                      style={{
                        display: "block",
                        fontSize: "8px",
                        color: S.muted,
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                        marginTop: "2px",
                        fontFamily: "sans-serif",
                      }}
                    >
                      {v.tag}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Warning banner */}
        <div
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.06)",
            borderLeft: `3px solid ${S.red}`,
            padding: "12px 14px",
            borderRadius: "0 3px 3px 0",
            fontSize: "11px",
            color: "#fca5a5",
            lineHeight: "1.6",
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
            marginTop: "20px"
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: "1px", color: S.red }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>
            <strong style={{ color: S.red }}>Destructive operation.</strong> Installing a version permanently wipes all worlds, plugins, and configs.
            Only files inside <strong style={{ color: S.white }}>backups/</strong> are preserved. Back up first.
          </span>
        </div>

        {/* Action row */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginTop: "20px" }}>
          {reinstalling ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                backgroundColor: "rgba(239, 68, 68, 0.06)",
                border: `1px solid rgba(239, 68, 68, 0.2)`,
                borderRadius: "3px",
                color: "#fca5a5",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              <span className="spinner-mini" style={{ borderTopColor: S.red, width: "12px", height: "12px" }} />
              Reinstalling {selectedProvider} {selectedVersion}… Server is restarting.
            </div>
          ) : (
            <button
              onClick={() => onInstallClick(selectedProvider, selectedVersion)}
              disabled={isSameVersion}
              className="button-hover"
              style={{
                padding: "10px 20px",
                backgroundColor: isSameVersion ? "rgba(255,255,255,0.03)" : "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${isSameVersion ? S.border : S.red}`,
                color: isSameVersion ? S.muted : S.red,
                fontWeight: "bold",
                fontSize: "12px",
                borderRadius: "3px",
                cursor: isSameVersion ? "not-allowed" : "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
              {isSameVersion ? `Already on ${selectedProvider} ${selectedVersion}` : `Install ${selectedProvider} ${selectedVersion} & Reset`}
            </button>
          )}
          {isSameVersion && !reinstalling && (
            <span style={{ fontSize: "11px", color: S.muted }}>
              Select a different version or provider to enable reinstall.
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
