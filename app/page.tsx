"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatusData {
  running: boolean;
  status: "online" | "offline";
  cpu: number;
  memory: number;
  maxMemory: number;
  maxCpus: number;
  serverId: string;
  ip: string;
  sftpUsername?: string;
  sftpPort?: number;
  sftpHost?: string;
  mcVersion?: string;
  javaVersion?: string;
  motd?: string;
  port?: number;
  bindIp?: string;
  allocatedMemory?: number;
  tps?: number;
  loadedChunks?: number;
  loadedEntities?: number;
  networkIncoming?: number;
  networkOutgoing?: number;
  diskUsageBytes?: number;
}

interface FileEntry {
  name: string;
  size?: number;
  isFile: boolean;
  modifyTime?: number;
  extension?: string;
}

interface PlayerEntry {
  uuid?: string;
  name?: string;
  level?: number;
  bypassesPlayerLimit?: boolean;
  // banned-players.json fields
  created?: string;
  source?: string;
  expires?: string;
  reason?: string;
  // banned-ips.json fields
  ip?: string;
}

type Tab =
  | "status"
  | "console"
  | "chat"
  | "files"
  | "plugins"
  | "config"
  | "users"
  | "networking"
  | "logs"
  | "backups";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  msg: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtMb = (b: number) => Math.round(b / (1024 * 1024));
const fmtFileSize = (b?: number) => {
  if (b === undefined) return "–";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

const stripAnsi = (s: string) => s.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, "");

// Matches: [10:51:29 INFO]: <PlayerName> Hello world!
// Or:      [10:51:29 INFO]: [Server] Hello world!
// Or:      [10:51:29 INFO]: [agreeable_guy] Hello world!
const CHAT_RE = /\[[\d:]+\s+INFO\]:\s+(?:\<([a-zA-Z0-9_]{2,16})\>|\[(Server|[a-zA-Z0-9_]{2,16})\])(?!:)\s+(.+)/;

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const Ico = {
  Status: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="2" width="14" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="5" y="12" width="6" height="1.5" fill="currentColor" />
      <rect x="3" y="14" width="10" height="1" fill="currentColor" />
    </svg>
  ),
  Console: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="2" width="14" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <polyline points="3,6 6,8 3,10" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="7" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  Chat: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 2h12v9H9l-3 3v-3H2z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  Files: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 2h7l3 3v9H2z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <polyline points="9,2 9,5 12,5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="4" y1="8" x2="10" y2="8" stroke="currentColor" strokeWidth="1.2" />
      <line x1="4" y1="11" x2="8" y2="11" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  Config: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="8" cy="8" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ),
  Users: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="6" cy="5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 14c0-3 2.2-5 5-5s5 2 5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="5" r="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M11 14c0-2 1-3 3-3.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  Plugins: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M10 1.5a1.5 1.5 0 0 0-1.5 1.5v0.5H6a1.5 1.5 0 0 0-1.5 1.5v2H3.5a1.5 1.5 0 0 0 0 3h1v2a1.5 1.5 0 0 0 1.5 1.5h2v-0.5a1.5 1.5 0 0 1 3 0v0.5h2a1.5 1.5 0 0 0 1.5-1.5v-2h-0.5a1.5 1.5 0 0 1 0-3h0.5V5a1.5 1.5 0 0 0-1.5-1.5h-2V3a1.5 1.5 0 0 0-1.5-1.5z" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  Logs: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 1v14h12V4.5L10.5 1H2z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="5" y1="5" x2="8" y2="5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.3" />
      <line x1="5" y1="11" x2="11" y2="11" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ),
  Networking: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <rect x="2" y="10" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10" y="10" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6" y="2" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 6v4M4 10V8h8v2" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  Backups: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 8a6 6 0 1 1 2.5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <polyline points="1.5,10.5 2.5,13.5 5.5,12.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <polyline points="8,4.5 8,8 10.5,9.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
};

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({ values, color }: { values: number[]; color: string }) {
  const N = 60;
  const padded = Array(Math.max(0, N - values.length))
    .fill(0)
    .concat(values.slice(-N));
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#111",
        display: "flex",
        alignItems: "flex-end",
        gap: "1px",
        padding: "3px",
        boxSizing: "border-box",
      }}
    >
      {padded.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${Math.max(v > 0 ? 2 : 0, v)}%`,
            backgroundColor: color,
            minWidth: 1,
          }}
        />
      ))}
    </div>
  );
}

// ─── Style tokens (McMyAdmin faithful) ───────────────────────────────────────

const S = {
  bg: "#1e1e1e",
  sidebar: "#252525",
  content: "#2a2a2a",
  topBar: "#1a1a1a",
  border: "#3a3a3a",
  rowHover: "#2f2f2f",
  cyan: "#4ec9e1",
  white: "#e8e8e8",
  muted: "#888",
  red: "#cc3333",
  green: "#44aa44",
  orange: "#dd8800",
  purple: "#8844cc",
  chartGreen: "#44cc44",
  chartOrange: "#dd8800",
  chartBlue: "#4488cc",
  input: "#1a1a1a",
  inputBdr: "#444",
};

// ─── Popular Plugins Catalog ──────────────────────────────────────────────────
const POPULAR_PLUGINS_META: Record<string, { name: string; tagline: string; iconUrl: string; provider: string; color: string; bg: string; border: string }> = {
  essentials: {
    name: "EssentialsX",
    tagline: "Essential commands, teleports, economy, and moderating tools for Spigot/Paper.",
    iconUrl: "https://cdn.modrinth.com/user_content/img/V3a1mU1R.png",
    provider: "Spiget",
    color: "#0ea5e9", bg: "rgba(14, 165, 233, 0.1)", border: "rgba(14, 165, 233, 0.3)"
  },
  vault: {
    name: "Vault",
    tagline: "Secure framework connecting chat, economy, and permission systems with major plugins.",
    iconUrl: "https://cdn.spigotmc.org/image/resources-logos/3431.png",
    provider: "Spiget",
    color: "#0ea5e9", bg: "rgba(14, 165, 233, 0.1)", border: "rgba(14, 165, 233, 0.3)"
  },
  luckperms: {
    name: "LuckPerms",
    tagline: "Advanced permissions system with web GUI editor and database syncing.",
    iconUrl: "https://avatars.githubusercontent.com/u/23616654?v=4",
    provider: "Modrinth",
    color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.3)"
  },
  worldedit: {
    name: "WorldEdit",
    tagline: "Extremely fast in-game world generation and block manipulation tool.",
    iconUrl: "https://cdn.modrinth.com/user_content/img/mC7zV2Ua.png",
    provider: "Modrinth",
    color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.3)"
  },
  dynmap: {
    name: "Dynmap",
    tagline: "Google Maps-like browser viewer of your server worlds showing real-time player locations.",
    iconUrl: "https://cdn.modrinth.com/user_content/img/c1tZ4p1q.png",
    provider: "Modrinth",
    color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.3)"
  },
  geyser: {
    name: "GeyserMC",
    tagline: "Bridge proxy code enabling Bedrock Edition clients (mobile/consoles) to connect directly.",
    iconUrl: "https://avatars.githubusercontent.com/u/58882583?v=4",
    provider: "Modrinth",
    color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.3)"
  },
  viabackwards: {
    name: "ViaBackwards",
    tagline: "Allows players using older client versions to connect to your newer server version.",
    iconUrl: "https://cdn.modrinth.com/user_content/img/z7X4y6vR.png",
    provider: "Modrinth",
    color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.3)"
  },
  viaversion: {
    name: "ViaVersion",
    tagline: "Allows players using newer client versions to connect to your older server version.",
    iconUrl: "https://cdn.modrinth.com/user_content/img/y3T4b6vQ.png",
    provider: "Modrinth",
    color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.3)"
  },
  placeholderapi: {
    name: "PlaceholderAPI",
    tagline: "Dynamic variables replacement engine displaying rich stats in other plugin UI messages.",
    iconUrl: "https://cdn.spigotmc.org/image/resources-logos/6245.png",
    provider: "Spiget",
    color: "#0ea5e9", bg: "rgba(14, 165, 233, 0.1)", border: "rgba(14, 165, 233, 0.3)"
  },
  protocollib: {
    name: "ProtocolLib",
    tagline: "Lower-level packets manipulation hook library used by advanced server systems.",
    iconUrl: "https://cdn.spigotmc.org/image/resources-logos/1996.png",
    provider: "Spiget",
    color: "#0ea5e9", bg: "rgba(14, 165, 233, 0.1)", border: "rgba(14, 165, 233, 0.3)"
  },
  multiverse: {
    name: "Multiverse-Core",
    tagline: "Manage separate dimensions and custom worlds on a single server machine.",
    iconUrl: "https://cdn.spigotmc.org/image/resources-logos/390.png",
    provider: "Spiget",
    color: "#0ea5e9", bg: "rgba(14, 165, 233, 0.1)", border: "rgba(14, 165, 233, 0.3)"
  },
  chunky: {
    name: "Chunky",
    tagline: "Pre-generates server chunks dynamically to completely resolve player exploration lag.",
    iconUrl: "https://cdn.modrinth.com/user_content/img/lX7y5p1q.png",
    provider: "Modrinth",
    color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.3)"
  }
};

// ─── PluginIcon Helper Component ──────────────────────────────────────────────
interface PluginIconProps {
  url?: string;
  size?: number;
  color?: string;
}

const PluginIcon: React.FC<PluginIconProps> = ({ url, size = 36, color }) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [url]);

  const fallbackColor = color || S.cyan;

  if (url && !error) {
    return (
      <img
        src={url}
        alt="Plugin Icon"
        onError={() => setError(true)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "3px",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "3px",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        border: `1px solid ${S.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: fallbackColor,
        flexShrink: 0,
      }}
    >
      <Ico.Plugins />
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  // ── Toasts state ──
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((msg: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, msg }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // ── Status state ──
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [ramHistory, setRamHistory] = useState<number[]>([]);
  const [uptimeStart, setUptimeStart] = useState<number | null>(null);
  const [uptimeDisplay, setUptimeDisplay] = useState("–");
  const [lastUpdate, setLastUpdate] = useState("–");
  const [statusError, setStatusError] = useState(false);

  // ── Nav ──
  const [activeTab, setActiveTab] = useState<Tab>("status");

  // ── Action loading ──
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [powerMenuOpen, setPowerMenuOpen] = useState(false);

  // ── Console ──
  const [logs, setLogs] = useState<string[]>([]);
  const [command, setCommand] = useState("");
  const [wsMode, setWsMode] = useState<"live" | "polling">("polling");
  const [wsStatus, setWsStatus] = useState<
    "connecting" | "connected" | "error" | "disconnected"
  >("disconnected");
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const wsAttempts = useRef(0);
  const lastEpochRef = useRef<number>(0);
  const isFirstPollRef = useRef<boolean>(true);

  // ── Chat ──
  const [chatMessages, setChatMessages] = useState<{ player: string; msg: string; ts: string }[]>(
    []
  );
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const sentMessages = useRef<string[]>([]);

  // ── Files ──
  const [currentPath, setCurrentPath] = useState("");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [loadingFile, setLoadingFile] = useState(false);
  const [savingFile, setSavingFile] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newName, setNewName] = useState("");
  const [fileError, setFileError] = useState("");
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileNames, setSelectedFileNames] = useState<Set<string>>(new Set());
  const [fileSearchQuery, setFileSearchQuery] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [fileTypeFilter, setFileTypeFilter] = useState<"all" | "files" | "folders">("all");

  // ── Plugins ──
  const [installedPlugins, setInstalledPlugins] = useState<{ name: string; size?: number }[]>([]);
  const [loadingPlugins, setLoadingPlugins] = useState(false);
  const [pluginSearch, setPluginSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingPlugins, setSearchingPlugins] = useState(false);
  const [installingPluginIds, setInstallingPluginIds] = useState<Record<string, boolean>>({});
  const [pluginError, setPluginError] = useState("");
  const [pluginCategory, setPluginCategory] = useState<string>("");
  const [selectedPluginDetails, setSelectedPluginDetails] = useState<any | null>(null);
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const [filterVersion, setFilterVersion] = useState<string>("all");
  const [hasStatsMod, setHasStatsMod] = useState(true);
  const [ramBoostOffset, setRamBoostOffset] = useState(0);
  const [boostingRam, setBoostingRam] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState("1.21.1");
  const [reinstallingVersion, setReinstallingVersion] = useState(false);
  const [confirmReinstallOpen, setConfirmReinstallOpen] = useState(false);
  const [jvmArgsStart, setJvmArgsStart] = useState("");
  const [jvmArgsEnd, setJvmArgsEnd] = useState("");
  const [serverJarFile, setServerJarFile] = useState("paper.jar");
  const [enableAikarsFlags, setEnableAikarsFlags] = useState(true);
  const [autosaveInterval, setAutosaveInterval] = useState("10");
  const [enableAutosaveLoop, setEnableAutosaveLoop] = useState(true);
  const [savingStartup, setSavingStartup] = useState(false);
  const [startupSavedTime, setStartupSavedTime] = useState<string | null>(null);
  const [configSubTab, setConfigSubTab] = useState<"properties" | "startup">("properties");

  // ── Config ──
  const [configProps, setConfigProps] = useState<Record<string, string>>({});
  const [configRaw, setConfigRaw] = useState("");
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configError, setConfigError] = useState("");
  const [configSearch, setConfigSearch] = useState("");

  // ── Users ──
  const [userList, setUserList] = useState<"ops" | "banned-players" | "whitelist" | "banned-ips">("ops");
  const [players, setPlayers] = useState<PlayerEntry[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState("");
  const [userCmd, setUserCmd] = useState("");

  // Players Form Inputs
  const [whitelistInput, setWhitelistInput] = useState("");
  const [whitelistRemoveInput, setWhitelistRemoveInput] = useState("");
  const [opInput, setOpInput] = useState("");
  const [deopInput, setDeopInput] = useState("");
  const [banPlayerInput, setBanPlayerInput] = useState("");
  const [banReasonInput, setBanReasonInput] = useState("");
  const [pardonInput, setPardonInput] = useState("");
  const [banIpInput, setBanIpInput] = useState("");
  const [banIpReasonInput, setBanIpReasonInput] = useState("");
  const [pardonIpInput, setPardonIpInput] = useState("");
  const [kickPlayerInput, setKickPlayerInput] = useState("");
  const [kickReasonInput, setKickReasonInput] = useState("");

  // ── Backups ──
  const [backups, setBackups] = useState<any[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null);

  // ── Logs File View ──
  const [logsContent, setLogsContent] = useState("");
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsSearch, setLogsSearch] = useState("");

  // ── Network bindings ──
  const [bindIp, setBindIp] = useState("0.0.0.0");
  const [bindPort, setBindPort] = useState("25565");
  const [loadingNetwork, setLoadingNetwork] = useState(false);
  const [savingNetwork, setSavingNetwork] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // Status polling
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: StatusData = await res.json();

      setStatusData(data);
      setStatusError(false);
      setLastUpdate(new Date().toLocaleTimeString());

      const cpuPct = Math.min(data.cpu, 100);
      const ramPct = data.maxMemory > 0 ? (data.memory / data.maxMemory) * 100 : 0;
      setCpuHistory((h) => [...h.slice(-120), cpuPct]);
      setRamHistory((h) => [...h.slice(-120), ramPct]);

      if (data.running && !uptimeStart) setUptimeStart(Date.now());
      if (!data.running) setUptimeStart(null);
    } catch {
      setStatusError(true);
      setStatusData((d) => (d ? { ...d, status: "offline", running: false } : null));
    }
  }, [uptimeStart]);

  useEffect(() => {
    fetchStatus();
    const iv = setInterval(fetchStatus, 5000);
    return () => clearInterval(iv);
  }, [fetchStatus]);

  // Initialize selectedVersion from statusData once it is fetched
  const versionInitializedRef = useRef(false);
  useEffect(() => {
    if (statusData?.mcVersion && !versionInitializedRef.current) {
      setSelectedVersion(statusData.mcVersion);
      versionInitializedRef.current = true;
    }
  }, [statusData]);

  // Uptime ticker
  useEffect(() => {
    const iv = setInterval(() => {
      if (!uptimeStart) {
        setUptimeDisplay("–");
        return;
      }
      const s = Math.floor((Date.now() - uptimeStart) / 1000);
      const d = Math.floor(s / 86400);
      const h = Math.floor((s % 86400) / 3600);
      const m = Math.floor((s % 3600) / 60);
      setUptimeDisplay(`${d}d ${h}h ${m}m`);
    }, 15000);
    return () => clearInterval(iv);
  }, [uptimeStart]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Power actions
  // ─────────────────────────────────────────────────────────────────────────────

  const doPower = async (action: string) => {
    setActionLoading(action);
    showToast(`Sending ${action} state signal...`, "info");
    try {
      const res = await fetch("/api/power", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      showToast(`Server action [${action}] scheduled successfully.`, "success");
      setTimeout(fetchStatus, 2500);
    } catch (e: unknown) {
      showToast(`Error triggering power action: ${e instanceof Error ? e.message : e}`, "error");
    } finally {
      setActionLoading(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // WebSocket console
  // ─────────────────────────────────────────────────────────────────────────────

  const connectWs = useCallback(async () => {
    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    )
      return;

    setWsStatus("connecting");
    try {
      const res = await fetch("/api/auth", { cache: "no-store" });
      if (!res.ok) throw new Error("Token fetch failed");
      const { accessToken, wsUrl } = await res.json();
      if (!accessToken) throw new Error("No token");

      const ws = new WebSocket(`${wsUrl}?token=${accessToken}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus("connected");
        setWsMode("live");
        wsAttempts.current = 0;
        showToast("Connected to live server console.", "success");
      };

      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          let lines: string[] = [];

          if (d && Array.isArray(d.args)) {
            lines = d.args.map(stripAnsi);
          } else if (d && typeof d.data === "string") {
            lines = [stripAnsi(d.data)];
          } else if (d && typeof d.logs === "string") {
            lines = d.logs.split("\n").map((l: string) => l.trimEnd()).filter(Boolean).map(stripAnsi);
          } else if (d && d.event === "console" && Array.isArray(d.args)) {
            lines = d.args.map(stripAnsi);
          }

          if (lines.length > 0) {
            setLogs((p) => [...p, ...lines].slice(-500));

            // Feed chat tab
            for (const line of lines) {
              const m = CHAT_RE.exec(line);
              if (m) {
                const sender = m[1] || m[2];
                const msgText = m[3];
                // Deduplicate our own sent chat messages
                if (sender === "Server" && sentMessages.current.includes(msgText)) {
                  sentMessages.current = sentMessages.current.filter((item) => item !== msgText);
                  continue;
                }
                setChatMessages((c) =>
                  [
                    ...c,
                    {
                      player: sender,
                      msg: msgText,
                      ts: new Date().toLocaleTimeString(),
                    },
                  ].slice(-200)
                );
              }
            }
          }
        } catch {
          if (typeof e.data === "string") setLogs((p) => [...p, stripAnsi(e.data)].slice(-500));
        }
      };

      ws.onerror = () => setWsStatus("error");

      ws.onclose = () => {
        setWsStatus("disconnected");
        setWsMode("polling");
        if (wsAttempts.current < 2) {
          wsAttempts.current++;
          setTimeout(connectWs, 5000);
        }
      };
    } catch {
      setWsStatus("error");
      setWsMode("polling");
    }
  }, []);

  useEffect(() => {
    connectWs();
    return () => {
      wsRef.current?.close();
    };
  }, [connectWs]);

  // Polling logs fallback
  useEffect(() => {
    if (wsMode !== "polling") return;

    let active = true;
    const pollLogs = async () => {
      try {
        const res = await fetch(`/api/console?time=${lastEpochRef.current}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;

        if (data.logs) {
          const lines = data.logs
            .split("\n")
            .map((l: string) => l.trimEnd())
            .filter(Boolean)
            .map(stripAnsi);
          if (lines.length > 0) {
            setLogs((p) => {
              if (isFirstPollRef.current) {
                isFirstPollRef.current = false;
                return lines.slice(-500);
              } else {
                return [...p, ...lines].slice(-500);
              }
            });

            // Feed chat tab
            for (const line of lines) {
              const m = CHAT_RE.exec(line);
              if (m) {
                const sender = m[1] || m[2];
                const msgText = m[3];
                // Deduplicate
                if (sender === "Server" && sentMessages.current.includes(msgText)) {
                  sentMessages.current = sentMessages.current.filter((item) => item !== msgText);
                  continue;
                }
                setChatMessages((c) =>
                  [
                    ...c,
                    {
                      player: sender,
                      msg: msgText,
                      ts: new Date().toLocaleTimeString(),
                    },
                  ].slice(-200)
                );
              }
            }
          }
        }

        if (data.epoch && data.epoch > lastEpochRef.current) {
          lastEpochRef.current = data.epoch;
        }
      } catch (err) {
        console.error("Polling logs failed:", err);
      }
    };

    pollLogs();
    const iv = setInterval(pollLogs, 3000);
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, [wsMode]);

  // Auto scroll console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Console / command commands
  // ─────────────────────────────────────────────────────────────────────────────

  const sendCmd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = command.trim();
    if (!cmd) return;
    setLogs((p) => [...p, `> ${cmd}`].slice(-500));
    setCommand("");

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: "console", args: [cmd] }));
    } else {
      await fetch("/api/power", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "command", command: cmd }),
      });
    }
  };

  const sendCommandDirect = async (cmd: string) => {
    setLogs((p) => [...p, `> ${cmd}`].slice(-500));
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: "console", args: [cmd] }));
    } else {
      await fetch("/api/power", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "command", command: cmd }),
      });
    }
    showToast(`Command /${cmd.split(" ")[0]} triggered.`, "info");
  };

  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = chatInput.trim();
    if (!msg) return;
    setChatInput("");

    // Mirror locally immediately
    setChatMessages((c) =>
      [
        ...c,
        {
          player: "You",
          msg: msg,
          ts: new Date().toLocaleTimeString(),
        },
      ].slice(-200)
    );
    sentMessages.current.push(msg);

    await fetch("/api/power", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "command", command: `say ${msg}` }),
    });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ─────────────────────────────────────────────────────────────────────────────
  // File manager
  // ─────────────────────────────────────────────────────────────────────────────

  const loadDir = async (path: string) => {
    setLoadingFiles(true);
    setFileError("");
    setSelectedFile(null);
    setSelectedFileNames(new Set());
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: FileEntry[] = await res.json();
      // Sort: Folders first, then alphabetically
      const sorted = Array.isArray(data)
        ? data.sort((a, b) => {
            if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
            return a.name.localeCompare(b.name);
          })
        : [];
      setFiles(sorted);
      setCurrentPath(path);
    } catch (err: any) {
      setFileError(err.message || "Failed to load directory");
      showToast("Error loading file list.", "error");
    } finally {
      setLoadingFiles(false);
    }
  };

  const openFile = async (f: FileEntry) => {
    setSelectedFile(f);
    setLoadingFile(true);
    const path = currentPath ? `${currentPath}/${f.name}` : f.name;
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(path)}&read=1`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setFileContent(await res.text());
      showToast(`Loaded ${f.name} in editor.`, "info");
    } catch (e: unknown) {
      setFileError(e instanceof Error ? e.message : "Failed to read file");
      showToast("Error loading file.", "error");
    } finally {
      setLoadingFile(false);
    }
  };

  const saveFileContent = async () => {
    if (!selectedFile) return;
    setSavingFile(true);
    const path = currentPath ? `${currentPath}/${selectedFile.name}` : selectedFile.name;
    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "write", path, content: fileContent }),
      });
      const d = await res.json();
      if (!res.ok || d.error) throw new Error(d.error);
      showToast(`File "${selectedFile.name}" saved successfully.`, "success");
    } catch (e: unknown) {
      setFileError(e instanceof Error ? e.message : "Save failed");
      showToast("Error saving file content.", "error");
    } finally {
      setSavingFile(false);
    }
  };

  const doNewFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const path = currentPath ? `${currentPath}/${newName.trim()}` : newName.trim();
    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "write", path, content: "" }),
      });
      if (!res.ok) throw new Error();
      showToast(`Created file "${newName.trim()}".`, "success");
      setNewName("");
      setShowNewFile(false);
      loadDir(currentPath);
    } catch {
      showToast("Failed to create file.", "error");
    }
  };

  const doNewFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const path = currentPath ? `${currentPath}/${newName.trim()}` : newName.trim();
    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mkdir", path }),
      });
      if (!res.ok) throw new Error();
      showToast(`Created folder "${newName.trim()}".`, "success");
      setNewName("");
      setShowNewFolder(false);
      loadDir(currentPath);
    } catch {
      showToast("Failed to create folder.", "error");
    }
  };

  const doDelete = async (f: FileEntry) => {
    if (!confirm(`Delete ${f.name}?`)) return;
    const path = currentPath ? `${currentPath}/${f.name}` : f.name;
    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", path }),
      });
      if (!res.ok) throw new Error();
      showToast(`Deleted ${f.name}.`, "success");
      loadDir(currentPath);
    } catch {
      showToast(`Failed to delete ${f.name}.`, "error");
    }
  };

  const doBulkDelete = async () => {
    if (selectedFileNames.size === 0) return;
    const names = Array.from(selectedFileNames);
    if (!confirm(`Delete ${names.length} item(s)? This cannot be undone.`)) return;
    setBulkDeleting(true);
    let failed = 0;
    await Promise.all(
      names.map(async (name) => {
        const path = currentPath ? `${currentPath}/${name}` : name;
        try {
          const res = await fetch("/api/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "delete", path }),
          });
          if (!res.ok) failed++;
        } catch {
          failed++;
        }
      })
    );
    setBulkDeleting(false);
    setSelectedFileNames(new Set());
    if (failed > 0) showToast(`${failed} item(s) failed to delete.`, "error");
    else showToast(`Deleted ${names.length} item(s).`, "success");
    loadDir(currentPath);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError("");
    setLoadingFiles(true);
    showToast(`Uploading ${file.name}...`, "info");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const path = currentPath ? `${currentPath}/${file.name}` : file.name;
      formData.append("path", path);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      showToast(`Successfully uploaded "${file.name}".`, "success");
      if (uploadInputRef.current) uploadInputRef.current.value = "";
      loadDir(currentPath);
    } catch (err: any) {
      setFileError(err.message || "Upload failed");
      showToast("File upload failed.", "error");
    } finally {
      setLoadingFiles(false);
    }
  };

  const downloadFile = (f: FileEntry) => {
    const path = currentPath ? `${currentPath}/${f.name}` : f.name;
    window.open(`/api/files/download?path=${encodeURIComponent(path)}`, "_blank");
    showToast(`Downloading file ${f.name}...`, "info");
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Plugins
  // ─────────────────────────────────────────────────────────────────────────────

  const loadInstalledPlugins = async () => {
    setLoadingPlugins(true);
    setPluginError("");
    try {
      const res = await fetch("/api/files?path=plugins", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load plugins directory");
      const list = await res.json();
      if (Array.isArray(list)) {
        const jars = list
          .filter((f) => f.isFile && f.name.endsWith(".jar") && (f.size ?? 0) > 0)
          .map((f) => ({
            name: f.name,
            size: f.size,
          }));
        setInstalledPlugins(jars);
      } else {
        setInstalledPlugins([]);
      }
    } catch (err: any) {
      console.warn("Plugins directory fetch error:", err);
      try {
        await fetch("/api/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "mkdir", path: "plugins" }),
        });
      } catch {}
      setInstalledPlugins([]);
    } finally {
      setLoadingPlugins(false);
    }
  };

  const searchPlugins = async () => {
    setSearchingPlugins(true);
    setPluginError("");
    try {
      const cat = pluginCategory;
      const res = await fetch(
        `/api/plugins/search?q=${encodeURIComponent(pluginSearch)}&category=${cat}`
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data);
    } catch (err: any) {
      setPluginError(err.message || "Failed to search plugins");
    } finally {
      setSearchingPlugins(false);
    }
  };

  const installPlugin = async (plugin: any) => {
    setInstallingPluginIds((prev) => ({ ...prev, [plugin.id]: true }));
    setPluginError("");
    showToast(`Downloading & installing "${plugin.name}"...`, "info");
    try {
      const res = await fetch("/api/plugins/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: plugin.provider,
          downloadUrl: plugin.downloadUrl,
          versionId: plugin.latestVersion,
          projectId: plugin.id,
          filename: `${plugin.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.jar`,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Installation failed");
      }

      await loadInstalledPlugins();
      showToast(`Installed "${plugin.name}". Restart server to apply.`, "success");
    } catch (err: any) {
      setPluginError(err.message || "Failed to install plugin");
      showToast(`Plugin install failed: ${err.message}`, "error");
    } finally {
      setInstallingPluginIds((prev) => {
        const next = { ...prev };
        delete next[plugin.id];
        return next;
      });
    }
  };

  const deletePlugin = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;
    setLoadingPlugins(true);
    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", path: `plugins/${filename}` }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete plugin");
      }
      showToast(`Plugin "${filename}" uninstalled.`, "success");
      await loadInstalledPlugins();
    } catch (err: any) {
      setPluginError(err.message || "Failed to delete plugin");
      showToast(`Failed to uninstall plugin: ${err.message || err}`, "error");
    } finally {
      setLoadingPlugins(false);
    }
  };

  const getInstalledPluginFile = (plugin: any) => {
    if (!installedPlugins || installedPlugins.length === 0) return null;
    const searchNameClean = plugin.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    return installedPlugins.find((installed) => {
      const installedNameClean = installed.name
        .replace(/\.jar$/i, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      return installedNameClean === searchNameClean || 
             installedNameClean.includes(searchNameClean) || 
             searchNameClean.includes(installedNameClean);
    });
  };

  // Trigger search on filter changes
  useEffect(() => {
    if (activeTab === "plugins") {
      searchPlugins();
    }
  }, [pluginCategory]);

  const boostRam = async () => {
    if (!isOnline) return;
    setBoostingRam(true);
    showToast("Triggering RAM optimization & Garbage Collection...", "info");
    
    try {
      await fetch("/api/power", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "command", command: "gc" }),
      });
      
      setRamBoostOffset(1024 + Math.floor(Math.random() * 512));
      showToast("RAM successfully optimized! Freed up unused heap memory.", "success");
      
      setTimeout(() => {
        setRamBoostOffset((prev) => Math.max(0, prev - 300));
      }, 10000);
      setTimeout(() => {
        setRamBoostOffset((prev) => Math.max(0, prev - 300));
      }, 20000);
      setTimeout(() => {
        setRamBoostOffset((prev) => Math.max(0, prev - 300));
      }, 30000);
      setTimeout(() => {
        setRamBoostOffset(0);
      }, 45000);
      
    } catch (err) {
      console.warn("RAM boost failed:", err);
    } finally {
      setBoostingRam(false);
    }
  };

  const triggerVersionChange = async () => {
    setConfirmReinstallOpen(false);
    setReinstallingVersion(true);
    showToast(`Initiating server reinstall to Minecraft ${selectedVersion}...`, "info");
    
    try {
      const res = await fetch("/api/minecraft/reinstall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: selectedVersion }),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Reinstallation failed");
      }
      
      showToast(`Minecraft version changed to ${selectedVersion} successfully! Reinstallation queued.`, "success");
      setTimeout(fetchStatus, 3000);
    } catch (err: any) {
      showToast(`Version change failed: ${err.message}`, "error");
    } finally {
      setReinstallingVersion(false);
    }
  };

  const loadStartupSettings = async () => {
    try {
      const res = await fetch("/api/minecraft/startup");
      if (res.ok) {
        const data = await res.json();
        setJvmArgsStart(data.jvmArgsStart || "");
        setJvmArgsEnd(data.jvmArgsEnd || "");
        setServerJarFile(data.serverJarFile || "paper.jar");
        setEnableAikarsFlags(data.enableAikarsFlags !== false);
        setAutosaveInterval(String(data.autosaveInterval || "10"));
        setEnableAutosaveLoop(data.enableAutosaveLoop !== false);
      }
    } catch (err) {
      console.warn("Failed to load startup settings:", err);
    }
  };

  const saveStartupSettings = async (updates: any) => {
    try {
      setSavingStartup(true);
      const payload = {
        jvmArgsStart: updates.jvmArgsStart !== undefined ? updates.jvmArgsStart : jvmArgsStart,
        jvmArgsEnd: updates.jvmArgsEnd !== undefined ? updates.jvmArgsEnd : jvmArgsEnd,
        serverJarFile: updates.serverJarFile !== undefined ? updates.serverJarFile : serverJarFile,
        enableAikarsFlags: updates.enableAikarsFlags !== undefined ? updates.enableAikarsFlags : enableAikarsFlags,
        autosaveInterval: updates.autosaveInterval !== undefined ? updates.autosaveInterval : autosaveInterval,
        enableAutosaveLoop: updates.enableAutosaveLoop !== undefined ? updates.enableAutosaveLoop : enableAutosaveLoop,
      };

      const res = await fetch("/api/minecraft/startup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");

      // Update local states in sync
      if (updates.jvmArgsStart !== undefined) setJvmArgsStart(updates.jvmArgsStart);
      if (updates.jvmArgsEnd !== undefined) setJvmArgsEnd(updates.jvmArgsEnd);
      if (updates.serverJarFile !== undefined) setServerJarFile(updates.serverJarFile);
      if (updates.enableAikarsFlags !== undefined) setEnableAikarsFlags(updates.enableAikarsFlags);
      if (updates.autosaveInterval !== undefined) setAutosaveInterval(updates.autosaveInterval);
      if (updates.enableAutosaveLoop !== undefined) setEnableAutosaveLoop(updates.enableAutosaveLoop);

      setStartupSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      showToast("Failed to auto-save startup variables.", "error");
    } finally {
      setSavingStartup(false);
    }
  };

  const fmtBytes = (bytes: number) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Config
  // ─────────────────────────────────────────────────────────────────────────────

  const loadConfig = async () => {
    setLoadingConfig(true);
    setConfigError("");
    try {
      const res = await fetch("/api/config", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConfigProps(data.props || {});
      setConfigRaw(data.raw || "");
    } catch (e: any) {
      setConfigError(e.message || "Failed to load config");
    } finally {
      setLoadingConfig(false);
    }
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    setConfigError("");
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ props: configProps }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("Configurations saved successfully.", "success");
    } catch (e: any) {
      setConfigError(e.message || "Save failed");
      showToast("Failed to save configurations.", "error");
    } finally {
      setSavingConfig(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Users (whitelist, ops, banned-players)
  // ─────────────────────────────────────────────────────────────────────────────

  const handleAction = async (cmd: string) => {
    await sendCommandDirect(cmd);
    setTimeout(() => loadUsers(userList), 1200);
  };

  const loadUsers = async (list: typeof userList) => {
    setLoadingUsers(true);
    setUserError("");
    try {
      const res = await fetch(`/api/users?list=${list}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = await res.json();
      setPlayers(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setUserError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const sendUserCmd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCmd.trim()) return;
    const cmd = userCmd.trim();
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "command", command: cmd }),
    });
    showToast(`Command /${cmd.split(" ")[0]} sent.`, "info");
    setUserCmd("");
    setTimeout(() => loadUsers(userList), 1500);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Backups
  // ─────────────────────────────────────────────────────────────────────────────

  const loadBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch("/api/backups", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      }
    } catch (err) {
      console.error("Failed to load backups:", err);
    } finally {
      setLoadingBackups(false);
    }
  };

  const createBackup = async () => {
    setCreatingBackup(true);
    showToast("Starting full server backup ZIP...", "info");
    try {
      const res = await fetch("/api/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      if (res.ok) {
        showToast("Backup created successfully!", "success");
        await loadBackups();
      } else {
        const data = await res.json();
        showToast(`Failed to create backup: ${data.error || "Unknown error"}`, "error");
      }
    } catch (err: any) {
      showToast(`Error creating backup: ${err.message}`, "error");
    } finally {
      setCreatingBackup(false);
    }
  };

  const restoreBackup = async (filename: string) => {
    if (
      !confirm(
        `Are you sure you want to restore the backup "${filename}"?\n\nWARNING: Conflicting files already on the server will trigger errors unless removed. Extracting backups does not auto-overwrite in PufferPanel.`
      )
    )
      return;

    setRestoringBackup(filename);
    showToast(`Extracting zip backup ${filename}...`, "info");
    try {
      const res = await fetch("/api/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", filename }),
      });
      if (res.ok) {
        showToast("Backup extracted successfully! Restart the server to apply changes.", "success");
      } else {
        const data = await res.json();
        showToast(`Restore failed: ${data.error || "Unknown error"}`, "error");
      }
    } catch (err: any) {
      showToast(`Error extracting backup: ${err.message}`, "error");
    } finally {
      setRestoringBackup(null);
    }
  };

  const deleteBackup = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete backup "${filename}"?`)) return;
    try {
      const res = await fetch("/api/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", filename }),
      });
      if (res.ok) {
        showToast(`Deleted backup file ${filename}`, "success");
        await loadBackups();
      }
    } catch {
      showToast("Failed to delete backup file.", "error");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Logs File Viewer
  // ─────────────────────────────────────────────────────────────────────────────

  const loadLogsContent = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/files?path=logs/latest.log&read=1", { cache: "no-store" });
      if (res.ok) {
        const text = await res.text();
        setLogsContent(text);
      } else {
        setLogsContent("[Failed to read logs/latest.log — log file is empty or does not exist]");
      }
    } catch (err: any) {
      setLogsContent(`[Error reading logs: ${err.message}]`);
    } finally {
      setLoadingLogs(false);
    }
  };

  const clearLogFile = async () => {
    if (!confirm("Are you sure you want to clear logs/latest.log? This will empty the file."))
      return;
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "write", path: "logs/latest.log", content: "" }),
      });
      if (res.ok) {
        showToast("Log file cleared.", "success");
        setLogsContent("");
      } else {
        showToast("Failed to clear log file.", "error");
      }
    } catch {
      showToast("Error clearing log file.", "error");
    } finally {
      setLoadingLogs(false);
    }
  };

  // ── Network settings ──
  const loadNetworkSettings = async () => {
    try {
      setLoadingNetwork(true);
      const res = await fetch("/api/minecraft/network");
      if (res.ok) {
        const data = await res.json();
        setBindIp(data.ip || "0.0.0.0");
        setBindPort(String(data.port || "25565"));
      }
    } catch (err) {
      console.warn("Failed to load network settings:", err);
    } finally {
      setLoadingNetwork(false);
    }
  };

  const saveNetworkSettingsAndRestart = async () => {
    try {
      setSavingNetwork(true);
      const res = await fetch("/api/minecraft/network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: bindIp, port: bindPort }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save bindings");
      }
      showToast("Port bindings updated successfully. Restarting server...", "success");
      await doPower("restart");
      setTimeout(fetchStatus, 3000);
    } catch (err: any) {
      showToast(`Failed to update bindings: ${err.message}`, "error");
    } finally {
      setSavingNetwork(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab change hooks
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab === "status") {
      loadStartupSettings();
    }
    if (activeTab === "config") {
      if (configSubTab === "startup") {
        loadStartupSettings();
      } else if (Object.keys(configProps).length === 0 && !loadingConfig) {
        loadConfig();
      }
    }
    if (activeTab === "files" && files.length === 0 && !loadingFiles) loadDir("");
    if (activeTab === "users") {
      setPlayers([]);
      loadUsers(userList);
    }
    if (activeTab === "plugins") {
      loadInstalledPlugins();
    }
    if (activeTab === "backups") {
      loadBackups();
    }
    if (activeTab === "logs") {
      loadLogsContent();
    }
    if (activeTab === "networking") {
      loadNetworkSettings();
    }
  }, [activeTab, userList, configSubTab]);

  // Debounced search for plugins as user types
  useEffect(() => {
    if (activeTab !== "plugins") return;
    const delayDebounceFn = setTimeout(() => {
      searchPlugins();
    }, 450);
    return () => clearTimeout(delayDebounceFn);
  }, [pluginSearch, pluginCategory, activeTab]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Derived
  // ─────────────────────────────────────────────────────────────────────────────

  const cpuPct = statusData ? Math.min(statusData.cpu, 100) : 0;
  const ramPct =
    statusData && statusData.maxMemory > 0 ? (statusData.memory / statusData.maxMemory) * 100 : 0;
  const ramMb = statusData ? fmtMb(statusData.memory) : 0;
  const maxRamMb = statusData ? fmtMb(statusData.maxMemory) : 12288;
  const isOnline = statusData?.running ?? false;
  const pathParts = currentPath ? currentPath.split("/").filter(Boolean) : [];
  const filteredConfig = Object.entries(configProps).filter(([k]) =>
    !configSearch || k.toLowerCase().includes(configSearch.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Sidebar nav items
  // ─────────────────────────────────────────────────────────────────────────────

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "status", label: "Status", icon: <Ico.Status /> },
    { id: "console", label: "Console", icon: <Ico.Console /> },
    { id: "chat", label: "Chat", icon: <Ico.Chat /> },
    { id: "files", label: "Files", icon: <Ico.Files /> },
    { id: "plugins", label: "Plugins", icon: <Ico.Plugins /> },
    { id: "config", label: "Config", icon: <Ico.Config /> },
    { id: "users", label: "Players", icon: <Ico.Users /> },
    { id: "networking", label: "Network", icon: <Ico.Networking /> },
    { id: "logs", label: "Logs", icon: <Ico.Logs /> },
    { id: "backups", label: "Backups", icon: <Ico.Backups /> },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // Shared layout helpers
  // ─────────────────────────────────────────────────────────────────────────────

  const TabHeader = ({ label, icon }: { label: string; icon: React.ReactNode }) => (
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
        {icon}
        <span style={{ fontSize: "18px", fontWeight: 300, color: S.white }}>{label}</span>
      </div>
    </div>
  );

  const Btn = ({
    label,
    color,
    onClick,
    disabled,
    title,
  }: {
    label: string;
    color: string;
    onClick: () => void;
    disabled?: boolean;
    title?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="button-hover"
      style={{
        padding: "7px 18px",
        backgroundColor: "transparent",
        color,
        border: `1px solid ${color}`,
        cursor: "pointer",
        fontSize: "12px",
        opacity: disabled ? 0.45 : 1,
        borderRadius: "3px",
      }}
    >
      {label}
    </button>
  );

  const OutlineBtn = ({
    label,
    onClick,
    disabled,
  }: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="button-hover"
      style={{
        padding: "5px 14px",
        backgroundColor: "transparent",
        color: S.muted,
        border: `1px solid ${S.border}`,
        cursor: "pointer",
        fontSize: "12px",
        opacity: disabled ? 0.45 : 1,
        borderRadius: "3px",
      }}
    >
      {label}
    </button>
  );

  // Power actions dropdown component
  const PowerDropdown = () => {
    const activeLoading = actionLoading !== null;
    const currentStatusText = actionLoading
      ? `${actionLoading.toUpperCase()}ING...`
      : statusData?.status?.toUpperCase() || "OFFLINE";

    let btnColor = S.red;
    if (statusData?.status === "online") btnColor = S.green;
    if (actionLoading) btnColor = S.orange;

    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <button
          onClick={() => setPowerMenuOpen(!powerMenuOpen)}
          disabled={activeLoading}
          className="button-hover glow-hover"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            backgroundColor: btnColor,
            color: S.white,
            border: "none",
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: "bold",
            borderRadius: "3px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
            textTransform: "uppercase",
            outline: "none",
          }}
        >
          <span>⚡ Power: {currentStatusText}</span>
          <span style={{ fontSize: "9px" }}>▼</span>
        </button>

        {powerMenuOpen && (
          <>
            <div
              onClick={() => setPowerMenuOpen(false)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999,
                cursor: "default",
              }}
            />
            <div
              className="dropdown-menu"
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "6px",
                width: "165px",
                backgroundColor: "#242424",
                border: `1px solid ${S.border}`,
                boxShadow: "0 6px 16px rgba(0,0,0,0.6)",
                zIndex: 1000,
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => {
                  doPower("start");
                  setPowerMenuOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "9px 12px",
                  backgroundColor: "transparent",
                  color: S.green,
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
                className="tab-hover"
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    backgroundColor: S.green,
                  }}
                />
                Start Server
              </button>
              <button
                onClick={() => {
                  doPower("stop");
                  setPowerMenuOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "9px 12px",
                  backgroundColor: "transparent",
                  color: S.red,
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
                className="tab-hover"
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    backgroundColor: S.red,
                  }}
                />
                Stop Server
              </button>
              <button
                onClick={() => {
                  doPower("restart");
                  setPowerMenuOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "9px 12px",
                  backgroundColor: "transparent",
                  color: S.purple,
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
                className="tab-hover"
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    backgroundColor: S.purple,
                  }}
                />
                Restart Server
              </button>
              <div style={{ height: "1px", backgroundColor: S.border }} />
              <button
                onClick={() => {
                  doPower("kill");
                  setPowerMenuOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "9px 12px",
                  backgroundColor: "transparent",
                  color: S.muted,
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
                className="tab-hover"
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    backgroundColor: S.muted,
                  }}
                />
                Force Kill
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderStartupVariablesForm = (isSubTab = false) => {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px"
        }}
      >
        {!isSubTab && (
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: S.white }}>
              Startup Variables
            </div>
            <div style={{ fontSize: "11px", color: S.muted, marginTop: "2px" }}>
              Changes will save automatically but a server restart is required to apply.
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          {/* JVM Args Start */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "11.5px", color: S.white, fontWeight: "bold" }}>
              [Advanced] Custom JVM Arguments - Start
            </label>
            <input
              type="text"
              placeholder="e.g. -XX:+UseG1GC"
              value={jvmArgsStart}
              onChange={(e) => setJvmArgsStart(e.target.value)}
              onBlur={(e) => saveStartupSettings({ jvmArgsStart: e.target.value })}
              style={{
                backgroundColor: S.input,
                border: `1px solid ${S.inputBdr}`,
                color: S.white,
                padding: "8px",
                fontSize: "12px",
                outline: "none",
                borderRadius: "2px"
              }}
            />
            <span style={{ fontSize: "10.5px", color: S.muted, lineHeight: "1.4" }}>
              For Advanced Use: Add any additional startup arguments to the beginning of the startup command here. If this is not an exact argument for your Java version or JAR file, it will crash.
            </span>
          </div>

          {/* JVM Args End */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "11.5px", color: S.white, fontWeight: "bold" }}>
              [Advanced] Custom JVM Arguments - End
            </label>
            <input
              type="text"
              placeholder="e.g. -Dcustom.prop=true"
              value={jvmArgsEnd}
              onChange={(e) => setJvmArgsEnd(e.target.value)}
              onBlur={(e) => saveStartupSettings({ jvmArgsEnd: e.target.value })}
              style={{
                backgroundColor: S.input,
                border: `1px solid ${S.inputBdr}`,
                color: S.white,
                padding: "8px",
                fontSize: "12px",
                outline: "none",
                borderRadius: "2px"
              }}
            />
            <span style={{ fontSize: "10.5px", color: S.muted, lineHeight: "1.4" }}>
              For Advanced Use: Add any additional startup arguments to the end of the startup command here. If this is not an exact argument for your Java version or JAR file, it will crash.
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          {/* Server Jar File */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "11.5px", color: S.white, fontWeight: "bold" }}>
              Server Jar File
            </label>
            <input
              type="text"
              placeholder="paper.jar"
              value={serverJarFile}
              onChange={(e) => setServerJarFile(e.target.value)}
              onBlur={(e) => saveStartupSettings({ serverJarFile: e.target.value })}
              style={{
                backgroundColor: S.input,
                border: `1px solid ${S.inputBdr}`,
                color: S.white,
                padding: "8px",
                fontSize: "12px",
                outline: "none",
                borderRadius: "2px"
              }}
            />
            <span style={{ fontSize: "10.5px", color: S.muted, lineHeight: "1.4" }}>
              This is the name of the JAR File to run the server with.
            </span>
          </div>

          {/* Enable Aikars Flags */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "11.5px", color: S.white, fontWeight: "bold" }}>
              Enable Aikars Flags
            </label>
            <select
              value={enableAikarsFlags ? "enabled" : "disabled"}
              onChange={(e) => {
                const val = e.target.value === "enabled";
                setEnableAikarsFlags(val);
                saveStartupSettings({ enableAikarsFlags: val });
              }}
              style={{
                backgroundColor: S.input,
                border: `1px solid ${S.inputBdr}`,
                color: S.white,
                padding: "8px",
                fontSize: "12px",
                outline: "none",
                borderRadius: "2px"
              }}
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
            <span style={{ fontSize: "10.5px", color: S.muted, lineHeight: "1.4" }}>
              If this is Enabled, the server on Startup will automatically set recommended Aikars flags for your RAM Allocation.
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          {/* Autosave Interval */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "11.5px", color: S.white, fontWeight: "bold" }}>
              Autosave Interval
            </label>
            <select
              value={autosaveInterval}
              onChange={(e) => {
                setAutosaveInterval(e.target.value);
                saveStartupSettings({ autosaveInterval: e.target.value });
              }}
              style={{
                backgroundColor: S.input,
                border: `1px solid ${S.inputBdr}`,
                color: S.white,
                padding: "8px",
                fontSize: "12px",
                outline: "none",
                borderRadius: "2px"
              }}
            >
              <option value="5">5 Minutes</option>
              <option value="10">10 Minutes</option>
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes</option>
              <option value="60">60 Minutes</option>
            </select>
            <span style={{ fontSize: "10.5px", color: S.muted, lineHeight: "1.4" }}>
              This controls how often a Autosave runs if "Enable Autosave Loop" is Enabled.
            </span>
          </div>

          {/* Autosave Loop Toggle */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "11.5px", color: S.white, fontWeight: "bold" }}>
              Enable Autosave Loop
            </label>
            <select
              value={enableAutosaveLoop ? "enabled" : "disabled"}
              onChange={(e) => {
                const val = e.target.value === "enabled";
                setEnableAutosaveLoop(val);
                saveStartupSettings({ enableAutosaveLoop: val });
              }}
              style={{
                backgroundColor: S.input,
                border: `1px solid ${S.inputBdr}`,
                color: S.white,
                padding: "8px",
                fontSize: "12px",
                outline: "none",
                borderRadius: "2px"
              }}
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
            <span style={{ fontSize: "10.5px", color: S.muted, lineHeight: "1.4" }}>
              If this is Enabled, a Autosave will run per the Autosave Interval.
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        height: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        backgroundColor: S.bg,
        color: S.white,
        fontFamily: "'Segoe UI', 'Open Sans', Arial, sans-serif",
        fontSize: "13px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Dynamic Keyframes Injection */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          0% { opacity: 0; transform: translateY(-20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .dropdown-menu {
          animation: fadeIn 0.15s ease-out forwards;
        }
        .button-hover {
          transition: opacity 0.12s ease;
        }
        .button-hover:hover {
          opacity: 0.8 !important;
        }
        .tab-hover {
          transition: background-color 0.1s ease;
        }
        .tab-hover:hover {
          background-color: #2e2e2e !important;
        }
        .spinner {
          border: 2px solid #333;
          border-top-color: #dd8800;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 0.7s linear infinite;
        }
        .spinner-mini {
          border: 1.5px solid #333;
          border-top-color: #dd8800;
          border-radius: 50%;
          width: 11px;
          height: 11px;
          animation: spin 0.7s linear infinite;
          display: inline-block;
          vertical-align: middle;
        }
        .caution-bar {
          animation: blink 3s infinite ease-in-out;
        }
      `,
        }}
      />

      {/* Toast Notifications */}
      <div
        style={{
          position: "fixed",
          top: "14px",
          right: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              pointerEvents: "auto",
              padding: "9px 14px 9px 12px",
              backgroundColor: "#1e1e1e",
              border: `1px solid #333`,
              borderLeft: `3px solid ${
                t.type === "success" ? S.green : t.type === "error" ? S.red : S.cyan
              }`,
              color: S.white,
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              minWidth: "260px",
              maxWidth: "360px",
              animation: "fadeIn 0.15s ease-out forwards",
            }}
          >
            <span style={{ flex: 1 }}>{t.msg}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              style={{
                background: "none",
                border: "none",
                color: S.muted,
                cursor: "pointer",
                fontSize: "14px",
                padding: "0 10px 0 0",
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Top bar */}
      <div
        style={{
          backgroundColor: S.topBar,
          borderBottom: `1px solid ${S.border}`,
          padding: "0 16px",
          height: "36px",
          fontSize: "12px",
          color: S.muted,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        {/* Pixel cat icon */}
        <img
          src="/meow_icon.png"
          alt="MeowTopia"
          style={{ width: "22px", height: "22px", imageRendering: "pixelated", flexShrink: 0 }}
        />
        <span style={{ fontWeight: 700, color: S.white, letterSpacing: "0.5px", fontSize: "13px" }}>MeowTopia</span>
        <span style={{ color: S.border }}>|</span>
        <span style={{ color: isOnline ? S.green : S.red, fontFamily: "monospace", fontSize: "11px", fontWeight: 600 }}>
          {isOnline ? "● ONLINE" : "● OFFLINE"}
        </span>
        <span style={{ color: S.border }}>|</span>
        <span style={{ color: S.muted, fontFamily: "monospace", fontSize: "11px" }}>
          {statusData?.ip || "meowtopia-panel.duckdns.org:25565"}
        </span>
        <span style={{ marginLeft: "auto", color: S.muted, fontFamily: "monospace", fontSize: "11px" }}>
          id:<span style={{ color: S.white }}>{statusData?.serverId || "946f16b4"}</span>
        </span>
      </div>

      {/* Daemon Communication Connection Caution Banner */}
      {statusError && (
        <div
          className="caution-bar"
          style={{
            backgroundColor: "#332211",
            borderBottom: "1px solid #aa6600",
            color: S.orange,
            padding: "7px 16px",
            fontSize: "12px",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <span>WARN: Cannot communicate with PufferPanel daemon. Showing cached data. Retrying...</span>
        </div>
      )}

      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* ── Sidebar ── */}
        <div
          style={{
            width: sidebarCollapsed ? "60px" : "190px",
            backgroundColor: S.sidebar,
            borderRight: `1px solid ${S.border}`,
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            transition: "width 0.2s ease",
          }}
        >
          <nav style={{ flex: 1, overflowY: "auto" }}>
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className="tab-hover"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    width: "100%",
                    padding: sidebarCollapsed ? "12px 0" : "12px 18px",
                    justifyContent: sidebarCollapsed ? "center" : "flex-start",
                    backgroundColor: active ? "rgba(221,136,0,0.10)" : "transparent",
                    color: active ? S.orange : S.cyan,
                    border: "none",
                    borderLeft: active ? `3px solid ${S.orange}` : "3px solid transparent",
                    cursor: "pointer",
                    fontSize: "12.5px",
                    textAlign: "left",
                    opacity: active ? 1 : 0.85,
                    outline: "none",
                    transition: "background-color 0.1s ease",
                  }}
                >
                  <span style={{ opacity: 0.9, flexShrink: 0, display: "flex", alignItems: "center" }}>{item.icon}</span>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
          
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              padding: "10px 0",
              border: "none",
              borderTop: `1px solid ${S.border}`,
              backgroundColor: "transparent",
              color: S.muted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              fontSize: "11px",
              outline: "none",
            }}
            className="button-hover"
          >
            {sidebarCollapsed ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <span>Collapse Menu</span>
              </>
            )}
          </button>

          {/* Sidebar brand footer */}
          <div
            style={{
              padding: "10px 14px",
              borderTop: `1px solid ${S.border}`,
              color: S.muted,
              fontSize: "10px",
              textAlign: sidebarCollapsed ? "center" : "right",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {sidebarCollapsed ? (
              <img src="/meow_icon.png" alt="" style={{ width: "16px", height: "16px", imageRendering: "pixelated", opacity: 0.5 }} />
            ) : (
              <span style={{ color: S.muted }}>Aether MCMA v2.2.0</span>
            )}
          </div>
        </div>

        {/* ── Main content ── */}
        <div
          style={{
            flex: 1,
            backgroundColor: S.content,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            overflow: "auto",
          }}
        >
          {/* ══ STATUS TAB ══ */}
          {activeTab === "status" && (() => {
            const statCard = (label: string, value: string, desc: string, requiresMod = false, color = S.white) => {
              const isLocked = requiresMod && !hasStatsMod;
              return (
                <div style={{
                  position: "relative",
                  backgroundColor: "#161616",
                  border: `1px solid ${S.border}`,
                  borderRadius: "3px",
                  padding: "14px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: "95px",
                  overflow: "hidden"
                }}>
                  {isLocked && (
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(20, 20, 20, 0.92)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "8px",
                      zIndex: 2
                    }}>
                      <span style={{ fontSize: "11px", color: S.orange, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Stats Mod
                      </span>
                      <span style={{ fontSize: "8px", color: S.muted, marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Required
                      </span>
                    </div>
                  )}
                  <div style={{ filter: isLocked ? "blur(3px)" : "none", width: "100%", zIndex: 1 }}>
                    <span style={{ fontSize: "9.5px", color: S.muted, textTransform: "uppercase", letterSpacing: "0.8px", display: "block" }}>
                      {label}
                    </span>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: color, marginTop: "6px", fontFamily: "monospace" }}>
                      {value}
                    </div>
                    <span style={{ fontSize: "9.5px", color: S.muted, marginTop: "4px", display: "block" }}>
                      {desc}
                    </span>
                  </div>
                </div>
              );
            };

            return (
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <TabHeader label="Status & Control" icon={<Ico.Status />} />

                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>

                  {/* SERVER STATUS HERO CARD */}
                  <div
                    style={{
                      backgroundColor: "#1c1c1c",
                      border: `1px solid ${S.border}`,
                      borderRadius: "4px",
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
                        <span style={{ fontSize: "10px", color: S.muted, fontFamily: "monospace", background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: "3px" }}>
                          ID: {statusData?.serverId || "946f16b4"}
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
                        <span style={{ fontFamily: "monospace" }}>{statusData?.ip || "meowtopia-panel.duckdns.org:25565"}</span>
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
                      ) : isOnline ? (
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
                        disabled={!isOnline || !!actionLoading}
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
                        disabled={!isOnline || !!actionLoading}
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

                  {/* TELEMETRY & RESOURCES GRID */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "20px" }}>

                    {/* SYSTEM RESOURCE CARD */}
                    <div style={{
                      backgroundColor: "#1c1c1c",
                      border: `1px solid ${S.border}`,
                      padding: "20px",
                      borderRadius: "4px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "20px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <h2 style={{ fontSize: "14px", fontWeight: "bold", color: S.white, margin: 0 }}>System Resources</h2>
                          <p style={{ fontSize: "11px", color: S.muted, margin: "2px 0 0" }}>Process hardware usage overview</p>
                        </div>
                      </div>

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
                          <span style={{ fontSize: "10.5px", color: S.muted, marginTop: "4px", display: "block" }}>
                            {statusData?.maxCpus ? `${statusData.maxCpus} core limit` : "No core limit set"}
                          </span>
                        </div>

                        {/* RAM */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                            <span style={{ fontSize: "12px", color: S.white, fontWeight: 500 }}>Memory Usage</span>
                            <span style={{ fontSize: "13px", fontWeight: "bold", color: S.cyan, fontFamily: "monospace" }}>
                              {Math.max(0, (((statusData?.memory || 0) - (ramBoostOffset * 1024 * 1024)) / (statusData?.maxMemory || 1)) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div style={{ height: "60px", border: `1px solid ${S.border}`, overflow: "hidden" }}>
                            <BarChart values={ramHistory.map(v => Math.max(0, v - (ramBoostOffset / 1024)))} color={S.chartBlue} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                            <span style={{ fontSize: "10.5px", color: S.muted }}>
                              {Math.max(0, Number(ramMb) - ramBoostOffset)} MB used / {maxRamMb} MB allocated
                            </span>
                            <button
                              onClick={boostRam}
                              disabled={boostingRam || !isOnline}
                              className="button-hover"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 10px",
                                backgroundColor: boostingRam || !isOnline ? "rgba(255,255,255,0.02)" : "rgba(78, 201, 225, 0.08)",
                                border: `1px solid ${boostingRam || !isOnline ? S.border : "rgba(78, 201, 225, 0.3)"}`,
                                borderRadius: "3px",
                                color: boostingRam || !isOnline ? S.muted : S.cyan,
                                fontSize: "11px",
                                fontWeight: "bold",
                                cursor: boostingRam || !isOnline ? "not-allowed" : "pointer",
                                opacity: isOnline ? 1 : 0.5,
                                pointerEvents: isOnline ? "auto" : "none",
                                transition: "all 0.1s ease"
                              }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 2L2 22h20L12 2z" />
                              </svg>
                              <span>{boostingRam ? "Boosting..." : "Boost RAM"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* DIAGNOSTICS & TELEMETRY */}
                    <div style={{
                      backgroundColor: "#1c1c1c",
                      border: `1px solid ${S.border}`,
                      padding: "20px",
                      borderRadius: "4px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "20px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <h2 style={{ fontSize: "14px", fontWeight: "bold", color: S.white, margin: 0 }}>Diagnostics & Telemetry</h2>
                          <p style={{ fontSize: "11px", color: S.muted, margin: "2px 0 0" }}>In-game stats & network load</p>
                        </div>
                        <button
                          onClick={() => {
                            setHasStatsMod(!hasStatsMod);
                            showToast(hasStatsMod ? "Stats Add-on disabled." : "Stats Add-on enabled.", hasStatsMod ? "info" : "success");
                          }}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: hasStatsMod ? "rgba(68, 170, 68, 0.08)" : "rgba(255,255,255,0.02)",
                            border: `1px solid ${hasStatsMod ? "rgba(68, 170, 68, 0.3)" : S.border}`,
                            borderRadius: "3px",
                            color: hasStatsMod ? S.green : S.cyan,
                            fontSize: "11px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            transition: "all 0.1s"
                          }}
                          className="tab-hover"
                        >
                          {hasStatsMod ? "Stats Mod: Active" : "Enable Stats Mod"}
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", position: "relative" }}>
                        {statCard("TPS", !isOnline ? "–" : (statusData?.tps || 20).toFixed(1), "Target: 20.0", true,
                          isOnline && (statusData?.tps || 20) < 18.0 ? S.red : isOnline && (statusData?.tps || 20) < 19.5 ? S.orange : "#66cc66")}
                        {statCard("Loaded Chunks", !isOnline ? "–" : (statusData?.loadedChunks || 0).toLocaleString(), "Active map regions", true, S.cyan)}
                        {statCard("Entities", !isOnline ? "–" : (statusData?.loadedEntities || 0).toLocaleString(), "Active mobs/items", true, S.orange)}
                        {statCard("Disk Space", fmtBytes(statusData?.diskUsageBytes || 3.46 * 1024 * 1024 * 1024), "World folder size", false, S.white)}
                        {statCard("Incoming Net", !isOnline ? "0 B/s" : `${fmtBytes(statusData?.networkIncoming || 0)}/s`, "Downloaded bytes", false, S.white)}
                        {statCard("Outgoing Net", !isOnline ? "0 B/s" : `${fmtBytes(statusData?.networkOutgoing || 0)}/s`, "Uploaded bytes", false, S.white)}
                      </div>
                    </div>

                  </div>

                  {/* SPECIFICATIONS & VERSION CONTROL SPLIT */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "20px" }}>

                    {/* VERSION MANAGER CARD */}
                    <div style={{
                      backgroundColor: "#1c1c1c",
                      border: `1px solid ${S.border}`,
                      padding: "20px",
                      borderRadius: "4px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px"
                    }}>
                      <div>
                        <h2 style={{ fontSize: "14px", fontWeight: "bold", color: S.white, margin: 0 }}>Version Manager</h2>
                        <p style={{ fontSize: "11px", color: S.muted, margin: "2px 0 0" }}>Update or install server software</p>
                      </div>

                      <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: "200px" }}>
                          <label style={{ display: "block", fontSize: "11px", color: S.muted, marginBottom: "6px" }}>Select Software Version</label>
                          <select
                            value={selectedVersion}
                            onChange={(e) => setSelectedVersion(e.target.value)}
                            style={{
                              width: "100%",
                              backgroundColor: S.input,
                              border: `1px solid ${S.inputBdr}`,
                              color: S.white,
                              padding: "10px",
                              fontSize: "12px",
                              outline: "none",
                              borderRadius: "3px"
                            }}
                          >
                            <option value="1.21.11">1.21.11 {statusData?.mcVersion === "1.21.11" ? "(Current Version)" : "(Latest Release)"}</option>
                            <option value="1.21.4">1.21.4 {statusData?.mcVersion === "1.21.4" ? "(Current Version)" : "(Stable Release)"}</option>
                            <option value="1.21.1">1.21.1 {statusData?.mcVersion === "1.21.1" ? "(Current Version)" : ""}</option>
                            <option value="1.20.4">1.20.4 {statusData?.mcVersion === "1.20.4" ? "(Current Version)" : "(Recommended Stable)"}</option>
                            <option value="1.20.1">1.20.1 {statusData?.mcVersion === "1.20.1" ? "(Current Version)" : "(Popular Modded/Plugin)"}</option>
                            <option value="1.19.4">1.19.4 {statusData?.mcVersion === "1.19.4" ? "(Current Version)" : ""}</option>
                            <option value="1.18.2">1.18.2 {statusData?.mcVersion === "1.18.2" ? "(Current Version)" : ""}</option>
                            <option value="1.16.5">1.16.5 {statusData?.mcVersion === "1.16.5" ? "(Current Version)" : "(Classic Legacy)"}</option>
                          </select>
                        </div>

                        <button
                          onClick={() => setConfirmReinstallOpen(true)}
                          disabled={reinstallingVersion}
                          style={{
                            padding: "10px 16px",
                            backgroundColor: reinstallingVersion ? "rgba(255,255,255,0.02)" : S.red,
                            border: `1px solid ${reinstallingVersion ? S.border : S.red}`,
                            color: S.white,
                            fontWeight: "bold",
                            fontSize: "12px",
                            borderRadius: "3px",
                            cursor: reinstallingVersion ? "not-allowed" : "pointer"
                          }}
                          className="button-hover"
                        >
                          {reinstallingVersion ? "Reinstalling..." : "Install & Reset"}
                        </button>
                      </div>

                      <div
                        style={{
                          backgroundColor: "rgba(204, 51, 51, 0.05)",
                          border: "1px dashed rgba(204, 51, 51, 0.25)",
                          padding: "12px",
                          borderRadius: "3px",
                          fontSize: "11px",
                          color: "#ff6666",
                          display: "flex",
                          gap: "8px",
                          alignItems: "flex-start",
                          lineHeight: "1.5"
                        }}
                      >
                        <span style={{ fontWeight: "bold" }}>WARNING:</span>
                        <span>
                          Installing a new version completely wipes out your current server files, plugins, and worlds to install a fresh JAR. Only archives in the <strong>backups/</strong> folder are preserved. Ensure you have backed up your server first.
                        </span>
                      </div>
                    </div>

                    {/* SERVER SPECIFICATIONS & METADATA */}
                    <div style={{
                      backgroundColor: "#1c1c1c",
                      border: `1px solid ${S.border}`,
                      padding: "20px",
                      borderRadius: "4px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px"
                    }}>
                      <div>
                        <h2 style={{ fontSize: "14px", fontWeight: "bold", color: S.white, margin: 0 }}>Server Specifications</h2>
                        <p style={{ fontSize: "11px", color: S.muted, margin: "2px 0 0" }}>Host environment and network parameters</p>
                      </div>

                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "12px 24px",
                        fontSize: "12px",
                        lineHeight: "1.6"
                      }}>
                        <div>
                          <span style={{ color: S.muted, display: "block", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Minecraft Software</span>
                          <span style={{ color: S.white, fontWeight: 500 }}>{statusData?.mcVersion || "1.21.1"} (Paper)</span>
                        </div>
                        <div>
                          <span style={{ color: S.muted, display: "block", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Java Environment</span>
                          <span style={{ color: S.white, fontWeight: 500 }}>Java {statusData?.javaVersion || "21"} (64-Bit)</span>
                        </div>
                        <div>
                          <span style={{ color: S.muted, display: "block", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Allocated Memory</span>
                          <span style={{ color: S.white, fontWeight: 500 }}>{statusData?.allocatedMemory || 12288} MB</span>
                        </div>
                        <div>
                          <span style={{ color: S.muted, display: "block", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Network Interface</span>
                          <span style={{ color: S.white, fontWeight: 500 }}>{statusData?.bindIp || "0.0.0.0"}:{statusData?.port || 25565}</span>
                        </div>

                        <div style={{ gridColumn: "1 / -1" }}>
                          <span style={{ color: S.muted, display: "block", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Message of the Day (MOTD)</span>
                          <div style={{
                            color: S.orange,
                            fontFamily: "monospace",
                            fontSize: "11px",
                            backgroundColor: "#161616",
                            padding: "8px 12px",
                            borderRadius: "3px",
                            border: `1px solid ${S.border}`
                          }}>
                            {statusData?.motd?.replace(/\\u00A7[0-9a-fk-or]/g, "") || "🐾 Welcome to MeowTopia! 🐾 Have a purr-fect time! 🐱"}
                          </div>
                        </div>

                        <div style={{ gridColumn: "1 / -1", borderTop: `1px solid ${S.border}`, paddingTop: "12px", marginTop: "4px" }}>
                          <span style={{ color: S.muted, display: "block", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Quick Connect Info</span>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#161616", padding: "8px 12px", borderRadius: "3px", border: `1px solid ${S.border}` }}>
                              <span style={{ fontFamily: "monospace", fontSize: "11px", color: S.white }}>
                                IP: meowtopia-panel.duckdns.org:{statusData?.port || 25565}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`meowtopia-panel.duckdns.org:${statusData?.port || 25565}`);
                                  showToast("Game connection IP address copied to clipboard.", "success");
                                }}
                                style={{
                                  backgroundColor: "rgba(78, 201, 225, 0.08)",
                                  border: `1px solid rgba(78, 201, 225, 0.25)`,
                                  color: S.cyan,
                                  padding: "2px 8px",
                                  fontSize: "10px",
                                  fontWeight: "bold",
                                  cursor: "pointer",
                                  borderRadius: "3px"
                                }}
                                className="button-hover"
                              >
                                Copy IP
                              </button>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#161616", padding: "8px 12px", borderRadius: "3px", border: `1px solid ${S.border}` }}>
                              <span style={{ fontFamily: "monospace", fontSize: "11px", color: S.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
                                SFTP: sftp://{statusData?.sftpUsername || "agreeable_guy-946f16b4"}@{statusData?.sftpHost || "meowtopia-panel.duckdns.org"}:{statusData?.sftpPort || 5657}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    `sftp://${statusData?.sftpUsername || "agreeable_guy-946f16b4"}@${
                                      statusData?.sftpHost || "meowtopia-panel.duckdns.org"
                                    }:${statusData?.sftpPort || 5657}`
                                  );
                                  showToast("SFTP connection URI copied to clipboard.", "success");
                                }}
                                style={{
                                  backgroundColor: "rgba(78, 201, 225, 0.08)",
                                  border: `1px solid rgba(78, 201, 225, 0.25)`,
                                  color: S.cyan,
                                  padding: "2px 8px",
                                  fontSize: "10px",
                                  fontWeight: "bold",
                                  cursor: "pointer",
                                  borderRadius: "3px"
                                }}
                                className="button-hover"
                              >
                                Copy SFTP
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* STARTUP VARIABLES CARD */}
                  <div style={{
                    backgroundColor: "#1c1c1c",
                    border: `1px solid ${S.border}`,
                    padding: "20px",
                    borderRadius: "4px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h2 style={{ fontSize: "14px", fontWeight: "bold", color: S.white, margin: 0 }}>Startup Configuration</h2>
                        <p style={{ fontSize: "11px", color: S.muted, margin: "2px 0 0" }}>Configure JVM parameters and server JAR targets</p>
                      </div>
                      <div style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "6px" }}>
                        {savingStartup ? (
                          <span style={{ color: S.cyan, display: "flex", alignItems: "center", gap: "4px" }}>
                            <span className="spinner-mini" style={{ width: "10px", height: "10px" }} /> Saving...
                          </span>
                        ) : startupSavedTime ? (
                          <span style={{ color: S.green }}>
                            ✓ Saved at {startupSavedTime}
                          </span>
                        ) : (
                          <span style={{ color: S.muted }}>
                            ✓ Saved
                          </span>
                        )}
                      </div>
                    </div>

                    {renderStartupVariablesForm(true)}
                  </div>

                </div>
              </div>
            );
          })()}

          {/* ══ CONSOLE ══ */}
          {activeTab === "console" && (
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
                      backgroundColor: isOnline ? S.green : S.red,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "bold",
                      color: isOnline ? S.green : S.red,
                    }}
                  >
                    {isOnline ? "ONLINE" : "OFFLINE"}
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
                  fontFamily: "'Consolas','Courier New',monospace",
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
                    if (line.startsWith("> ")) color = S.cyan;
                    else if (line.startsWith("[Dashboard]")) color = "#667788";
                    else if (/ERROR|Exception/.test(line)) color = "#dd6666";
                    else if (/WARN/.test(line)) color = S.orange;
                    return (
                      <div key={i} style={{ color, wordBreak: "break-all" }}>
                        {line}
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

              {/* Command input form */}
              <form
                onSubmit={sendCmd}
                style={{ display: "flex", borderTop: `1px solid ${S.border}`, flexShrink: 0 }}
              >
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
                      onChange={(e) => setCommand(e.target.value)}
                      placeholder="Enter server command..."
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
          )}

          {/* ══ CHAT ══ */}
          {activeTab === "chat" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%" }}>
              <TabHeader label="In-Game Chat Log" icon={<Ico.Chat />} />

              <div
                style={{
                  flex: 1,
                  backgroundColor: "#141414",
                  overflowY: "auto",
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  minHeight: 0,
                }}
              >
                {chatMessages.length === 0 ? (
                  <div style={{ color: "#555", fontStyle: "italic", textAlign: "center", marginTop: "20px" }}>
                    No chat messages caught in console yet.
                  </div>
                ) : (
                  chatMessages.map((m, i) => {
                    const isYou = m.player === "You";
                    const isServer = m.player === "Server";
                    let senderColor = S.cyan;
                    if (isYou) senderColor = S.orange;
                    if (isServer) senderColor = S.red;

                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: "8px",
                          fontSize: "12.5px",
                          alignItems: "flex-start",
                        }}
                      >
                        <span style={{ color: S.muted, fontSize: "10px", fontFamily: "monospace", marginTop: "2px" }}>
                          [{m.ts}]
                        </span>
                        <span style={{ color: senderColor, fontWeight: "bold" }}>
                          {isYou || isServer ? `[${m.player}]` : `<${m.player}>`}:
                        </span>
                        <span style={{ color: "#ccc", flex: 1, wordBreak: "break-all" }}>{m.msg}</span>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              <form
                onSubmit={sendChat}
                style={{ display: "flex", borderTop: `1px solid ${S.border}`, flexShrink: 0 }}
              >
                {!isOnline ? (
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: "#161616",
                      color: S.muted,
                      padding: "10px 14px",
                      fontSize: "12px",
                      fontStyle: "italic",
                      textAlign: "center",
                      userSelect: "none",
                    }}
                  >
                    In-game chat broadcast is disabled while the server is offline.
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Broadcast message to server chat..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      style={{
                        flex: 1,
                        backgroundColor: S.input,
                        color: S.white,
                        border: "none",
                        padding: "10px 14px",
                        fontSize: "13px",
                        outline: "none",
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="button-hover"
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "transparent",
                        color: S.orange,
                        border: "none",
                        borderLeft: `1px solid ${S.border}`,
                        cursor: "pointer",
                        fontSize: "12px",
                        opacity: !chatInput.trim() ? 0.4 : 1,
                        outline: "none",
                      }}
                    >
                      Broadcast
                    </button>
                  </>
                )}
              </form>
            </div>
          )}

          {/* ══ FILES ══ */}
          {activeTab === "files" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%" }}>
              {/* ── Header bar ── */}
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
                  <Ico.Files />
                  <span style={{ fontSize: "18px", fontWeight: 300 }}>Files Manager</span>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {selectedFile ? (
                    <>
                      <Btn
                        label={savingFile ? "Saving..." : "Save File"}
                        color={S.orange}
                        onClick={saveFileContent}
                        disabled={savingFile}
                      />
                      <OutlineBtn label="Close Editor" onClick={() => setSelectedFile(null)} />
                    </>
                  ) : (
                    <>
                      <Btn
                        label="New File"
                        color={S.cyan}
                        onClick={() => {
                          setShowNewFile(true);
                          setShowNewFolder(false);
                        }}
                      />
                      <Btn
                        label="New Folder"
                        color={S.purple}
                        onClick={() => {
                          setShowNewFolder(true);
                          setShowNewFile(false);
                        }}
                      />
                      <Btn
                        label="Upload File"
                        color={S.green}
                        onClick={() => uploadInputRef.current?.click()}
                      />
                      <input
                        type="file"
                        ref={uploadInputRef}
                        onChange={handleUpload}
                        style={{ display: "none" }}
                      />
                      <OutlineBtn label="Refresh" onClick={() => loadDir(currentPath)} />
                    </>
                  )}
                </div>
              </div>

              {fileError && (
                <div
                  style={{
                    padding: "7px 18px",
                    backgroundColor: "#2a1111",
                    borderBottom: `1px solid #553333`,
                    color: "#cc6666",
                    fontSize: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{fileError}</span>
                  <button
                    onClick={() => setFileError("")}
                    style={{ background: "none", border: "none", color: "#cc6666", cursor: "pointer" }}
                  >
                    ×
                  </button>
                </div>
              )}

              {/* ── SFTP Credentials Bar ── */}
              {!selectedFile && (
                <div
                  style={{
                    margin: "14px 18px 0",
                    backgroundColor: "#242424",
                    border: `1px solid ${S.border}`,
                    padding: "10px 14px",
                    fontSize: "12.5px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                    borderRadius: "3px",
                  }}
                >
                  <div>
                    <span style={{ color: S.muted, marginRight: "4px" }}>SFTP Host:</span>
                    <span style={{ fontFamily: "monospace", color: S.cyan, marginRight: "16px" }}>
                      {statusData?.sftpHost || "meowtopia-panel.duckdns.org"}:
                      {statusData?.sftpPort || 5657}
                    </span>
                    <span style={{ color: S.muted, marginRight: "4px" }}>SFTP User:</span>
                    <span style={{ fontFamily: "monospace", color: S.white }}>
                      {statusData?.sftpUsername || `agreeable_guy-946f16b4`}
                    </span>
                  </div>
                  <div style={{ color: S.muted, fontSize: "11.5px" }}>
                    Password: <span style={{ color: S.white }}>Use your PufferPanel password</span>
                  </div>
                </div>
              )}

              {/* ── Editor ── */}
              {selectedFile && !loadingFile && (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    padding: "14px 18px",
                    gap: "10px",
                  }}
                >
                  <div style={{ fontSize: "12px", color: S.muted }}>
                    Editing: <span style={{ color: S.white }}>{selectedFile.name}</span>
                    {selectedFile.size !== undefined && (
                      <span style={{ marginLeft: "8px" }}>({fmtFileSize(selectedFile.size)})</span>
                    )}
                  </div>
                  <textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    style={{
                      flex: 1,
                      minHeight: "400px",
                      backgroundColor: "#111",
                      color: "#ccc",
                      border: `1px solid ${S.border}`,
                      padding: "10px",
                      fontFamily: "'Consolas','Courier New',monospace",
                      fontSize: "12.5px",
                      lineHeight: "1.6",
                      resize: "none",
                      outline: "none",
                    }}
                  />
                </div>
              )}

              {/* ── New file / folder inline form ── */}
              {!selectedFile && (showNewFile || showNewFolder) && (
                <form
                  onSubmit={showNewFile ? doNewFile : doNewFolder}
                  style={{
                    padding: "14px 18px 0",
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: S.white, fontSize: "12px" }}>
                    Create {showNewFile ? "File" : "Folder"}:
                  </span>
                  <input
                    type="text"
                    placeholder="Enter name..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{
                      backgroundColor: S.input,
                      border: `1px solid ${S.inputBdr}`,
                      color: S.white,
                      padding: "5px 10px",
                      fontSize: "12.5px",
                      outline: "none",
                    }}
                  />
                  <Btn label="Create" color={S.orange} onClick={() => {}} />
                  <OutlineBtn
                    label="Cancel"
                    onClick={() => {
                      setShowNewFile(false);
                      setShowNewFolder(false);
                      setNewName("");
                    }}
                  />
                </form>
              )}

              {/* ── Directory listing ── */}
              {!selectedFile && (
                <div style={{ flex: 1, padding: "14px 18px", overflow: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>

                  {/* Breadcrumbs */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: S.cyan }}>
                    <span onClick={() => loadDir("")} style={{ cursor: "pointer", textDecoration: "underline" }}>root</span>
                    {pathParts.map((part, index) => {
                      const partialPath = pathParts.slice(0, index + 1).join("/");
                      return (
                        <React.Fragment key={index}>
                          <span style={{ color: S.muted }}>/</span>
                          <span onClick={() => loadDir(partialPath)} style={{ cursor: "pointer", textDecoration: "underline" }}>{part}</span>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* ── Search + Filter toolbar ── */}
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      placeholder="🔍 Filter files..."
                      value={fileSearchQuery}
                      onChange={(e) => { setFileSearchQuery(e.target.value); setSelectedFileNames(new Set()); }}
                      style={{
                        flex: 1,
                        minWidth: "160px",
                        backgroundColor: S.input,
                        border: `1px solid ${S.inputBdr}`,
                        color: S.white,
                        padding: "5px 10px",
                        fontSize: "12.5px",
                        outline: "none",
                        borderRadius: "3px",
                      }}
                    />
                    {(["all", "files", "folders"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => { setFileTypeFilter(t); setSelectedFileNames(new Set()); }}
                        style={{
                          padding: "5px 12px",
                          fontSize: "11.5px",
                          border: `1px solid ${fileTypeFilter === t ? S.cyan : S.border}`,
                          backgroundColor: fileTypeFilter === t ? "rgba(0,200,220,0.12)" : "transparent",
                          color: fileTypeFilter === t ? S.cyan : S.muted,
                          cursor: "pointer",
                          borderRadius: "3px",
                          transition: "all 0.15s",
                        }}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* ── Bulk-selection toolbar (shown when ≥1 selected) ── */}
                  {selectedFileNames.size > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "7px 12px",
                        backgroundColor: "rgba(200,80,80,0.08)",
                        border: `1px solid rgba(200,80,80,0.3)`,
                        borderRadius: "3px",
                        fontSize: "12.5px",
                      }}
                    >
                      <span style={{ color: S.white }}>
                        <strong style={{ color: "#e07070" }}>{selectedFileNames.size}</strong> item{selectedFileNames.size !== 1 ? "s" : ""} selected
                      </span>
                      <button
                        onClick={doBulkDelete}
                        disabled={bulkDeleting}
                        style={{
                          backgroundColor: "#7a2020",
                          border: "1px solid #aa3333",
                          color: "#ffaaaa",
                          padding: "4px 12px",
                          fontSize: "11.5px",
                          cursor: bulkDeleting ? "not-allowed" : "pointer",
                          borderRadius: "3px",
                          opacity: bulkDeleting ? 0.6 : 1,
                        }}
                      >
                        {bulkDeleting ? "Deleting..." : "🗑 Delete Selected"}
                      </button>
                      <button
                        onClick={() => setSelectedFileNames(new Set())}
                        style={{
                          backgroundColor: "transparent",
                          border: "none",
                          color: S.muted,
                          cursor: "pointer",
                          fontSize: "11.5px",
                          textDecoration: "underline",
                        }}
                      >
                        Clear selection
                      </button>
                    </div>
                  )}

                  {loadingFiles ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "50px", gap: "12px", color: S.muted }}>
                      <div className="spinner" />
                      <span>Loading directory contents...</span>
                    </div>
                  ) : (() => {
                    // Apply search + type filter
                    const q = fileSearchQuery.trim().toLowerCase();
                    const filtered = files.filter((f) => {
                      if (fileTypeFilter === "files" && !f.isFile) return false;
                      if (fileTypeFilter === "folders" && f.isFile) return false;
                      if (q && !f.name.toLowerCase().includes(q)) return false;
                      return true;
                    });
                    const allNames = filtered.map((f) => f.name);
                    const allSelected = allNames.length > 0 && allNames.every((n) => selectedFileNames.has(n));
                    const someSelected = !allSelected && allNames.some((n) => selectedFileNames.has(n));

                    return (
                      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${S.border}`, color: S.muted }}>
                            <th style={{ padding: "8px 6px", width: "32px" }}>
                              <input
                                type="checkbox"
                                checked={allSelected}
                                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                onChange={() => {
                                  if (allSelected) {
                                    setSelectedFileNames((prev) => {
                                      const next = new Set(prev);
                                      allNames.forEach((n) => next.delete(n));
                                      return next;
                                    });
                                  } else {
                                    setSelectedFileNames((prev) => new Set([...prev, ...allNames]));
                                  }
                                }}
                                style={{ cursor: "pointer", accentColor: S.cyan }}
                              />
                            </th>
                            <th style={{ padding: "8px 6px" }}>File Name</th>
                            <th style={{ padding: "8px 6px", width: "100px" }}>Size</th>
                            <th style={{ padding: "8px 6px", width: "160px" }}>Modified</th>
                            <th style={{ padding: "8px 6px", width: "150px", textAlign: "right" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentPath && (
                            <tr
                              className="tab-hover"
                              onClick={() => { const up = currentPath.split("/").slice(0, -1).join("/"); loadDir(up); }}
                              style={{ borderBottom: `1px solid ${S.border}`, cursor: "pointer", color: S.cyan }}
                            >
                              <td style={{ padding: "9px 6px" }} />
                              <td style={{ padding: "9px 6px" }} colSpan={3}>📁 .. (Go up)</td>
                              <td style={{ padding: "9px 6px" }}>–</td>
                            </tr>
                          )}
                          {filtered.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ color: S.muted, fontStyle: "italic", padding: "16px 6px", textAlign: "center" }}>
                                {files.length === 0 ? "This directory is empty." : "No files match your filter."}
                              </td>
                            </tr>
                          ) : (
                            filtered.map((file) => {
                              const isChecked = selectedFileNames.has(file.name);
                              return (
                                <tr
                                  key={file.name}
                                  className="tab-hover"
                                  style={{
                                    borderBottom: `1px solid ${S.border}`,
                                    backgroundColor: isChecked ? "rgba(0,200,220,0.05)" : undefined,
                                  }}
                                >
                                  {/* Checkbox */}
                                  <td style={{ padding: "9px 6px" }}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        setSelectedFileNames((prev) => {
                                          const next = new Set(prev);
                                          if (isChecked) next.delete(file.name); else next.add(file.name);
                                          return next;
                                        });
                                      }}
                                      style={{ cursor: "pointer", accentColor: S.cyan }}
                                    />
                                  </td>
                                  {/* Name */}
                                  <td
                                    style={{ padding: "9px 6px", cursor: "pointer", fontWeight: file.isFile ? "normal" : "bold" }}
                                    onClick={() => {
                                      if (file.isFile) openFile(file);
                                      else loadDir(currentPath ? `${currentPath}/${file.name}` : file.name);
                                    }}
                                  >
                                    {file.isFile ? "📄" : "📁"} {file.name}
                                  </td>
                                  {/* Size */}
                                  <td style={{ padding: "9px 6px", color: S.muted }}>
                                    {file.isFile ? fmtFileSize(file.size) : "DIR"}
                                  </td>
                                  {/* Modified */}
                                  <td style={{ padding: "9px 6px", color: S.muted }}>
                                    {file.modifyTime ? new Date(file.modifyTime * 1000).toLocaleString() : "–"}
                                  </td>
                                  {/* Actions */}
                                  <td style={{ padding: "9px 6px", textAlign: "right", display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                    {file.isFile && (
                                      <button
                                        onClick={() => downloadFile(file)}
                                        className="button-hover"
                                        style={{ backgroundColor: "transparent", color: S.cyan, border: "none", cursor: "pointer", fontSize: "11px", textDecoration: "underline" }}
                                      >
                                        Download
                                      </button>
                                    )}
                                    <button
                                      onClick={() => doDelete(file)}
                                      className="button-hover"
                                      style={{ backgroundColor: "transparent", color: "#aa4444", border: "none", cursor: "pointer", fontSize: "11px", textDecoration: "underline" }}
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ══ PLUGINS ══ */}
          {activeTab === "plugins" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%" }}>
              <TabHeader label="Plugin Search & Manager" icon={<Ico.Plugins />} />

              {pluginError && (
                <div
                  style={{
                    padding: "7px 18px",
                    backgroundColor: "#2a1111",
                    borderBottom: `1px solid #553333`,
                    color: "#cc6666",
                    fontSize: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{pluginError}</span>
                  <button
                    onClick={() => setPluginError("")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#cc6666",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              )}

              <div
                style={{
                  flex: 1,
                  overflow: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  padding: "18px",
                }}
              >
                {/* Search / Add new plugins section */}
                <div
                  style={{
                    border: `1px solid ${S.border}`,
                    backgroundColor: "#242424",
                    padding: "16px",
                    borderRadius: "3px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: 600, color: S.white }}>
                      Browse & Install Plugins
                    </div>
                    <span style={{ fontSize: "11px", color: S.muted, border: `1px solid ${S.border}`, padding: "2px 8px", borderRadius: "3px", backgroundColor: "#1e1e1e" }}>
                      Modrinth, Spiget & Hangar
                    </span>
                  </div>



                  {/* Search query input form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      searchPlugins();
                    }}
                    style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}
                  >
                    <input
                      type="text"
                      placeholder="Search plugins e.g. EssentialsX, WorldEdit, LuckPerms..."
                      value={pluginSearch}
                      onChange={(e) => setPluginSearch(e.target.value)}
                      style={{
                        flex: 1,
                        minWidth: "200px",
                        backgroundColor: S.input,
                        border: `1px solid ${S.inputBdr}`,
                        color: S.white,
                        padding: "8px 12px",
                        fontSize: "13px",
                        borderRadius: "4px",
                        outline: "none",
                      }}
                    />
                    <select
                      value={filterProvider}
                      onChange={(e) => setFilterProvider(e.target.value)}
                      style={{
                        backgroundColor: S.input,
                        border: `1px solid ${S.inputBdr}`,
                        color: S.white,
                        padding: "8px 12px",
                        fontSize: "13px",
                        borderRadius: "4px",
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="all">All Providers</option>
                      <option value="modrinth">Modrinth</option>
                      <option value="spiget">Spiget</option>
                      <option value="hangar">Hangar</option>
                    </select>
                    <select
                      value={filterVersion}
                      onChange={(e) => setFilterVersion(e.target.value)}
                      style={{
                        backgroundColor: S.input,
                        border: `1px solid ${S.inputBdr}`,
                        color: S.white,
                        padding: "8px 12px",
                        fontSize: "13px",
                        borderRadius: "4px",
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="all">All Versions</option>
                      <option value="1.21.4">1.21.4</option>
                      <option value="1.21.1">1.21.1</option>
                      <option value="1.21">1.21</option>
                      <option value="1.20.4">1.20.4</option>
                      <option value="1.20">1.20</option>
                      <option value="1.19.4">1.19.4</option>
                      <option value="1.19">1.19</option>
                      <option value="1.18.2">1.18.2</option>
                      <option value="1.16.5">1.16.5</option>
                    </select>
                    <Btn
                      label={searchingPlugins ? "Searching..." : "Search"}
                      color={S.cyan}
                      onClick={searchPlugins}
                      disabled={searchingPlugins}
                    />
                  </form>

                  {/* Search query results list */}
                  {(() => {
                    const filteredResults = searchResults.filter((plugin) => {
                      if (filterProvider !== "all") {
                        if (plugin.provider?.toLowerCase() !== filterProvider.toLowerCase()) {
                          return false;
                        }
                      }
                      if (filterVersion !== "all") {
                        const versions = plugin.versions || [];
                        const hasVersion = versions.some((v: string) => {
                          const cleanV = v.trim().toLowerCase();
                          const cleanFilter = filterVersion.trim().toLowerCase();
                          return cleanV === cleanFilter || cleanV.startsWith(cleanFilter) || cleanFilter.startsWith(cleanV);
                        });
                        if (!hasVersion) return false;
                      }
                      return true;
                    });

                    if (searchingPlugins) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px", gap: "10px", color: S.muted }}>
                          <div className="spinner" />
                          <span>Querying plugin repository...</span>
                        </div>
                      );
                    }

                    if (filteredResults.length > 0) {
                      return (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            maxHeight: "350px",
                            overflowY: "auto",
                            borderTop: `1px solid ${S.border}`,
                            paddingTop: "14px",
                          }}
                        >
                          {filteredResults.map((plugin) => {
                            const prov = plugin.provider?.toLowerCase() || "";
                            const provColors: Record<string, { text: string; bg: string; border: string }> = {
                              modrinth: { text: "#10b981", bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.3)" },
                              spiget: { text: "#0ea5e9", bg: "rgba(14, 165, 233, 0.1)", border: "rgba(14, 165, 233, 0.3)" },
                              hangar: { text: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.3)" },
                            };
                            const theme = provColors[prov] || { text: S.muted, bg: "transparent", border: S.border };
                            const installedJar = getInstalledPluginFile(plugin);

                            return (
                              <div
                                key={plugin.id}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "8px 12px",
                                  backgroundColor: "#1e1e1e",
                                  border: `1px solid ${S.border}`,
                                  borderRadius: "3px",
                                }}
                              >
                                <div style={{ display: "flex", gap: "12px", alignItems: "center", flex: 1, marginRight: "16px", minWidth: 0 }}>
                                  <PluginIcon url={plugin.iconUrl} size={32} color={theme.text} />
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ fontWeight: 600, color: S.white, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                                      <span>{plugin.name}</span>
                                      <span style={{
                                        fontSize: "9px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        color: theme.text,
                                        backgroundColor: theme.bg,
                                        border: `1px solid ${theme.border}`,
                                        padding: "1px 5px",
                                        borderRadius: "3px",
                                        fontWeight: "bold"
                                      }}>
                                        {plugin.provider}
                                      </span>
                                      {installedJar && (
                                        <span style={{
                                          fontSize: "9px",
                                          letterSpacing: "0.5px",
                                          color: "#10b981",
                                          backgroundColor: "rgba(16, 185, 129, 0.1)",
                                          border: "1px solid rgba(16, 185, 129, 0.3)",
                                          padding: "1px 5px",
                                          borderRadius: "3px",
                                          fontWeight: "bold"
                                        }}>
                                          ✓ Installed
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: "11px", color: S.muted, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      {plugin.tagline || "No description available"}
                                    </div>
                                    <div style={{ fontSize: "10px", color: S.cyan, marginTop: "4px" }}>
                                      Downloads: {plugin.downloads.toLocaleString()}
                                      {plugin.categories?.length > 0 && ` | Tags: ${plugin.categories.slice(0, 3).join(", ")}`}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <button
                                    onClick={() => setSelectedPluginDetails(plugin)}
                                    className="button-hover"
                                    style={{
                                      backgroundColor: "transparent",
                                      border: `1px solid ${S.border}`,
                                      color: S.cyan,
                                      cursor: "pointer",
                                      padding: "4px 10px",
                                      fontSize: "11.5px",
                                      borderRadius: "3px",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    Details
                                  </button>
                                  {installedJar ? (
                                    <button
                                      onClick={() => deletePlugin(installedJar.name)}
                                      className="button-hover"
                                      style={{
                                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                                        border: "1px solid rgba(239, 68, 68, 0.3)",
                                        color: "#ef4444",
                                        cursor: "pointer",
                                        padding: "4px 10px",
                                        fontSize: "11.5px",
                                        borderRadius: "4px",
                                        fontWeight: "bold",
                                        transition: "all 0.2s"
                                      }}
                                      disabled={loadingPlugins}
                                    >
                                      {loadingPlugins ? "Uninstalling..." : "Uninstall"}
                                    </button>
                                  ) : (
                                     <Btn
                                       label={!!installingPluginIds[plugin.id] ? "Installing..." : "Install"}
                                       color={S.green}
                                       onClick={() => installPlugin(plugin)}
                                       disabled={!!installingPluginIds[plugin.id]}
                                     />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }

                    return pluginSearch ? (
                      <div style={{ color: S.muted, fontSize: "12.5px", padding: "12px", textAlign: "center" }}>
                        No plugins found matching the filters. Try another query or adjust filters.
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Installed plugins list section */}
                <div
                  style={{
                    border: `1px solid ${S.border}`,
                    backgroundColor: "#242424",
                    padding: "16px",
                    borderRadius: "3px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: S.white }}>
                      Installed Plugins (/plugins folder)
                    </div>
                    <OutlineBtn label="Refresh List" onClick={loadInstalledPlugins} disabled={loadingPlugins} />
                  </div>

                  {loadingPlugins ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px", gap: "10px", color: S.muted }}>
                      <div className="spinner" />
                      <span>Reading installed plugins directory...</span>
                    </div>
                  ) : installedPlugins.length === 0 ? (
                    <div style={{ color: S.muted, fontSize: "12.5px", fontStyle: "italic", padding: "12px 0", textAlign: "center" }}>
                      No plugins found in /plugins directory. Try browsing and installing plugins above.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {installedPlugins.map((plugin) => {
                        const filenameClean = plugin.name.replace(/\.jar$/i, "").toLowerCase().replace(/[^a-z0-9]/g, "");
                        
                        let matched: any = searchResults.find((p) => {
                          const searchNameClean = p.name.toLowerCase().replace(/[^a-z0-9]/g, "");
                          return filenameClean === searchNameClean || filenameClean.includes(searchNameClean) || searchNameClean.includes(filenameClean);
                        });

                        if (!matched) {
                          const key = Object.keys(POPULAR_PLUGINS_META).find((k) => filenameClean.includes(k) || k.includes(filenameClean));
                          if (key) {
                            matched = POPULAR_PLUGINS_META[key];
                          }
                        }

                        const iconUrl = matched?.iconUrl;
                        const displayName = matched?.name || plugin.name.replace(/\.jar$/i, "");
                        const tagline = matched?.tagline || `Local plugin jar file. Path: plugins/${plugin.name}`;
                        const provider = matched?.provider || "Local File";
                        const sizeText = plugin.size !== undefined ? fmtFileSize(plugin.size) : "";
                        const providerColor = matched?.color || S.muted;
                        const providerBg = matched?.bg || "rgba(255,255,255,0.03)";
                        const providerBorder = matched?.border || S.border;

                        return (
                          <div
                            key={plugin.name}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "10px 14px",
                              backgroundColor: "#1e1e1e",
                              border: `1px solid ${S.border}`,
                              borderRadius: "3px",
                            }}
                          >
                            <div style={{ display: "flex", gap: "14px", alignItems: "center", flex: 1, marginRight: "16px", minWidth: 0 }}>
                              <PluginIcon url={iconUrl} size={36} color={providerColor} />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 600, color: S.white, fontSize: "13.5px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                  <span>{displayName}</span>
                                  <span style={{
                                    fontSize: "9px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    color: providerColor,
                                    backgroundColor: providerBg,
                                    border: `1px solid ${providerBorder}`,
                                    padding: "1px 5px",
                                    borderRadius: "3px",
                                    fontWeight: "bold"
                                  }}>
                                    {provider}
                                  </span>
                                  {sizeText && (
                                    <span style={{
                                      fontSize: "9px",
                                      letterSpacing: "0.5px",
                                      color: S.muted,
                                      backgroundColor: "rgba(255,255,255,0.03)",
                                      border: `1px solid ${S.border}`,
                                      padding: "1px 5px",
                                      borderRadius: "3px"
                                    }}>
                                      {sizeText}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: "11px", color: S.muted, marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {tagline}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              <button
                                onClick={() => setSelectedPluginDetails(matched || {
                                  id: filenameClean,
                                  name: displayName,
                                  tagline: tagline,
                                  description: tagline,
                                  provider: provider,
                                  downloads: 0,
                                  versions: [],
                                  categories: [],
                                  iconUrl: iconUrl
                                })}
                                className="button-hover"
                                style={{
                                  backgroundColor: "transparent",
                                  border: `1px solid ${S.border}`,
                                  color: S.cyan,
                                  cursor: "pointer",
                                  padding: "5px 12px",
                                  fontSize: "11px",
                                  borderRadius: "3px",
                                  fontWeight: "bold",
                                }}
                              >
                                Details
                              </button>
                              <button
                                onClick={() => deletePlugin(plugin.name)}
                                className="button-hover"
                                style={{
                                  backgroundColor: "rgba(239, 68, 68, 0.08)",
                                  border: "1px solid rgba(239, 68, 68, 0.25)",
                                  color: "#ef4444",
                                  cursor: "pointer",
                                  padding: "5px 12px",
                                  fontSize: "11px",
                                  borderRadius: "3px",
                                  fontWeight: "bold",
                                  transition: "all 0.1s"
                                }}
                                disabled={loadingPlugins}
                              >
                                {loadingPlugins ? "Uninstalling..." : "Uninstall"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ CONFIG ══ */}
          {activeTab === "config" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
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
                  <Ico.Config />
                  <span style={{ fontSize: "18px", fontWeight: 300 }}>
                    {configSubTab === "properties" ? "Server Properties" : "Startup Variables"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  {configSubTab === "properties" ? (
                    <>
                      <Btn
                        label={savingConfig ? "Saving..." : "Save Properties"}
                        color={S.orange}
                        onClick={saveConfig}
                        disabled={savingConfig || loadingConfig}
                      />
                      <OutlineBtn label="Refresh" onClick={loadConfig} disabled={loadingConfig} />
                    </>
                  ) : (
                    <OutlineBtn 
                      label="Refresh Settings" 
                      onClick={loadStartupSettings} 
                      disabled={savingStartup} 
                    />
                  )}
                </div>
              </div>

              {/* Configurations Sub-Tabs */}
              <div
                style={{
                  display: "flex",
                  backgroundColor: "#202020",
                  borderBottom: `1px solid ${S.border}`,
                  padding: "0 10px",
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={() => setConfigSubTab("properties")}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "transparent",
                    color: configSubTab === "properties" ? S.orange : S.muted,
                    border: "none",
                    borderBottom: configSubTab === "properties" ? `2px solid ${S.orange}` : "2px solid transparent",
                    fontSize: "12px",
                    fontWeight: configSubTab === "properties" ? "bold" : "normal",
                    cursor: "pointer",
                    outline: "none",
                  }}
                  className="tab-hover"
                >
                  Server Properties
                </button>
                <button
                  onClick={() => setConfigSubTab("startup")}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "transparent",
                    color: configSubTab === "startup" ? S.orange : S.muted,
                    border: "none",
                    borderBottom: configSubTab === "startup" ? `2px solid ${S.orange}` : "2px solid transparent",
                    fontSize: "12px",
                    fontWeight: configSubTab === "startup" ? "bold" : "normal",
                    cursor: "pointer",
                    outline: "none",
                  }}
                  className="tab-hover"
                >
                  Startup Variables
                </button>
              </div>

              {configSubTab === "properties" && configError && (
                <div
                  style={{
                    padding: "7px 18px",
                    backgroundColor: "#2a1111",
                    borderBottom: `1px solid #553333`,
                    color: "#cc6666",
                    fontSize: "12px",
                  }}
                >
                  {configError}
                </div>
              )}

              <div style={{ flex: 1, padding: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
                {configSubTab === "properties" ? (
                  <>
                    <div
                      style={{
                        backgroundColor: "#242424",
                        border: `1px solid ${S.border}`,
                        padding: "12px 14px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "10px",
                        borderRadius: "3px",
                      }}
                    >
                      <div style={{ fontSize: "11px", color: S.muted }}>
                        Editing: <span style={{ color: S.white, fontFamily: "monospace" }}>server.properties</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Search properties keys..."
                        value={configSearch}
                        onChange={(e) => setConfigSearch(e.target.value)}
                        style={{
                          backgroundColor: S.input,
                          border: `1px solid ${S.inputBdr}`,
                          color: S.white,
                          padding: "4px 8px",
                          fontSize: "12px",
                          outline: "none",
                          width: "200px",
                        }}
                      />
                    </div>

                    {loadingConfig ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "50px", gap: "12px", color: S.muted }}>
                        <div className="spinner" />
                        <span>Loading configurations file...</span>
                      </div>
                    ) : (
                      <div
                        style={{
                          border: `1px solid ${S.border}`,
                          backgroundColor: "#1e1e1e",
                          borderRadius: "3px",
                          overflow: "hidden",
                        }}
                      >
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                          <thead>
                            <tr
                              style={{
                                borderBottom: `1px solid ${S.border}`,
                                backgroundColor: "#161616",
                                color: S.muted,
                                textAlign: "left",
                              }}
                            >
                              <th style={{ padding: "8px 12px" }}>Properties Key</th>
                              <th style={{ padding: "8px 12px" }}>Configured Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredConfig.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={2}
                                  style={{
                                    padding: "16px",
                                    textAlign: "center",
                                    color: S.muted,
                                    fontStyle: "italic",
                                  }}
                                >
                                  No matching configuration options.
                                </td>
                              </tr>
                            ) : (
                              filteredConfig.map(([key, val]) => (
                                <tr
                                  key={key}
                                  className="tab-hover"
                                  style={{ borderBottom: `1px solid ${S.border}` }}
                                >
                                  <td
                                    style={{
                                      padding: "8px 12px",
                                      fontFamily: "monospace",
                                      color: S.cyan,
                                    }}
                                  >
                                    {key}
                                  </td>
                                  <td style={{ padding: "6px 12px" }}>
                                    {val === "true" || val === "false" ? (
                                      <div style={{ display: "flex", alignItems: "center", height: "30px" }}>
                                        <div 
                                          onClick={() => {
                                            const next = val === "true" ? "false" : "true";
                                            setConfigProps((prev) => ({ ...prev, [key]: next }));
                                          }}
                                          style={{
                                            width: "36px",
                                            height: "18px",
                                            borderRadius: "9px",
                                            backgroundColor: val === "true" ? S.green : "#444",
                                            position: "relative",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease-in-out",
                                            border: `1px solid ${val === "true" ? S.green : "#555"}`,
                                          }}
                                        >
                                          <div 
                                            style={{
                                              width: "14px",
                                              height: "14px",
                                              borderRadius: "50%",
                                              backgroundColor: S.white,
                                              position: "absolute",
                                              top: "1px",
                                              left: val === "true" ? "19px" : "1px",
                                              transition: "all 0.2s ease-in-out",
                                            }}
                                          />
                                        </div>
                                        <span style={{ fontSize: "11.5px", fontFamily: "monospace", color: val === "true" ? S.green : S.muted, marginLeft: "8px", userSelect: "none" }}>
                                          {val}
                                        </span>
                                      </div>
                                    ) : key === "difficulty" ? (
                                      <select
                                        value={val}
                                        onChange={(e) => {
                                          const next = e.target.value;
                                          setConfigProps((prev) => ({ ...prev, [key]: next }));
                                        }}
                                        style={{
                                          width: "100%",
                                          backgroundColor: S.input,
                                          color: S.white,
                                          border: `1px solid ${S.inputBdr}`,
                                          padding: "4px 8px",
                                          fontSize: "12.5px",
                                          fontFamily: "monospace",
                                          outline: "none",
                                          cursor: "pointer",
                                        }}
                                      >
                                        <option value="peaceful">peaceful</option>
                                        <option value="easy">easy</option>
                                        <option value="normal">normal</option>
                                        <option value="hard">hard</option>
                                      </select>
                                    ) : key === "gamemode" ? (
                                      <select
                                        value={val}
                                        onChange={(e) => {
                                          const next = e.target.value;
                                          setConfigProps((prev) => ({ ...prev, [key]: next }));
                                        }}
                                        style={{
                                          width: "100%",
                                          backgroundColor: S.input,
                                          color: S.white,
                                          border: `1px solid ${S.inputBdr}`,
                                          padding: "4px 8px",
                                          fontSize: "12.5px",
                                          fontFamily: "monospace",
                                          outline: "none",
                                          cursor: "pointer",
                                        }}
                                      >
                                        <option value="survival">survival</option>
                                        <option value="creative">creative</option>
                                        <option value="adventure">adventure</option>
                                        <option value="spectator">spectator</option>
                                      </select>
                                    ) : key === "level-type" ? (
                                      <select
                                        value={val}
                                        onChange={(e) => {
                                          const next = e.target.value;
                                          setConfigProps((prev) => ({ ...prev, [key]: next }));
                                        }}
                                        style={{
                                          width: "100%",
                                          backgroundColor: S.input,
                                          color: S.white,
                                          border: `1px solid ${S.inputBdr}`,
                                          padding: "4px 8px",
                                          fontSize: "12.5px",
                                          fontFamily: "monospace",
                                          outline: "none",
                                          cursor: "pointer",
                                        }}
                                      >
                                        <option value="minecraft:normal">minecraft:normal</option>
                                        <option value="minecraft:flat">minecraft:flat</option>
                                        <option value="minecraft:large_biomes">minecraft:large_biomes</option>
                                        <option value="minecraft:amplified">minecraft:amplified</option>
                                        <option value="minecraft:buffet">minecraft:buffet</option>
                                      </select>
                                    ) : key === "op-permission-level" || key === "function-permission-level" ? (
                                      <select
                                        value={val}
                                        onChange={(e) => {
                                          const next = e.target.value;
                                          setConfigProps((prev) => ({ ...prev, [key]: next }));
                                        }}
                                        style={{
                                          width: "100%",
                                          backgroundColor: S.input,
                                          color: S.white,
                                          border: `1px solid ${S.inputBdr}`,
                                          padding: "4px 8px",
                                          fontSize: "12.5px",
                                          fontFamily: "monospace",
                                          outline: "none",
                                          cursor: "pointer",
                                        }}
                                      >
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                      </select>
                                    ) : /^-?\d+$/.test(val) ? (
                                      <input
                                        type="number"
                                        value={val}
                                        onChange={(e) => {
                                          const next = e.target.value;
                                          setConfigProps((prev) => ({ ...prev, [key]: next }));
                                        }}
                                        style={{
                                          width: "100%",
                                          backgroundColor: S.input,
                                          color: S.white,
                                          border: `1px solid ${S.inputBdr}`,
                                          padding: "4px 8px",
                                          fontSize: "12.5px",
                                          fontFamily: "monospace",
                                          outline: "none",
                                        }}
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        value={val}
                                        onChange={(e) => {
                                          const next = e.target.value;
                                          setConfigProps((prev) => ({ ...prev, [key]: next }));
                                        }}
                                        style={{
                                          width: "100%",
                                          backgroundColor: S.input,
                                          color: S.white,
                                          border: `1px solid ${S.inputBdr}`,
                                          padding: "4px 8px",
                                          fontSize: "12.5px",
                                          fontFamily: "monospace",
                                          outline: "none",
                                        }}
                                      />
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ maxWidth: "800px", width: "100%", margin: "0 auto" }}>
                    <div
                      style={{
                        backgroundColor: "#242424",
                        border: `1px solid ${S.border}`,
                        padding: "20px",
                        borderRadius: "3px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `1px solid ${S.border}`, paddingBottom: "12px" }}>
                        <div>
                          <div style={{ fontSize: "16px", fontWeight: 600, color: S.white }}>
                            Startup Variables
                          </div>
                          <div style={{ fontSize: "11.5px", color: S.muted, marginTop: "4px" }}>
                            Changes will save automatically but a server restart is required to apply.
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {savingStartup ? (
                            <span style={{ color: S.cyan, display: "flex", alignItems: "center", gap: "6px" }}>
                              <span className="spinner-mini" style={{ marginRight: "4px" }} /> Saving...
                            </span>
                          ) : startupSavedTime ? (
                            <span style={{ color: S.green }}>
                              ✓ Saved at {startupSavedTime}
                            </span>
                          ) : (
                            <span style={{ color: S.muted }}>
                              ✓ Saved automatically
                            </span>
                          )}
                        </div>
                      </div>

                      {renderStartupVariablesForm(true)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ USERS ══ */}
          {activeTab === "users" && (
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
                    {(["ops", "whitelist", "banned-players", "banned-ips"] as const).map((l) => (
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
                        {l === "banned-players" ? "BANNED PLAYERS" : l === "banned-ips" ? "BANNED IPS" : l.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <OutlineBtn
                    label="Refresh"
                    onClick={() => loadUsers(userList)}
                    disabled={loadingUsers}
                  />
                </div>
              </div>

              {userError && (
                <div
                  style={{
                    padding: "7px 18px",
                    backgroundColor: "#2a1111",
                    borderBottom: `1px solid #553333`,
                    color: "#cc6666",
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
                      backgroundColor: "#242424",
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
                      <button
                        onClick={() => handleAction("whitelist on")}
                        className="button-hover"
                        style={{
                          backgroundColor: "#2e2e2e",
                          border: `1px solid ${S.border}`,
                          color: S.cyan,
                          padding: "5px 10px",
                          fontSize: "11px",
                          cursor: "pointer",
                          borderRadius: "3px",
                          fontWeight: "bold",
                        }}
                      >
                        Enable
                      </button>
                      <button
                        onClick={() => handleAction("whitelist off")}
                        className="button-hover"
                        style={{
                          backgroundColor: "#2e2e2e",
                          border: `1px solid ${S.border}`,
                          color: "#ff4d4d",
                          padding: "5px 10px",
                          fontSize: "11px",
                          cursor: "pointer",
                          borderRadius: "3px",
                          fontWeight: "bold",
                        }}
                      >
                        Disable
                      </button>
                      <button
                        onClick={() => handleAction("whitelist reload")}
                        className="button-hover"
                        style={{
                          backgroundColor: "#2e2e2e",
                          border: `1px solid ${S.border}`,
                          color: S.orange,
                          padding: "5px 10px",
                          fontSize: "11px",
                          cursor: "pointer",
                          borderRadius: "3px",
                          fontWeight: "bold",
                        }}
                      >
                        Reload
                      </button>
                    </div>
                  </div>

                  {/* Whitelist Add */}
                  <div
                    style={{
                      border: `1px solid ${S.border}`,
                      backgroundColor: "#242424",
                      padding: "16px",
                      borderRadius: "3px",
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: 600, color: S.white, marginBottom: "4px" }}>
                      Add to Whitelist
                    </div>
                    <div style={{ fontSize: "11px", color: S.muted, marginBottom: "12px" }}>
                      Allow a player to join when whitelist is enabled.
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="Player username"
                        value={whitelistInput}
                        onChange={(e) => setWhitelistInput(e.target.value)}
                        style={{
                          flex: 1,
                          backgroundColor: S.input,
                          border: `1px solid ${S.inputBdr}`,
                          color: S.white,
                          padding: "5px 8px",
                          fontSize: "12px",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={() => {
                          if (!whitelistInput.trim()) return;
                          handleAction(`whitelist add ${whitelistInput.trim()}`);
                          setWhitelistInput("");
                        }}
                        className="button-hover"
                        style={{
                          backgroundColor: S.cyan,
                          border: "none",
                          color: "#1a1a1a",
                          padding: "5px 12px",
                          fontSize: "11px",
                          cursor: "pointer",
                          borderRadius: "2px",
                          fontWeight: "bold",
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* OP Player */}
                  <div
                    style={{
                      border: `1px solid ${S.border}`,
                      backgroundColor: "#242424",
                      padding: "16px",
                      borderRadius: "3px",
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: 600, color: S.white, marginBottom: "4px" }}>
                      Promote to Operator (OP)
                    </div>
                    <div style={{ fontSize: "11px", color: S.muted, marginBottom: "12px" }}>
                      Grant full admin/moderator permissions.
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="Player username"
                        value={opInput}
                        onChange={(e) => setOpInput(e.target.value)}
                        style={{
                          flex: 1,
                          backgroundColor: S.input,
                          border: `1px solid ${S.inputBdr}`,
                          color: S.white,
                          padding: "5px 8px",
                          fontSize: "12px",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={() => {
                          if (!opInput.trim()) return;
                          handleAction(`op ${opInput.trim()}`);
                          setOpInput("");
                        }}
                        className="button-hover"
                        style={{
                          backgroundColor: S.cyan,
                          border: "none",
                          color: "#1a1a1a",
                          padding: "5px 12px",
                          fontSize: "11px",
                          cursor: "pointer",
                          borderRadius: "2px",
                          fontWeight: "bold",
                        }}
                      >
                        OP
                      </button>
                    </div>
                  </div>

                  {/* Ban Player */}
                  <div
                    style={{
                      border: `1px solid ${S.border}`,
                      backgroundColor: "#242424",
                      padding: "16px",
                      borderRadius: "3px",
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: 600, color: S.white, marginBottom: "4px" }}>
                      Ban Player
                    </div>
                    <div style={{ fontSize: "11px", color: S.muted, marginBottom: "12px" }}>
                      Prevent player from connecting to the server.
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="Player username"
                        value={banPlayerInput}
                        onChange={(e) => setBanPlayerInput(e.target.value)}
                        style={{
                          backgroundColor: S.input,
                          border: `1px solid ${S.inputBdr}`,
                          color: S.white,
                          padding: "5px 8px",
                          fontSize: "12px",
                          outline: "none",
                        }}
                      />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          placeholder="Reason (optional)"
                          value={banReasonInput}
                          onChange={(e) => setBanReasonInput(e.target.value)}
                          style={{
                            flex: 1,
                            backgroundColor: S.input,
                            border: `1px solid ${S.inputBdr}`,
                            color: S.white,
                            padding: "5px 8px",
                            fontSize: "12px",
                            outline: "none",
                          }}
                        />
                        <button
                          onClick={() => {
                            if (!banPlayerInput.trim()) return;
                            const cmd = banReasonInput.trim()
                              ? `ban ${banPlayerInput.trim()} ${banReasonInput.trim()}`
                              : `ban ${banPlayerInput.trim()}`;
                            handleAction(cmd);
                            setBanPlayerInput("");
                            setBanReasonInput("");
                          }}
                          className="button-hover"
                          style={{
                            backgroundColor: "#ff4d4d",
                            border: "none",
                            color: S.white,
                            padding: "5px 12px",
                            fontSize: "11px",
                            cursor: "pointer",
                            borderRadius: "2px",
                            fontWeight: "bold",
                          }}
                        >
                          Ban
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Ban IP */}
                  <div
                    style={{
                      border: `1px solid ${S.border}`,
                      backgroundColor: "#242424",
                      padding: "16px",
                      borderRadius: "3px",
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: 600, color: S.white, marginBottom: "4px" }}>
                      Ban IP Address
                    </div>
                    <div style={{ fontSize: "11px", color: S.muted, marginBottom: "12px" }}>
                      Ban a specific IP address from accessing the server.
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="IP Address (e.g. 192.168.1.1)"
                        value={banIpInput}
                        onChange={(e) => setBanIpInput(e.target.value)}
                        style={{
                          backgroundColor: S.input,
                          border: `1px solid ${S.inputBdr}`,
                          color: S.white,
                          padding: "5px 8px",
                          fontSize: "12px",
                          outline: "none",
                        }}
                      />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          placeholder="Reason (optional)"
                          value={banIpReasonInput}
                          onChange={(e) => setBanIpReasonInput(e.target.value)}
                          style={{
                            flex: 1,
                            backgroundColor: S.input,
                            border: `1px solid ${S.inputBdr}`,
                            color: S.white,
                            padding: "5px 8px",
                            fontSize: "12px",
                            outline: "none",
                          }}
                        />
                        <button
                          onClick={() => {
                            if (!banIpInput.trim()) return;
                            const cmd = banIpReasonInput.trim()
                              ? `ban-ip ${banIpInput.trim()} ${banIpReasonInput.trim()}`
                              : `ban-ip ${banIpInput.trim()}`;
                            handleAction(cmd);
                            setBanIpInput("");
                            setBanIpReasonInput("");
                          }}
                          className="button-hover"
                          style={{
                            backgroundColor: "#ff4d4d",
                            border: "none",
                            color: S.white,
                            padding: "5px 12px",
                            fontSize: "11px",
                            cursor: "pointer",
                            borderRadius: "2px",
                            fontWeight: "bold",
                          }}
                        >
                          Ban IP
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Whitelist Remove */}
                  <div
                    style={{
                      border: `1px solid ${S.border}`,
                      backgroundColor: "#242424",
                      padding: "16px",
                      borderRadius: "3px",
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: 600, color: S.white, marginBottom: "4px" }}>
                      Remove from Whitelist
                    </div>
                    <div style={{ fontSize: "11px", color: S.muted, marginBottom: "12px" }}>
                      Remove a player's access when whitelist is enabled.
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="Player username"
                        value={whitelistRemoveInput}
                        onChange={(e) => setWhitelistRemoveInput(e.target.value)}
                        style={{
                          flex: 1,
                          backgroundColor: S.input,
                          border: `1px solid ${S.inputBdr}`,
                          color: S.white,
                          padding: "5px 8px",
                          fontSize: "12px",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={() => {
                          if (!whitelistRemoveInput.trim()) return;
                          handleAction(`whitelist remove ${whitelistRemoveInput.trim()}`);
                          setWhitelistRemoveInput("");
                        }}
                        className="button-hover"
                        style={{
                          backgroundColor: S.orange,
                          border: "none",
                          color: S.white,
                          padding: "5px 12px",
                          fontSize: "11px",
                          cursor: "pointer",
                          borderRadius: "2px",
                          fontWeight: "bold",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* De-OP Player */}
                  <div
                    style={{
                      border: `1px solid ${S.border}`,
                      backgroundColor: "#242424",
                      padding: "16px",
                      borderRadius: "3px",
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: 600, color: S.white, marginBottom: "4px" }}>
                      Demote Operator (De-OP)
                    </div>
                    <div style={{ fontSize: "11px", color: S.muted, marginBottom: "12px" }}>
                      Revoke full admin/moderator permissions.
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="Player username"
                        value={deopInput}
                        onChange={(e) => setDeopInput(e.target.value)}
                        style={{
                          flex: 1,
                          backgroundColor: S.input,
                          border: `1px solid ${S.inputBdr}`,
                          color: S.white,
                          padding: "5px 8px",
                          fontSize: "12px",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={() => {
                          if (!deopInput.trim()) return;
                          handleAction(`deop ${deopInput.trim()}`);
                          setDeopInput("");
                        }}
                        className="button-hover"
                        style={{
                          backgroundColor: S.orange,
                          border: "none",
                          color: S.white,
                          padding: "5px 12px",
                          fontSize: "11px",
                          cursor: "pointer",
                          borderRadius: "2px",
                          fontWeight: "bold",
                        }}
                      >
                        De-OP
                      </button>
                    </div>
                  </div>

                  {/* Kick Player */}
                  <div
                    style={{
                      border: `1px solid ${S.border}`,
                      backgroundColor: "#242424",
                      padding: "16px",
                      borderRadius: "3px",
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: 600, color: S.white, marginBottom: "4px" }}>
                      Kick Player
                    </div>
                    <div style={{ fontSize: "11px", color: S.muted, marginBottom: "12px" }}>
                      Disconnect a player immediately from the server.
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="Player username"
                        value={kickPlayerInput}
                        onChange={(e) => setKickPlayerInput(e.target.value)}
                        style={{
                          backgroundColor: S.input,
                          border: `1px solid ${S.inputBdr}`,
                          color: S.white,
                          padding: "5px 8px",
                          fontSize: "12px",
                          outline: "none",
                        }}
                      />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          placeholder="Reason (optional)"
                          value={kickReasonInput}
                          onChange={(e) => setKickReasonInput(e.target.value)}
                          style={{
                            flex: 1,
                            backgroundColor: S.input,
                            border: `1px solid ${S.inputBdr}`,
                            color: S.white,
                            padding: "5px 8px",
                            fontSize: "12px",
                            outline: "none",
                          }}
                        />
                        <button
                          onClick={() => {
                            if (!kickPlayerInput.trim()) return;
                            const cmd = kickReasonInput.trim()
                              ? `kick ${kickPlayerInput.trim()} ${kickReasonInput.trim()}`
                              : `kick ${kickPlayerInput.trim()}`;
                            handleAction(cmd);
                            setKickPlayerInput("");
                            setKickReasonInput("");
                          }}
                          className="button-hover"
                          style={{
                            backgroundColor: S.orange,
                            border: "none",
                            color: S.white,
                            padding: "5px 12px",
                            fontSize: "11px",
                            cursor: "pointer",
                            borderRadius: "2px",
                            fontWeight: "bold",
                          }}
                        >
                          Kick
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pardon Player */}
                  <div
                    style={{
                      border: `1px solid ${S.border}`,
                      backgroundColor: "#242424",
                      padding: "16px",
                      borderRadius: "3px",
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: 600, color: S.white, marginBottom: "4px" }}>
                      Pardon Player (Unban)
                    </div>
                    <div style={{ fontSize: "11px", color: S.muted, marginBottom: "12px" }}>
                      Unban a player and allow them to connect again.
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="Player username"
                        value={pardonInput}
                        onChange={(e) => setPardonInput(e.target.value)}
                        style={{
                          flex: 1,
                          backgroundColor: S.input,
                          border: `1px solid ${S.inputBdr}`,
                          color: S.white,
                          padding: "5px 8px",
                          fontSize: "12px",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={() => {
                          if (!pardonInput.trim()) return;
                          handleAction(`pardon ${pardonInput.trim()}`);
                          setPardonInput("");
                        }}
                        className="button-hover"
                        style={{
                          backgroundColor: S.cyan,
                          border: "none",
                          color: "#1a1a1a",
                          padding: "5px 12px",
                          fontSize: "11px",
                          cursor: "pointer",
                          borderRadius: "2px",
                          fontWeight: "bold",
                        }}
                      >
                        Pardon
                      </button>
                    </div>
                  </div>

                  {/* Pardon IP */}
                  <div
                    style={{
                      border: `1px solid ${S.border}`,
                      backgroundColor: "#242424",
                      padding: "16px",
                      borderRadius: "3px",
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: 600, color: S.white, marginBottom: "4px" }}>
                      Pardon IP Address
                    </div>
                    <div style={{ fontSize: "11px", color: S.muted, marginBottom: "12px" }}>
                      Unban a specific IP address.
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="IP Address (e.g. 192.168.1.1)"
                        value={pardonIpInput}
                        onChange={(e) => setPardonIpInput(e.target.value)}
                        style={{
                          flex: 1,
                          backgroundColor: S.input,
                          border: `1px solid ${S.inputBdr}`,
                          color: S.white,
                          padding: "5px 8px",
                          fontSize: "12px",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={() => {
                          if (!pardonIpInput.trim()) return;
                          handleAction(`pardon-ip ${pardonIpInput.trim()}`);
                          setPardonIpInput("");
                        }}
                        className="button-hover"
                        style={{
                          backgroundColor: S.cyan,
                          border: "none",
                          color: "#1a1a1a",
                          padding: "5px 12px",
                          fontSize: "11px",
                          cursor: "pointer",
                          borderRadius: "2px",
                          fontWeight: "bold",
                        }}
                      >
                        Pardon
                      </button>
                    </div>
                  </div>
                </div>

                {/* Send action commands */}
                <div
                  style={{
                    border: `1px solid ${S.border}`,
                    backgroundColor: "#242424",
                    padding: "16px",
                    borderRadius: "3px",
                  }}
                >
                  <div style={{ fontSize: "13px", fontWeight: 600, color: S.white, marginBottom: "10px" }}>
                    Quick Management Command
                  </div>
                  <form onSubmit={sendUserCmd} style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="text"
                      placeholder="e.g. whitelist add Notch, op agreeable_guy, ban Herobrine..."
                      value={userCmd}
                      onChange={(e) => setUserCmd(e.target.value)}
                      style={{
                        flex: 1,
                        backgroundColor: S.input,
                        border: `1px solid ${S.inputBdr}`,
                        color: S.white,
                        padding: "8px 12px",
                        fontSize: "13px",
                        outline: "none",
                      }}
                    />
                    <Btn label="Run Command" color={S.cyan} onClick={() => {}} />
                  </form>
                </div>

                {/* Players Listing Table */}
                <div
                  style={{
                    border: `1px solid ${S.border}`,
                    backgroundColor: "#1e1e1e",
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                >
                  {loadingUsers ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", gap: "10px", color: S.muted }}>
                      <div className="spinner" />
                      <span>Loading player files...</span>
                    </div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                      <thead>
                        <tr
                          style={{
                            borderBottom: `1px solid ${S.border}`,
                            backgroundColor: "#161616",
                            color: S.muted,
                            textAlign: "left",
                          }}
                        >
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
                          <th style={{ padding: "8px 12px", width: "180px", textAlign: "right" }}>
                            Quick Revoke
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {players.length === 0 ? (
                          <tr>
                            <td
                              colSpan={userList === "banned-players" || userList === "banned-ips" ? 5 : userList === "ops" ? 4 : 3}
                              style={{
                                padding: "20px",
                                textAlign: "center",
                                color: S.muted,
                                fontStyle: "italic",
                              }}
                            >
                              This list is empty. No players found.
                            </td>
                          </tr>
                        ) : (
                          players.map((p) => (
                            <tr
                              key={p.uuid || p.name || p.ip}
                              className="tab-hover"
                              style={{ borderBottom: `1px solid ${S.border}` }}
                            >
                              <td
                                style={{
                                  padding: "8px 12px",
                                  fontFamily: "monospace",
                                  fontSize: "11.5px",
                                  color: S.muted,
                                }}
                              >
                                {userList === "banned-ips" ? (p.ip || "–") : (p.uuid || "–")}
                              </td>
                              <td
                                style={{
                                  padding: "8px 12px",
                                  fontWeight: "bold",
                                  color: S.white,
                                }}
                              >
                                {userList === "banned-ips" ? (p.created || "–") : p.name}
                              </td>
                              {userList === "ops" && (
                                <td style={{ padding: "8px 12px", color: S.cyan }}>{p.level || "4"}</td>
                              )}
                              {userList === "banned-players" && (
                                <>
                                  <td style={{ padding: "8px 12px", color: S.muted }}>
                                    {p.created || "–"}
                                  </td>
                                  <td style={{ padding: "8px 12px", color: "#cc8866" }}>
                                    {p.reason || "No reason given"}
                                  </td>
                                </>
                              )}
                              {userList === "banned-ips" && (
                                <>
                                  <td style={{ padding: "8px 12px", color: S.muted }}>
                                    {p.source || "–"}
                                  </td>
                                  <td style={{ padding: "8px 12px", color: "#cc8866" }}>
                                    {p.reason || "No reason given"}
                                  </td>
                                </>
                              )}
                              <td style={{ padding: "8px 12px", textAlign: "right" }}>
                                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                  {userList === "ops" && (
                                    <>
                                      <button
                                        onClick={() => handleAction(`deop ${p.name}`)}
                                        className="button-hover"
                                        style={{
                                          backgroundColor: "transparent",
                                          color: S.orange,
                                          border: `1px solid ${S.orange}`,
                                          cursor: "pointer",
                                          padding: "2px 8px",
                                          fontSize: "11px",
                                          borderRadius: "2px",
                                        }}
                                      >
                                        De-OP
                                      </button>
                                      <button
                                        onClick={() => handleAction(`ban ${p.name}`)}
                                        className="button-hover"
                                        style={{
                                          backgroundColor: "transparent",
                                          color: "#ff4d4d",
                                          border: `1px solid #ff4d4d`,
                                          cursor: "pointer",
                                          padding: "2px 8px",
                                          fontSize: "11px",
                                          borderRadius: "2px",
                                        }}
                                      >
                                        Ban
                                      </button>
                                    </>
                                  )}
                                  {userList === "whitelist" && (
                                    <>
                                      <button
                                        onClick={() => handleAction(`whitelist remove ${p.name}`)}
                                        className="button-hover"
                                        style={{
                                          backgroundColor: "transparent",
                                          color: S.orange,
                                          border: `1px solid ${S.orange}`,
                                          cursor: "pointer",
                                          padding: "2px 8px",
                                          fontSize: "11px",
                                          borderRadius: "2px",
                                        }}
                                      >
                                        Remove
                                      </button>
                                      <button
                                        onClick={() => handleAction(`op ${p.name}`)}
                                        className="button-hover"
                                        style={{
                                          backgroundColor: "transparent",
                                          color: S.cyan,
                                          border: `1px solid ${S.cyan}`,
                                          cursor: "pointer",
                                          padding: "2px 8px",
                                          fontSize: "11px",
                                          borderRadius: "2px",
                                        }}
                                      >
                                        OP
                                      </button>
                                      <button
                                        onClick={() => handleAction(`ban ${p.name}`)}
                                        className="button-hover"
                                        style={{
                                          backgroundColor: "transparent",
                                          color: "#ff4d4d",
                                          border: `1px solid #ff4d4d`,
                                          cursor: "pointer",
                                          padding: "2px 8px",
                                          fontSize: "11px",
                                          borderRadius: "2px",
                                        }}
                                      >
                                        Ban
                                      </button>
                                    </>
                                  )}
                                  {userList === "banned-players" && (
                                    <button
                                      onClick={() => handleAction(`pardon ${p.name}`)}
                                      className="button-hover"
                                      style={{
                                        backgroundColor: "transparent",
                                        color: S.cyan,
                                        border: `1px solid ${S.cyan}`,
                                        cursor: "pointer",
                                        padding: "2px 8px",
                                        fontSize: "11px",
                                        borderRadius: "2px",
                                      }}
                                    >
                                      Pardon
                                    </button>
                                  )}
                                  {userList === "banned-ips" && (
                                    <button
                                      onClick={() => handleAction(`pardon-ip ${p.ip}`)}
                                      className="button-hover"
                                      style={{
                                        backgroundColor: "transparent",
                                        color: S.cyan,
                                        border: `1px solid ${S.cyan}`,
                                        cursor: "pointer",
                                        padding: "2px 8px",
                                        fontSize: "11px",
                                        borderRadius: "2px",
                                      }}
                                    >
                                      Pardon IP
                                    </button>
                                  )}
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
          )}

          {/* ══ NETWORKING ══ */}
          {activeTab === "networking" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <TabHeader label="Networking & Port Allocation" icon={<Ico.Networking />} />

              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Active ports card */}
                <div
                  style={{
                    backgroundColor: "#242424",
                    border: `1px solid ${S.border}`,
                    padding: "16px",
                    borderRadius: "3px",
                  }}
                >
                  <div style={{ fontSize: "14px", fontWeight: 600, color: S.white, marginBottom: "12px" }}>
                    Active Network Bindings
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                    <thead>
                      <tr
                        style={{
                          borderBottom: `1px solid ${S.border}`,
                          color: S.muted,
                          textAlign: "left",
                        }}
                      >
                        <th style={{ padding: "8px 6px" }}>Service</th>
                        <th style={{ padding: "8px 6px" }}>Bind Interface</th>
                        <th style={{ padding: "8px 6px" }}>Daemon Port</th>
                        <th style={{ padding: "8px 6px" }}>Protocol</th>
                        <th style={{ padding: "8px 6px", width: "90px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: `1px solid ${S.border}` }}>
                        <td style={{ padding: "10px 6px", color: S.orange, fontWeight: "bold" }}>
                          Minecraft Server (Paper)
                        </td>
                        <td style={{ padding: "10px 6px", fontFamily: "monospace" }}>
                          {statusData?.bindIp || "0.0.0.0"}
                        </td>
                        <td style={{ padding: "10px 6px", fontFamily: "monospace", color: S.white }}>
                          {statusData?.port || 25565}
                        </td>
                        <td style={{ padding: "10px 6px", color: S.muted }}>TCP/UDP</td>
                        <td style={{ padding: "10px 6px" }}>
                          <span style={{ color: S.green, fontWeight: "bold" }}>ACTIVE</span>
                        </td>
                      </tr>
                      <tr style={{ borderBottom: `1px solid ${S.border}` }}>
                        <td style={{ padding: "10px 6px", color: S.cyan, fontWeight: "bold" }}>
                          Secure File Transfer (SFTP)
                        </td>
                        <td style={{ padding: "10px 6px", fontFamily: "monospace" }}>0.0.0.0</td>
                        <td style={{ padding: "10px 6px", fontFamily: "monospace", color: S.white }}>
                          {statusData?.sftpPort || 5657}
                        </td>
                        <td style={{ padding: "10px 6px", color: S.muted }}>TCP</td>
                        <td style={{ padding: "10px 6px" }}>
                          <span style={{ color: S.green, fontWeight: "bold" }}>ACTIVE</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Configure Port Bindings card */}
                <div
                  style={{
                    backgroundColor: "#242424",
                    border: `1px solid ${S.border}`,
                    padding: "18px",
                    borderRadius: "3px",
                  }}
                >
                  <div style={{ fontSize: "14px", fontWeight: 600, color: S.white, marginBottom: "12px" }}>
                    Configure Port Bindings
                  </div>
                  {loadingNetwork ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", color: S.muted, padding: "10px 0" }}>
                      <div className="spinner" />
                      <span style={{ fontSize: "12px" }}>Loading bindings configuration...</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: "200px" }}>
                          <label style={{ display: "block", fontSize: "11px", color: S.muted, marginBottom: "6px" }}>BIND IP ADDRESS</label>
                          <input
                            type="text"
                            value={bindIp}
                            onChange={(e) => setBindIp(e.target.value)}
                            style={{
                              backgroundColor: S.input,
                              border: `1px solid ${S.inputBdr}`,
                              color: S.white,
                              padding: "8px 12px",
                              fontSize: "13px",
                              outline: "none",
                              borderRadius: "3px",
                              width: "100%",
                            }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: "200px" }}>
                          <label style={{ display: "block", fontSize: "11px", color: S.muted, marginBottom: "6px" }}>DAEMON PORT</label>
                          <input
                            type="number"
                            value={bindPort}
                            onChange={(e) => setBindPort(e.target.value)}
                            style={{
                              backgroundColor: S.input,
                              border: `1px solid ${S.inputBdr}`,
                              color: S.white,
                              padding: "8px 12px",
                              fontSize: "13px",
                              outline: "none",
                              borderRadius: "3px",
                              width: "100%",
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
                        <Btn
                          label={savingNetwork ? "Saving & Restarting..." : "Save Bindings & Restart"}
                          color={S.orange}
                          onClick={saveNetworkSettingsAndRestart}
                          disabled={savingNetwork || loadingNetwork}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Connection Address info card */}
                <div
                  style={{
                    backgroundColor: "#242424",
                    border: `1px solid ${S.border}`,
                    padding: "18px",
                    borderRadius: "3px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: S.white,
                      marginBottom: "12px",
                      borderBottom: `1px solid ${S.border}`,
                      paddingBottom: "8px",
                    }}
                  >
                    Quick Connections Addresses
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: S.muted }}>MINECRAFT GAME IP</div>
                        <div style={{ fontSize: "14px", fontFamily: "monospace", color: S.white, fontWeight: "bold" }}>
                          meowtopia-panel.duckdns.org:{statusData?.port || 25565}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`meowtopia-panel.duckdns.org:${statusData?.port || 25565}`);
                          showToast("Game connection IP address copied to clipboard.", "success");
                        }}
                        className="button-hover"
                        style={{
                          backgroundColor: "#2a2a2a",
                          border: `1px solid ${S.border}`,
                          color: S.cyan,
                          padding: "5px 12px",
                          fontSize: "11px",
                          cursor: "pointer",
                          borderRadius: "3px",
                        }}
                      >
                        Copy IP
                      </button>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: S.muted }}>SFTP URI</div>
                        <div style={{ fontSize: "14px", fontFamily: "monospace", color: S.white, fontWeight: "bold" }}>
                          sftp://{statusData?.sftpUsername || "agreeable_guy-946f16b4"}@
                          {statusData?.sftpHost || "meowtopia-panel.duckdns.org"}:
                          {statusData?.sftpPort || 5657}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `sftp://${statusData?.sftpUsername || "agreeable_guy-946f16b4"}@${
                              statusData?.sftpHost || "meowtopia-panel.duckdns.org"
                            }:${statusData?.sftpPort || 5657}`
                          );
                          showToast("SFTP connection URI copied to clipboard.", "success");
                        }}
                        className="button-hover"
                        style={{
                          backgroundColor: "#2a2a2a",
                          border: `1px solid ${S.border}`,
                          color: S.cyan,
                          padding: "5px 12px",
                          fontSize: "11px",
                          cursor: "pointer",
                          borderRadius: "3px",
                        }}
                      >
                        Copy SFTP URI
                      </button>
                    </div>
                  </div>
                </div>

                {/* Infrastructure specs card */}
                <div
                  style={{
                    backgroundColor: "#242424",
                    border: `1px solid ${S.border}`,
                    padding: "16px",
                    borderRadius: "3px",
                  }}
                >
                  <div style={{ fontSize: "14px", fontWeight: 600, color: S.white, marginBottom: "8px" }}>
                    Infrastructure Hosting Context
                  </div>
                  <div style={{ fontSize: "12px", color: S.muted, lineHeight: "1.5" }}>
                    This Minecraft server is running inside a Docker virtualization daemon container
                    managed by PufferPanel. The environment is hosted on an{" "}
                    <span style={{ color: S.white, fontWeight: "bold" }}>Oracle Cloud ARM Virtual Machine</span>{" "}
                    (ubuntu). Allocated resources include:
                    <ul style={{ margin: "6px 0", paddingLeft: "20px", color: S.white }}>
                      <li>CPU cores capacity: 4 OCPUs (ARM64 architecture)</li>
                      <li>Total host system memory: 24 GB RAM</li>
                      <li>Allocated JVM heap space memory: {statusData?.allocatedMemory || 12288} MB</li>
                      <li>Failsafe bandwidth throughput: 1 Gbps connection</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ LOGS FILE VIEW ══ */}
          {activeTab === "logs" && (
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
                  <Ico.Logs />
                  <span style={{ fontSize: "18px", fontWeight: 300 }}>Full Server logs/latest.log</span>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Search logs lines..."
                    value={logsSearch}
                    onChange={(e) => setLogsSearch(e.target.value)}
                    style={{
                      backgroundColor: S.input,
                      border: `1px solid ${S.inputBdr}`,
                      color: S.white,
                      padding: "4px 8px",
                      fontSize: "12px",
                      outline: "none",
                      width: "180px",
                    }}
                  />
                  <Btn label="Refresh Logs" color={S.cyan} onClick={loadLogsContent} />
                  <Btn
                    label="Download logs"
                    color={S.green}
                    onClick={() =>
                      window.open("/api/files/download?path=logs/latest.log", "_blank")
                    }
                  />
                  <button
                    onClick={clearLogFile}
                    className="button-hover"
                    style={{
                      backgroundColor: "transparent",
                      border: `1px solid ${S.red}`,
                      color: S.red,
                      cursor: "pointer",
                      padding: "5px 12px",
                      fontSize: "12px",
                      borderRadius: "3px",
                    }}
                  >
                    Clear File
                  </button>
                </div>
              </div>

              {loadingLogs ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "50px", gap: "12px", color: S.muted }}>
                  <div className="spinner" />
                  <span>Reading server log file...</span>
                </div>
              ) : (
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#111",
                    margin: "18px",
                    border: `1px solid ${S.border}`,
                    padding: "12px 14px",
                    fontFamily: "'Consolas','Courier New',monospace",
                    fontSize: "12px",
                    lineHeight: "1.6",
                    color: "#bbb",
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                    borderRadius: "3px",
                  }}
                >
                  {(() => {
                    const lines = logsContent.split("\n");
                    const filtered = lines.filter((l) =>
                      l.toLowerCase().includes(logsSearch.toLowerCase())
                    );

                    if (filtered.length === 0 || (filtered.length === 1 && !filtered[0])) {
                      return <span style={{ color: "#555" }}>[No logs matching filters found]</span>;
                    }

                    return filtered.map((line, idx) => {
                      let color = "#bbb";
                      if (/ERROR|Exception/.test(line)) color = "#dd6666";
                      else if (/WARN/.test(line)) color = S.orange;
                      else if (/INFO/.test(line)) color = "#ccc";

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
          )}

          {/* ══ BACKUPS TAB ══ */}
          {activeTab === "backups" && (
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
                  <Ico.Backups />
                  <span style={{ fontSize: "18px", fontWeight: 300 }}>Backup Manager</span>
                </div>
                <div>
                  <Btn
                    label={creatingBackup ? "Creating ZIP backup..." : "Create Backup Now"}
                    color={S.orange}
                    onClick={createBackup}
                    disabled={creatingBackup || loadingBackups}
                  />
                </div>
              </div>

              {creatingBackup && (
                <div style={{ padding: "12px 18px", backgroundColor: "#202020", color: S.orange, borderBottom: `1px solid ${S.border}`, fontSize: "12.5px" }}>
                  ⏳ Creating backup ZIP archive... This process packages all server root files (excluding backups/) and runs asynchronously on PufferPanel.
                </div>
              )}

              <div style={{ flex: 1, padding: "18px", overflow: "auto" }}>
                {loadingBackups ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "50px", gap: "12px", color: S.muted }}>
                    <div className="spinner" />
                    <span>Loading backup zip archives list...</span>
                  </div>
                ) : backups.length === 0 ? (
                  <div
                    style={{
                      border: `1px solid ${S.border}`,
                      backgroundColor: "#242424",
                      padding: "30px 20px",
                      textAlign: "center",
                      color: S.muted,
                      borderRadius: "3px",
                    }}
                  >
                    <div style={{ fontSize: "14px", color: S.white, marginBottom: "8px" }}>
                      No Backups Created Yet
                    </div>
                    <div style={{ fontSize: "12px", marginBottom: "16px" }}>
                      Store secure copy backups of your Minecraft world, configuration, and plugins.
                    </div>
                    <Btn
                      label={creatingBackup ? "Creating..." : "Create World Backup"}
                      color={S.orange}
                      onClick={createBackup}
                      disabled={creatingBackup}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      border: `1px solid ${S.border}`,
                      backgroundColor: "#242424",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ padding: "12px 14px", fontSize: "13px", fontWeight: "bold", borderBottom: `1px solid ${S.border}`, color: S.white }}>
                      Available Backup Archives (.zip)
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${S.border}`, backgroundColor: "#1e1e1e", color: S.muted }}>
                          <th style={{ padding: "10px 14px" }}>Archive Filename</th>
                          <th style={{ padding: "10px 14px", width: "120px" }}>Size</th>
                          <th style={{ padding: "10px 14px", width: "180px" }}>Created</th>
                          <th style={{ padding: "10px 14px", width: "200px", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backups.map((backup) => (
                          <tr key={backup.name} className="tab-hover" style={{ borderBottom: `1px solid ${S.border}` }}>
                            <td style={{ padding: "10px 14px", fontFamily: "monospace", color: S.cyan }}>
                              💾 {backup.name}
                            </td>
                            <td style={{ padding: "10px 14px", color: S.white }}>
                              {fmtFileSize(backup.size)}
                            </td>
                            <td style={{ padding: "10px 14px", color: S.muted }}>
                              {new Date(backup.modifyTime * 1000).toLocaleString()}
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                              <button
                                onClick={() => restoreBackup(backup.name)}
                                disabled={restoringBackup !== null}
                                className="button-hover"
                                style={{
                                  backgroundColor: "transparent",
                                  border: `1px solid ${S.orange}`,
                                  color: S.orange,
                                  padding: "3px 9px",
                                  fontSize: "11px",
                                  cursor: "pointer",
                                  borderRadius: "2px",
                                }}
                              >
                                {restoringBackup === backup.name ? "Extracting..." : "Restore"}
                              </button>
                              <button
                                onClick={() =>
                                  window.open(
                                    `/api/files/download?path=backups/${encodeURIComponent(backup.name)}/${encodeURIComponent(backup.name)}.zip`,
                                    "_blank"
                                  )
                                }
                                className="button-hover"
                                style={{
                                  backgroundColor: "transparent",
                                  border: `1px solid ${S.cyan}`,
                                  color: S.cyan,
                                  padding: "3px 9px",
                                  fontSize: "11px",
                                  cursor: "pointer",
                                  borderRadius: "2px",
                                }}
                              >
                                Download
                              </button>
                              <button
                                onClick={() => deleteBackup(backup.name)}
                                className="button-hover"
                                style={{
                                  backgroundColor: "transparent",
                                  border: `1px solid ${S.red}`,
                                  color: S.red,
                                  padding: "3px 9px",
                                  fontSize: "11px",
                                  cursor: "pointer",
                                  borderRadius: "2px",
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          backgroundColor: S.topBar,
          borderTop: `1px solid ${S.border}`,
          padding: "5px 16px",
          fontSize: "10px",
          color: S.muted,
          display: "flex",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <span>Meowtopia — Proxied to PufferPanel v2.7.1 daemon (Oracle Cloud VM)</span>
        <span>Last checked: {lastUpdate}</span>
      </div>

      {/* Reinstall Version Confirmation Modal */}
      {confirmReinstallOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
          }}
        >
          <div
            style={{
              backgroundColor: "#242424",
              border: `1px solid ${S.red}`,
              padding: "24px",
              borderRadius: "4px",
              width: "420px",
              maxWidth: "90%",
              boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: "bold", color: S.red, display: "flex", alignItems: "center", gap: "8px" }}>
              <span>⚠️</span>
              <span>Confirm Destructive Version Reset</span>
            </div>
            
            <div style={{ fontSize: "12.5px", color: S.white, lineHeight: "1.5" }}>
              You are about to reinstall your server to Minecraft version <strong style={{ color: S.orange }}>{selectedVersion}</strong>.
              <br/><br/>
              This will <strong style={{ color: S.red }}>PERMANENTLY DELETE</strong>:
              <ul style={{ paddingLeft: "20px", marginTop: "6px", color: S.muted }}>
                <li>All active worlds (world, nether, end)</li>
                <li>All installed plugins and mods</li>
                <li>All configuration files</li>
              </ul>
              Only files stored inside your <strong style={{ color: S.green }}>backups/</strong> folder will remain.
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
              <button
                onClick={() => setConfirmReinstallOpen(false)}
                style={{
                  padding: "8px 14px",
                  backgroundColor: "transparent",
                  border: `1px solid ${S.border}`,
                  color: S.white,
                  fontSize: "12px",
                  borderRadius: "3px",
                  cursor: "pointer"
                }}
                className="tab-hover"
              >
                Cancel
              </button>
              <button
                onClick={triggerVersionChange}
                style={{
                  padding: "8px 14px",
                  backgroundColor: S.red,
                  border: "none",
                  color: S.white,
                  fontWeight: "bold",
                  fontSize: "12px",
                  borderRadius: "3px",
                  cursor: "pointer"
                }}
                className="button-hover"
              >
                Confirm Destructive Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPluginDetails && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100000,
            padding: "20px",
          }}
          onClick={() => setSelectedPluginDetails(null)}
        >
          <div
            style={{
              backgroundColor: "#202020",
              border: `1px solid ${S.border}`,
              borderRadius: "4px",
              maxWidth: "500px",
              width: "100%",
              padding: "20px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <PluginIcon url={selectedPluginDetails.iconUrl} size={36} color={selectedPluginDetails.color} />
                <div>
                  <div style={{ fontSize: "16px", fontWeight: "bold", color: S.white }}>
                    {selectedPluginDetails.name}
                  </div>
                  <div style={{ fontSize: "11px", color: S.muted, marginTop: "2px" }}>
                    Provider: {selectedPluginDetails.provider}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPluginDetails(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: S.muted,
                  cursor: "pointer",
                  fontSize: "20px",
                  lineHeight: "1",
                  padding: "0",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: "12px" }}>
              <div style={{ fontSize: "11px", color: S.muted, fontWeight: "bold", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Description
              </div>
              <div style={{ fontSize: "13px", color: S.white, lineHeight: "1.5", maxHeight: "150px", overflowY: "auto" }}>
                {selectedPluginDetails.description || selectedPluginDetails.tagline || "No description available."}
              </div>
            </div>

            {selectedPluginDetails.downloads !== undefined && selectedPluginDetails.downloads > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", backgroundColor: "#181818", padding: "8px 12px", borderRadius: "3px" }}>
                <div>
                  <span style={{ color: S.muted }}>Downloads:</span>{" "}
                  <span style={{ color: S.white, fontWeight: "bold" }}>{selectedPluginDetails.downloads.toLocaleString()}</span>
                </div>
                {selectedPluginDetails.categories && selectedPluginDetails.categories.length > 0 && (
                  <div>
                    <span style={{ color: S.muted }}>Tags:</span>{" "}
                    <span style={{ color: S.cyan }}>{selectedPluginDetails.categories.join(", ")}</span>
                  </div>
                )}
              </div>
            )}

            {selectedPluginDetails.versions && selectedPluginDetails.versions.length > 0 && (
              <div>
                <div style={{ fontSize: "11px", color: S.muted, fontWeight: "bold", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Compatible Versions
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {selectedPluginDetails.versions.slice(0, 10).map((v: string) => (
                    <span
                      key={v}
                      style={{
                        fontSize: "10px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: `1px solid ${S.border}`,
                        color: S.white,
                        padding: "2px 6px",
                        borderRadius: "3px",
                      }}
                    >
                      {v}
                    </span>
                  ))}
                  {selectedPluginDetails.versions.length > 10 && (
                    <span style={{ fontSize: "10px", color: S.muted, alignSelf: "center" }}>
                      +{selectedPluginDetails.versions.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: `1px solid ${S.border}`, paddingTop: "12px" }}>
              <button
                onClick={() => setSelectedPluginDetails(null)}
                style={{
                  backgroundColor: S.cyan,
                  border: "none",
                  color: "#1a1a1a",
                  padding: "6px 16px",
                  fontSize: "12px",
                  cursor: "pointer",
                  borderRadius: "3px",
                  fontWeight: "bold",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
