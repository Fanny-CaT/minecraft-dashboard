import React, { useState, useEffect } from "react";
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
  { id: "fabric", name: "Fabric", desc: "Lightweight Modloader" },
  { id: "vanilla", name: "Vanilla", desc: "Official unmodified server" },
];

export function SoftwareTab({
  currentVersion,
  onInstallClick,
  reinstalling,
}: {
  currentVersion?: string;
  onInstallClick: (provider: string, version: string) => void;
  reinstalling: boolean;
}) {
  const [provider, setProvider] = useState<string>("paper");
  const [selectedVersion, setSelectedVersion] = useState("");
  const [versions, setVersions] = useState<{ value: string; label: string; tag?: string }[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(true);

  // Fetch versions dynamically from official APIs
  useEffect(() => {
    let active = true;
    setLoadingVersions(true);
    setVersions([]);
    setSelectedVersion("");

    async function fetchVersions() {
      try {
        let list: any[] = [];
        if (provider === "paper") {
          const res = await fetch("https://api.papermc.io/v2/projects/paper");
          const data = await res.json();
          list = (data.versions || []).reverse().map((v: string) => ({ value: v, label: v }));
        } else if (provider === "purpur") {
          const res = await fetch("https://api.purpurmc.org/v2/purpur");
          const data = await res.json();
          list = (data.versions || []).reverse().map((v: string) => ({ value: v, label: v }));
        } else if (provider === "vanilla") {
          const res = await fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json");
          const data = await res.json();
          list = data.versions
            .filter((v: any) => v.type === "release")
            .map((v: any) => ({ value: v.id, label: v.id }));
        } else if (provider === "fabric") {
          const res = await fetch("https://meta.fabricmc.net/v2/versions/game");
          const data = await res.json();
          list = data.map((v: any) => ({ value: v.version, label: v.version, tag: v.stable ? "Stable" : "Snapshot" }));
        }

        // Tag the latest version
        if (list.length > 0 && !list[0].tag) {
          list[0].tag = "Latest";
        }

        if (active) {
          setVersions(list);
          if (list.length > 0) setSelectedVersion(list[0].value);
          setLoadingVersions(false);
        }
      } catch (err) {
        console.error("Failed to fetch versions for", provider, err);
        if (active) setLoadingVersions(false);
      }
    }
    fetchVersions();
    return () => { active = false; };
  }, [provider]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <Card>
        <CardHeader
          title="Software & Engine Manager"
          subtitle="Dynamically fetching the entire database of versions directly from official APIs."
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
          <div>
            <label style={LABEL_STYLE}>Software Engine</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {PROVIDERS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => !reinstalling && setProvider(p.id)}
                  style={{
                    padding: "14px",
                    backgroundColor: provider === p.id ? "rgba(59, 130, 246, 0.15)" : "#22252a",
                    border: `1px solid ${provider === p.id ? S.cyan : S.border}`,
                    borderRadius: "6px",
                    cursor: reinstalling ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    opacity: reinstalling && provider !== p.id ? 0.5 : 1,
                  }}
                >
                  <div style={{ color: provider === p.id ? S.cyan : S.white, fontWeight: "bold", fontSize: "14px" }}>
                    {p.name}
                  </div>
                  <div style={{ color: S.muted, fontSize: "12px", marginTop: "4px" }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={LABEL_STYLE}>Target Version</label>
              {loadingVersions ? (
                <div style={{ padding: "12px", color: S.muted, fontSize: "14px", border: `1px solid ${S.border}`, borderRadius: "4px" }}>
                  Fetching versions from database...
                </div>
              ) : (
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  disabled={reinstalling}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#22252a",
                    border: `1px solid ${S.border}`,
                    borderRadius: "4px",
                    color: S.white,
                    outline: "none",
                    cursor: reinstalling ? "not-allowed" : "pointer",
                  }}
                >
                  {versions.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label} {v.tag ? `— ${v.tag}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ marginTop: "auto" }}>
              <div
                style={{
                  padding: "15px",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  borderRadius: "6px",
                  marginBottom: "15px",
                }}
              >
                <div style={{ color: S.red, fontWeight: "bold", fontSize: "13px", marginBottom: "4px" }}>
                  ⚠️ Warning: Destructive Action
                </div>
                <div style={{ color: S.muted, fontSize: "12px", lineHeight: "1.5" }}>
                  Reinstalling the server software will stop the server and reset the underlying binaries. Your <b>world/</b>, <b>logs/</b>, and <b>plugins/</b> will be preserved, but always make a backup first!
                </div>
              </div>

              <button
                onClick={() => onInstallClick(provider, selectedVersion)}
                disabled={reinstalling || !selectedVersion || loadingVersions}
                className="button-hover"
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: reinstalling ? "#2a2a2a" : S.red,
                  color: reinstalling ? S.muted : S.white,
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  fontSize: "14px",
                  cursor: reinstalling ? "not-allowed" : "pointer",
                  opacity: reinstalling ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                {reinstalling ? (
                  <>
                    <span className="spinner" style={{ width: "16px", height: "16px", border: "2px solid #555", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    {currentVersion === selectedVersion ? "Reinstalling" : "Installing"} {provider.toUpperCase()} {selectedVersion}...
                  </>
                ) : (
                  `${currentVersion === selectedVersion ? "Reinstall" : "Install"} ${PROVIDERS.find(p => p.id === provider)?.name} ${selectedVersion}`
                )}
              </button>
            </div>
          </div>
        </div>
      </Card>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
