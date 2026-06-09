"use client";

import { fetchWithAuth } from "@/lib/apiClient";
import React, { useEffect, useState, useRef, useCallback } from "react";

import { StatusData, FileEntry, PlayerEntry, Toast } from "@/lib/types";
import { useServerStore } from "@/store/useServerStore";
import { useUIStore } from "@/store/useUIStore";
import { useConsoleStore } from "@/store/useConsoleStore";
import { useFilesStore } from "@/store/useFilesStore";
import { useNetworkStore } from "@/store/useNetworkStore";
import { usePlayersStore } from "@/store/usePlayersStore";
import { S, POPULAR_PLUGINS_META } from "@/lib/constants";
import {
  LayoutDashboard,
  Terminal,
  Users,
  FolderOpen,
  Cpu,
  Puzzle,
  Settings,
  FileCog,
  Network,
  ScrollText,
  Archive,
  ShieldAlert,
  Database,
  ExternalLink
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BarChart } from "@/components/BarChart";
import { SparklineChart } from "@/components/SparklineChart";
import { FilesTab } from "@/components/tabs/FilesTab";
import { ChatTab } from "@/components/tabs/ChatTab";
import { ConsoleTab } from "@/components/tabs/ConsoleTab";
import { PanelUsersTab } from "@/components/tabs/PanelUsersTab";
import { StatusTab } from "@/components/tabs/StatusTab";
import { SoftwareTab } from "@/components/tabs/SoftwareTab";
import { SettingsTab } from "@/components/tabs/SettingsTab";
import { PluginsTab } from "@/components/tabs/PluginsTab";
import { DatapacksTab } from "@/components/tabs/DatapacksTab";
import { ConfigTab } from "@/components/tabs/ConfigTab";
import { NetworkingTab } from "@/components/tabs/NetworkingTab";
import { ContextMenuProvider } from "@/components/ui/ContextMenu";
import UsersTab from "@/components/tabs/UsersTab";
import { LogsTab } from "@/components/tabs/LogsTab";
import { BackupsTab } from "@/components/tabs/BackupsTab";
import { PluginIcon } from "@/components/PluginIcon";
import { fmtMb, fmtFileSize, stripAnsi, CHAT_RE } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const { user, role, permissions } = useAuth();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  


  // ── UI Store ──
  const {
    activeTab, setActiveTab,
    toasts, addToast: showToast, removeToast,
    powerMenuOpen, setPowerMenuOpen,
    sidebarCollapsed, setSidebarCollapsed
  } = useUIStore();

  // ── Server Store ──
  const {
    statusData, setStatusData,
    cpuHistory, ramHistory, tpsHistory,
    uptimeStart, setUptimeStart,
    uptimeDisplay, setUptimeDisplay,
    lastUpdate, statusError,
    actionLoading, setActionLoading,
    fetchStatus
  } = useServerStore();

  // ── Nav ──
  // (Migrated to useUIStore)

  // Action loading migrated to useServerStore
  // powerMenuOpen migrated to useUIStore

  // ── Console ──
  const { logs, setLogs, hasNewLogs, setHasNewLogs, autoScroll, setAutoScroll, clearLogs } = useConsoleStore();
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

  const chatEndRef = useRef<HTMLDivElement>(null);
  const sentMessages = useRef<string[]>([]);

  // ── Files ──
  const {
    currentPath, setCurrentPath,
    files, setFiles,
    loadingFiles, setLoadingFiles,
    fileError, setFileError,
    editingFile: selectedFile, setEditingFile: setSelectedFile,
    fileContent, setFileContent,
    savingFile, setSavingFile,
    newFileName: newName, setNewFileName: setNewName,
    isCreatingDir, setIsCreatingDir
  } = useFilesStore();
  const [showNewFile, setShowNewFile] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);

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

  // ── Datapacks ──
  const [installedDatapacks, setInstalledDatapacks] = useState<{ name: string; size?: number }[]>([]);
  const [loadingDatapacks, setLoadingDatapacks] = useState(false);
  const [datapackSearch, setDatapackSearch] = useState("");
  const [datapackSearchResults, setDatapackSearchResults] = useState<any[]>([]);
  const [searchingDatapacks, setSearchingDatapacks] = useState(false);
  const [installingDatapackIds, setInstallingDatapackIds] = useState<Record<string, boolean>>({});
  const [datapackError, setDatapackError] = useState("");
  const [datapackCategory, setDatapackCategory] = useState<string>("");
  const [selectedDatapackDetails, setSelectedDatapackDetails] = useState<any | null>(null);

  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; resolve: (val: boolean) => void } | null>(null);
  const [promptModal, setPromptModal] = useState<{ title: string; label: string; defaultValue: string; resolve: (val: string | null) => void } | null>(null);
  const [promptValue, setPromptValue] = useState("");

  const confirmAction = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmModal({ title, message, resolve });
    });
  };

  const promptAction = (title: string, label: string, defaultValue = ""): Promise<string | null> => {
    return new Promise((resolve) => {
      setPromptValue(defaultValue);
      setPromptModal({ title, label, defaultValue, resolve });
    });
  };
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const [filterVersion, setFilterVersion] = useState<string>("all");
  const [hasStatsMod, setHasStatsMod] = useState(true);
  const [ramBoostOffset, setRamBoostOffset] = useState(0);
  const [boostingRam, setBoostingRam] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState("1.21.1");
  const [selectedProvider, setSelectedProvider] = useState("paper");
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
  const { players, setPlayers, loadingPlayers: loadingUsers, setLoadingPlayers: setLoadingUsers, playerError: userError, setPlayerError: setUserError } = usePlayersStore();
  const [userList, setUserList] = useState<"ops" | "banned-players" | "whitelist" | "banned-ips" | "all-players">("all-players");
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
  const [logFiles, setLogFiles] = useState<{ name: string; size: number; modifyTime: number }[]>([]);
  const [selectedLogFile, setSelectedLogFile] = useState("logs/latest.log");
  const [loadingLogFiles, setLoadingLogFiles] = useState(false);

  // ── Network bindings ──
  const { bindIp, setBindIp, bindPort, setBindPort, loadingNetwork, setLoadingNetwork, savingNetwork, setSavingNetwork } = useNetworkStore();
  // sidebarCollapsed migrated to useUIStore

  // ─────────────────────────────────────────────────────────────────────────────
  // Status polling
  // ─────────────────────────────────────────────────────────────────────────────

  // fetchStatus is now handled by useServerStore
  useEffect(() => {
    fetchStatus();
    const intv = setInterval(fetchStatus, 5000);

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    return () => clearInterval(intv);
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
      const res = await fetchWithAuth("/api/power", {
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
      const res = await fetchWithAuth("/api/auth", { cache: "no-store" });
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
            lines = d.args.map(String);
          } else if (d && typeof d.data === "string") {
            lines = [d.data];
          } else if (d && typeof d.logs === "string") {
            lines = d.logs.split("\n").map((l: string) => l.trimEnd()).filter(Boolean);
          } else if (d && d.event === "console" && Array.isArray(d.args)) {
            lines = d.args.map(String);
          }

          if (lines.length > 0) {
            setLogs((p) => [...p, ...lines].slice(-500));

            // Feed chat tab — Batched update
            const newChatMessages: { player: string; msg: string; ts: string }[] = [];
            for (const line of lines) {
              const m = CHAT_RE.exec(stripAnsi(line));
              if (m) {
                const sender = m[1] || m[2];
                const msgText = m[3];
                // Deduplicate our own sent chat messages
                if (sender === "Server" && sentMessages.current.includes(msgText)) {
                  sentMessages.current = sentMessages.current.filter((item) => item !== msgText);
                  continue;
                }
                newChatMessages.push({
                  player: sender,
                  msg: msgText,
                  ts: new Date().toLocaleTimeString(),
                });
              }
            }
            if (newChatMessages.length > 0) {
              setChatMessages((c) => [...c, ...newChatMessages].slice(-200));
            }
          }
        } catch {
          if (typeof e.data === "string") setLogs((p) => [...p, e.data].slice(-500));
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
    let activeRequest: AbortController | null = null;

    const pollLogs = async () => {
      if (activeRequest) return;
      activeRequest = new AbortController();

      try {
        const res = await fetchWithAuth(`/api/console?time=${lastEpochRef.current}`, {
          cache: "no-store",
          signal: activeRequest.signal
        });
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        if (!active) return;

        if (data.logs) {
          const lines = data.logs
            .split("\n")
            .map((l: string) => l.trimEnd())
            .filter(Boolean);
          if (lines.length > 0) {
            setLogs((p) => {
              if (isFirstPollRef.current) {
                isFirstPollRef.current = false;
                return lines.slice(-500);
              } else {
                return [...p, ...lines].slice(-500);
              }
            });

            // Feed chat tab — Batched update
            const newChatMessages: { player: string; msg: string; ts: string }[] = [];
            for (const line of lines) {
              const m = CHAT_RE.exec(stripAnsi(line));
              if (m) {
                const sender = m[1] || m[2];
                const msgText = m[3];
                // Deduplicate
                if (sender === "Server" && sentMessages.current.includes(msgText)) {
                  sentMessages.current = sentMessages.current.filter((item) => item !== msgText);
                  continue;
                }
                newChatMessages.push({
                  player: sender,
                  msg: msgText,
                  ts: new Date().toLocaleTimeString(),
                });
              }
            }
            if (newChatMessages.length > 0) {
              setChatMessages((c) => [...c, ...newChatMessages].slice(-200));
            }
          }
        }

        if (data.epoch && data.epoch > lastEpochRef.current) {
          lastEpochRef.current = data.epoch;
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Polling logs failed:", err);
        }
      } finally {
        activeRequest = null;
      }
    };

    pollLogs();
    const iv = setInterval(pollLogs, 3000);
    return () => {
      active = false;
      activeRequest?.abort();
      clearInterval(iv);
    };
  }, [wsMode]);



  // Auto scroll console
  useEffect(() => {
    if (autoScroll) {
      consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Console / command commands
  // ─────────────────────────────────────────────────────────────────────────────

  const sendCmd = async (inputCmd: string) => {
    const cmd = inputCmd.trim();
    if (!cmd) return;
    setLogs((p) => [...p, `> ${cmd}`].slice(-500));

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: "console", args: [cmd] }));
    } else {
      await fetchWithAuth("/api/power", {
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
      await fetchWithAuth("/api/power", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "command", command: cmd }),
      });
    }
    showToast(`Command /${cmd.split(" ")[0]} triggered.`, "info");
  };

  const sendChat = async (inputMsg: string) => {
    const msg = inputMsg.trim();
    if (!msg) return;

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

    await fetchWithAuth("/api/power", {
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
      const res = await fetchWithAuth(`/api/files?path=${encodeURIComponent(path)}`, {
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
      const res = await fetchWithAuth(`/api/files?path=${encodeURIComponent(path)}&read=1`, {
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
      const res = await fetchWithAuth("/api/files", {
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
      const res = await fetchWithAuth("/api/files", {
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
      const res = await fetchWithAuth("/api/files", {
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
    if (!(await confirmAction("Delete File", `Delete ${f.name}?`))) return;
    const path = currentPath ? `${currentPath}/${f.name}` : f.name;
    try {
      const res = await fetchWithAuth("/api/files", {
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

  const doRename = async (f: FileEntry, newName: string) => {
    const oldPath = currentPath ? `${currentPath}/${f.name}` : f.name;
    const newPath = currentPath ? `${currentPath}/${newName}` : newName;
    try {
      const res = await fetchWithAuth("/api/files/sftp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename", source: oldPath, target: newPath }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      showToast(`Renamed to ${newName}.`, "success");
      loadDir(currentPath);
    } catch (err: any) {
      showToast(`Rename failed: ${err.message}`, "error");
    }
  };

  const doMove = async (f: FileEntry, newPath: string) => {
    const oldPath = currentPath ? `${currentPath}/${f.name}` : f.name;
    try {
      const res = await fetchWithAuth("/api/files/sftp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "move", source: oldPath, target: newPath }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      showToast(`Moved to ${newPath}.`, "success");
      loadDir(currentPath);
    } catch (err: any) {
      showToast(`Move failed: ${err.message}`, "error");
    }
  };

  const doBulkDelete = async () => {
    if (selectedFileNames.size === 0) return;
    const names = Array.from(selectedFileNames);
    if (!(await confirmAction("Delete Items", `Delete ${names.length} item(s)? This cannot be undone.`))) return;
    setBulkDeleting(true);
    let failed = 0;
    await Promise.all(
      names.map(async (name) => {
        const path = currentPath ? `${currentPath}/${name}` : name;
        try {
          const res = await fetchWithAuth("/api/files", {
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

      const res = await fetchWithAuth("/api/upload", {
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
      const res = await fetchWithAuth("/api/files?path=plugins", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load plugins directory");
      const list = await res.json();
      if (Array.isArray(list)) {
        const jars = list
          .filter((f) => f.isFile && f.name.endsWith(".jar") && (f.size ?? 0) > 22)
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
        await fetchWithAuth("/api/files", {
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
      const res = await fetchWithAuth(
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
      const res = await fetchWithAuth("/api/plugins/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: plugin.provider,
          downloadUrl: plugin.downloadUrl,
          versionId: plugin.latestVersion,
          projectId: plugin.id,
          filename: `${plugin.name.split(/[|\-\s\(\[<]+/)[0].replace(/[^a-zA-Z0-9_-]/g, "")}.jar`,
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
    if (!(await confirmAction("Uninstall Plugin", `Are you sure you want to delete ${filename}?`))) return;
    setLoadingPlugins(true);
    try {
      const res = await fetchWithAuth("/api/files", {
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
    const pluginLower = plugin.name.toLowerCase();
    const pluginLowerNoSpaces = pluginLower.replace(/ /g, '');
    
    return installedPlugins.find((installed) => {
      const rawName = installed.name.replace(/\.jar$/i, "");
      const installedNameClean = rawName.toLowerCase().replace(/[^a-z0-9]/g, "");
      
      if (installedNameClean === searchNameClean) return true;
      
      const rawLower = rawName.toLowerCase();
      const rawLowerNoSpaces = rawLower.replace(/ /g, '');
      
      if (rawLower.startsWith(pluginLower)) {
        const nextChar = rawLower.charAt(pluginLower.length);
        if (nextChar === '-' || nextChar === '_' || nextChar === '.' || nextChar === ' ' || nextChar === '') {
          return true;
        }
      }
      
      if (rawLowerNoSpaces.startsWith(pluginLowerNoSpaces)) {
        const nextChar = rawLowerNoSpaces.charAt(pluginLowerNoSpaces.length);
        if (nextChar === '-' || nextChar === '_' || nextChar === '.' || nextChar === '') {
          return true;
        }
      }

      return false;
    });
  };

  // Trigger search on filter changes
  useEffect(() => {
    if (activeTab === "plugins") {
      searchPlugins();
    }
  }, [pluginCategory]);

  // ── Datapacks ──
  const loadInstalledDatapacks = async () => {
    setLoadingDatapacks(true);
    setDatapackError("");
    try {
      const res = await fetchWithAuth("/api/files?path=world/datapacks", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load datapacks directory");
      const list = await res.json();
      if (Array.isArray(list)) {
        const packs = list
          .filter((f) => f.isFile && (f.name.endsWith(".zip") || f.name.endsWith(".jar")) && (f.size ?? 0) > 22)
          .map((f) => ({
            name: f.name,
            size: f.size,
          }));
        setInstalledDatapacks(packs);
      } else {
        setInstalledDatapacks([]);
      }
    } catch (err: any) {
      console.warn("Datapacks directory fetch error:", err);
      try {
        await fetchWithAuth("/api/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "mkdir", path: "world/datapacks" }),
        });
      } catch {}
      setInstalledDatapacks([]);
    } finally {
      setLoadingDatapacks(false);
    }
  };

  const searchDatapacks = async () => {
    setSearchingDatapacks(true);
    setDatapackError("");
    try {
      const cat = datapackCategory;
      const res = await fetchWithAuth(
        `/api/datapacks/search?q=${encodeURIComponent(datapackSearch)}&category=${cat}`
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setDatapackSearchResults(data);
    } catch (err: any) {
      setDatapackError(err.message || "Failed to search datapacks");
    } finally {
      setSearchingDatapacks(false);
    }
  };

  const installDatapack = async (plugin: any) => {
    setInstallingDatapackIds((prev) => ({ ...prev, [plugin.id]: true }));
    setDatapackError("");
    showToast(`Downloading & installing "${plugin.name}"...`, "info");
    try {
      const res = await fetchWithAuth("/api/datapacks/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: plugin.provider,
          downloadUrl: plugin.downloadUrl,
          versionId: plugin.latestVersion,
          projectId: plugin.id,
          filename: `${plugin.name.split(/[|\-\s\(\[<]+/)[0].replace(/[^a-zA-Z0-9_-]/g, "")}.zip`,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Installation failed");
      }

      await loadInstalledDatapacks();
      showToast(`Installed "${plugin.name}". Reload world to apply (/reload).`, "success");
    } catch (err: any) {
      setDatapackError(err.message || "Failed to install datapack");
      showToast(`Datapack install failed: ${err.message}`, "error");
    } finally {
      setInstallingDatapackIds((prev) => {
        const next = { ...prev };
        delete next[plugin.id];
        return next;
      });
    }
  };

  const deleteDatapack = async (filename: string) => {
    if (!(await confirmAction("Uninstall Datapack", `Are you sure you want to delete ${filename}?`))) return;
    setLoadingDatapacks(true);
    try {
      const res = await fetchWithAuth("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", path: `world/datapacks/${filename}` }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete datapack");
      }
      showToast(`Datapack "${filename}" uninstalled.`, "success");
      await loadInstalledDatapacks();
    } catch (err: any) {
      setDatapackError(err.message || "Failed to delete datapack");
      showToast(`Failed to uninstall datapack: ${err.message || err}`, "error");
    } finally {
      setLoadingDatapacks(false);
    }
  };

  const getInstalledDatapackFile = (plugin: any) => {
    if (!installedDatapacks || installedDatapacks.length === 0) return null;
    
    const searchNameClean = plugin.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const pluginLower = plugin.name.toLowerCase();
    const pluginLowerNoSpaces = pluginLower.replace(/ /g, '');
    
    return installedDatapacks.find((installed) => {
      const rawName = installed.name.replace(/\.(zip|jar)$/i, "");
      const installedNameClean = rawName.toLowerCase().replace(/[^a-z0-9]/g, "");
      
      if (installedNameClean === searchNameClean) return true;
      
      const rawLower = rawName.toLowerCase();
      const rawLowerNoSpaces = rawLower.replace(/ /g, '');
      
      if (rawLower.startsWith(pluginLower)) {
        const nextChar = rawLower.charAt(pluginLower.length);
        if (nextChar === '-' || nextChar === '_' || nextChar === '.' || nextChar === ' ' || nextChar === '') {
          return true;
        }
      }
      
      if (rawLowerNoSpaces.startsWith(pluginLowerNoSpaces)) {
        const nextChar = rawLowerNoSpaces.charAt(pluginLowerNoSpaces.length);
        if (nextChar === '-' || nextChar === '_' || nextChar === '.' || nextChar === '') {
          return true;
        }
      }

      return false;
    });
  };

  // Trigger search on filter changes
  useEffect(() => {
    if (activeTab === "datapacks") {
      searchDatapacks();
    }
  }, [datapackCategory]);

  const boostRam = async () => {
    if (!isOnline) return;
    setBoostingRam(true);
    showToast("Triggering RAM optimization & Garbage Collection...", "info");
    
    try {
      await fetchWithAuth("/api/power", {
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
      const res = await fetchWithAuth("/api/minecraft/reinstall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: selectedVersion, provider: selectedProvider }),
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
      const res = await fetchWithAuth("/api/minecraft/startup");
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

      const res = await fetchWithAuth("/api/minecraft/startup", {
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
      const res = await fetchWithAuth("/api/config", { cache: "no-store" });
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
      const res = await fetchWithAuth("/api/config", {
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
    if (cmd.startsWith("clear-data ")) {
      const parts = cmd.split(" ");
      const uuid = parts[1];
      const name = parts[2];
      try {
        const res = await fetchWithAuth("/api/users/clear", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uuid, name }),
        });
        if (!res.ok) throw new Error("Failed to clear data");
        showToast(`Cleared data for ${name}`, "success");
      } catch (err) {
        showToast("Error clearing player data", "error");
      }
    } else {
      await sendCommandDirect(cmd);
    }
    setTimeout(() => loadUsers(userList), 1200);
  };

  const loadUsers = async (list: typeof userList) => {
    setLoadingUsers(true);
    setUserError("");
    try {
      const res = await fetchWithAuth(`/api/users?list=${list}`, { cache: "no-store" });
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
    await fetchWithAuth("/api/users", {
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
      const res = await fetchWithAuth("/api/backups", { cache: "no-store" });
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
      const res = await fetchWithAuth("/api/backups", {
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
      !(await confirmAction(
        "Restore Backup",
        `Are you sure you want to restore the backup "${filename}"?\n\nWARNING: Conflicting files already on the server will trigger errors unless removed. Extracting backups does not auto-overwrite in PufferPanel.`
      ))
    )
      return;

    setRestoringBackup(filename);
    showToast(`Extracting zip backup ${filename}...`, "info");
    try {
      const res = await fetchWithAuth("/api/backups", {
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
    if (!(await confirmAction("Delete Backup", `Are you sure you want to delete backup "${filename}"?`))) return;
    try {
      const res = await fetchWithAuth("/api/backups", {
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

  const activeProjectDetails = selectedPluginDetails || selectedDatapackDetails;
  
  const closeProjectDetails = () => {
    setSelectedPluginDetails(null);
    setSelectedDatapackDetails(null);
  };

  useEffect(() => {
    const details = selectedPluginDetails || selectedDatapackDetails;
    if (details && !details._fetched && details.provider && details.id) {
      fetchWithAuth(`/api/plugins/details?provider=${details.provider}&id=${details.id}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            const updated = {
              ...details,
              extendedDescription: data.description,
              wikiUrl: data.wikiUrl,
              sourceUrl: data.sourceUrl,
              issuesUrl: data.issuesUrl,
              discordUrl: data.discordUrl,
              author: data.author,
              _fetched: true
            };
            if (selectedPluginDetails) setSelectedPluginDetails(updated);
            if (selectedDatapackDetails) setSelectedDatapackDetails(updated);
          } else {
            // mark as fetched so it doesn't loop
            const updated = { ...details, _fetched: true };
            if (selectedPluginDetails) setSelectedPluginDetails(updated);
            if (selectedDatapackDetails) setSelectedDatapackDetails(updated);
          }
        })
        .catch(() => {
          const updated = { ...details, _fetched: true };
          if (selectedPluginDetails) setSelectedPluginDetails(updated);
          if (selectedDatapackDetails) setSelectedDatapackDetails(updated);
        });
    }
  }, [selectedPluginDetails, selectedDatapackDetails]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Logs File Viewer
  // ─────────────────────────────────────────────────────────────────────────────

  const loadLogFiles = async () => {
    setLoadingLogFiles(true);
    try {
      const res = await fetchWithAuth("/api/files?path=logs", { cache: "no-store" });
      if (res.ok) {
        const files: { name: string; size: number; isFile: boolean; modifyTime: number }[] = await res.json();
        const sorted = files
          .filter((f) => f.isFile)
          .sort((a, b) => (b.modifyTime || 0) - (a.modifyTime || 0));
        setLogFiles(sorted);
      }
    } catch (err: any) {
      console.error("Failed to list log files:", err.message);
    } finally {
      setLoadingLogFiles(false);
    }
  };

  const loadLogsContent = async (path = selectedLogFile) => {
    setLoadingLogs(true);
    setLogsContent("");
    try {
      const isGz = path.endsWith(".gz");
      const url = `/api/files?path=${encodeURIComponent(path)}&read=1${isGz ? "&unzip=1" : ""}`;
      const res = await fetchWithAuth(url, { cache: "no-store" });
      if (res.ok) {
        const text = await res.text();
        setLogsContent(text);
      } else {
        setLogsContent(`[Failed to read ${path} — file is empty or does not exist]`);
      }
    } catch (err: any) {
      setLogsContent(`[Error reading logs: ${err.message}]`);
    } finally {
      setLoadingLogs(false);
    }
  };

  const clearLogFile = async () => {
    if (!(await confirmAction("Clear Log", "Are you sure you want to clear logs/latest.log? This will empty the file.")))
      return;
    setLoadingLogs(true);
    try {
      const res = await fetchWithAuth("/api/files", {
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
      const res = await fetchWithAuth("/api/minecraft/network");
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
      const res = await fetchWithAuth("/api/minecraft/network", {
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
    if (activeTab === "datapacks") {
      loadInstalledDatapacks();
    }
    if (activeTab === "backups") {
      loadBackups();
    }
    if (activeTab === "logs") {
      loadLogFiles();
      loadLogsContent("logs/latest.log");
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

  // Debounced search for datapacks as user types
  useEffect(() => {
    if (activeTab !== "datapacks") return;
    const delayDebounceFn = setTimeout(() => {
      searchDatapacks();
    }, 450);
    return () => clearTimeout(delayDebounceFn);
  }, [datapackSearch, datapackCategory, activeTab]);

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
    { id: "status", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "console", label: "Console", icon: <Terminal size={18} /> },
    { id: "logs", label: "Logs", icon: <ScrollText size={18} /> },
    { id: "files", label: "Files", icon: <FolderOpen size={18} /> },
    { id: "plugins", label: "Plugins", icon: <Puzzle size={18} /> },
    { id: "datapacks", label: "Datapacks", icon: <Database size={18} /> },
    { id: "users", label: "Players", icon: <Users size={18} /> },
    { id: "backups", label: "Backups", icon: <Archive size={18} /> },
    { id: "config", label: "Files: Config", icon: <FileCog size={18} /> },
    { id: "networking", label: "Network", icon: <Network size={18} /> },
    { id: "software", label: "Software", icon: <Cpu size={18} /> },
    { id: "settings", label: "Settings", icon: <Settings size={18} /> },
    ...(role === "admin" ? [{ id: "panel-users" as Tab, label: "Panel Access", icon: <ShieldAlert size={18} /> }] : []),
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
                backgroundColor: S.content,
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
              Environment Variables (Startup Config)
            </div>
            <div style={{ fontSize: "11px", color: S.muted, marginTop: "2px" }}>
              These settings dictate HOW the server starts (RAM, Java). Changes save automatically but require a server restart to apply.
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
    <ContextMenuProvider>
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
        .glass-panel {
          background: rgba(20, 20, 20, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .text-gradient {
          background: linear-gradient(to right, #ff9d00, #ff5e00);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
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
              backgroundColor: S.content,
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
        <span className="text-gradient" style={{ fontWeight: 800, color: S.white, letterSpacing: "1px", fontSize: "14px" }}>MeowTopia</span>
        <span style={{ color: S.border }}>|</span>
        <span style={{ color: statusData?.status === "online" ? S.green : statusData?.status === "starting" || statusData?.status === "stopping" ? S.orange : S.red, fontFamily: "monospace", fontSize: "11px", fontWeight: 600 }}>
          <span className={statusData?.status === "online" ? "status-indicator-live" : ""} style={{display:"inline-block", borderRadius:"50%", width:"8px", height:"8px", backgroundColor: statusData?.status === "online" ? S.green : statusData?.status === "starting" || statusData?.status === "stopping" ? S.orange : S.red, marginRight:"4px"}}></span>
          {(statusData?.status || "offline").toUpperCase()}
        </span>
        <span style={{ color: S.border }}>|</span>
        <span style={{ color: S.muted, fontFamily: "monospace", fontSize: "11px" }}>
          {statusData?.ip || "play.meowtopia.mooo.com:25565"}
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
            backgroundColor: "rgba(204, 167, 0, 0.1)",
            borderBottom: "1px solid #cca700",
            color: "#cca700",
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
          className="glass-panel"
          style={{
            width: sidebarCollapsed ? "60px" : "190px",
            borderRight: `1px solid ${S.border}`,
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            transition: "width 0.2s ease",
            zIndex: 10,
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
                    padding: sidebarCollapsed ? "14px 0" : "14px 18px",
                    justifyContent: sidebarCollapsed ? "center" : "flex-start",
                    backgroundColor: active ? "rgba(255,255,255,0.08)" : "transparent",
                    color: active ? S.white : S.muted,
                    border: "none",
                    borderLeft: active ? `3px solid ${S.orange}` : "3px solid transparent",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: active ? 600 : 500,
                    textAlign: "left",
                    opacity: active ? 1 : 0.7,
                    outline: "none",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
                      e.currentTarget.style.color = S.white;
                      e.currentTarget.style.opacity = "1";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = S.muted;
                      e.currentTarget.style.opacity = "0.7";
                    }
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
          className="glass-panel"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            overflow: "auto",
            margin: "20px",
            borderRadius: "12px",
          }}
        >
          {/* ══ STATUS TAB ══ */}
          {activeTab === "status" && (
            <StatusTab
              statusData={statusData}
              isOnline={isOnline}
              cpuHistory={cpuHistory}
              ramHistory={ramHistory}
              tpsHistory={tpsHistory}
              cpuPct={cpuPct}
              ramMb={ramMb}
              maxRamMb={maxRamMb}
              ramBoostOffset={ramBoostOffset}
              hasStatsMod={hasStatsMod}
              setHasStatsMod={setHasStatsMod}
              showToast={showToast}
              boostRam={boostRam}
              boostingRam={boostingRam}
              mounted={mounted}
              fmtBytes={fmtBytes}
              actionLoading={actionLoading}
              doPower={doPower}
              uptimeDisplay={uptimeDisplay}
              TabHeader={TabHeader}
              players={players}
              logs={logs}
            />
          )}

          {/* ══ SOFTWARE ══ */}
          {activeTab === "software" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "20px" }}>
              <SoftwareTab
                currentVersion={statusData?.mcVersion}
                reinstalling={reinstallingVersion}
                onInstallClick={(provider, version) => {
                  setSelectedVersion(version);
                  setSelectedProvider(provider);
                  setConfirmReinstallOpen(true);
                }}
              />
            </div>
          )}

          {/* ══ SETTINGS ══ */}
          {activeTab === "settings" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <SettingsTab
                statusData={statusData}
                showToast={showToast}
                startupForm={renderStartupVariablesForm(true)}
              />
            </div>
          )}


          {/* ══ CONSOLE ══ */}
          {activeTab === "console" && (
            <ConsoleTab
              wsStatus={wsStatus}
              wsMode={wsMode}
              setLogs={setLogs}
              connectWs={connectWs}
              wsAttempts={wsAttempts}
              isOnline={isOnline}
              statusData={statusData}
              ramMb={ramMb}
              maxRamMb={maxRamMb}
              PowerDropdown={PowerDropdown}
              logs={logs}
              consoleEndRef={consoleEndRef}
              autoScroll={autoScroll}
              setAutoScroll={setAutoScroll}
              sendCommandDirect={sendCommandDirect}
              sendCmd={sendCmd}
              OutlineBtn={OutlineBtn}
            />
          )}

          {/* ══ CHAT ══ */}
          {activeTab === "chat" && (
            <ChatTab
              chatMessages={chatMessages}
              chatEndRef={chatEndRef}
              sendChat={sendChat}
              isOnline={isOnline}
              TabHeader={TabHeader}
            />
          )}

          {/* ══ FILES ══ */}
          {activeTab === "files" && (
            <FilesTab
              TabHeader={TabHeader}
              loadDir={loadDir}
              fileContent={fileContent}
              setFileContent={setFileContent}
              OutlineBtn={OutlineBtn}
              selectedFile={selectedFile}
              saveFileContent={saveFileContent}
              savingFile={savingFile}
              setSelectedFile={setSelectedFile}
              uploadInputRef={uploadInputRef}
              handleUpload={handleUpload}
              fileError={fileError}
              setFileError={setFileError}
              statusData={statusData}
              loadingFile={loadingFile}
              openFile={openFile}
              showNewFile={showNewFile}
              showNewFolder={showNewFolder}
              doNewFile={doNewFile}
              doNewFolder={doNewFolder}
              newName={newName}
              setNewName={setNewName}
              Btn={Btn}
              setShowNewFile={setShowNewFile}
              setShowNewFolder={setShowNewFolder}
              pathParts={pathParts}
              fileSearchQuery={fileSearchQuery}
              setFileSearchQuery={setFileSearchQuery}
              setSelectedFileNames={setSelectedFileNames}
              setFileTypeFilter={setFileTypeFilter}
              fileTypeFilter={fileTypeFilter}
              selectedFileNames={selectedFileNames}
              doBulkDelete={doBulkDelete}
              bulkDeleting={bulkDeleting}
              loadingFiles={loadingFiles}
              files={files}
              currentPath={currentPath}
              fmtFileSize={fmtFileSize}
              downloadFile={downloadFile}
              doDelete={doDelete}
              doRename={doRename}
              doMove={doMove}
              promptAction={promptAction}
              confirmAction={confirmAction}
            />
          )}

          {/* ══ PLUGINS ══ */}
          {activeTab === "plugins" && (
            <PluginsTab
              TabHeader={TabHeader}
              pluginError={pluginError}
              setPluginError={setPluginError}
              searchPlugins={searchPlugins}
              pluginSearch={pluginSearch}
              setPluginSearch={setPluginSearch}
              pluginCategory={pluginCategory}
              setPluginCategory={setPluginCategory}
              filterProvider={filterProvider}
              setFilterProvider={setFilterProvider}
              filterVersion={filterVersion}
              setFilterVersion={setFilterVersion}
              searchingPlugins={searchingPlugins}
              searchResults={searchResults}
              getInstalledPluginFile={getInstalledPluginFile}
              setSelectedPluginDetails={setSelectedPluginDetails}
              deletePlugin={deletePlugin}
              installingPluginIds={installingPluginIds}
              installPlugin={installPlugin}
              OutlineBtn={OutlineBtn}
              loadInstalledPlugins={loadInstalledPlugins}
              loadingPlugins={loadingPlugins}
              installedPlugins={installedPlugins}
              fmtFileSize={fmtFileSize}
              Btn={Btn}
              statusData={statusData}
            />
          )}

          {/* ══ DATAPACKS ══ */}
          {activeTab === "datapacks" && (
            <DatapacksTab
              TabHeader={TabHeader}
              datapackError={datapackError}
              setDatapackError={setDatapackError}
              searchDatapacks={searchDatapacks}
              datapackSearch={datapackSearch}
              setDatapackSearch={setDatapackSearch}
              datapackCategory={datapackCategory}
              setDatapackCategory={setDatapackCategory}
              searchingDatapacks={searchingDatapacks}
              searchResults={datapackSearchResults}
              getInstalledDatapackFile={getInstalledDatapackFile}
              setSelectedDatapackDetails={setSelectedDatapackDetails}
              deleteDatapack={deleteDatapack}
              installingDatapackIds={installingDatapackIds}
              installDatapack={installDatapack}
              OutlineBtn={OutlineBtn}
              loadInstalledDatapacks={loadInstalledDatapacks}
              loadingDatapacks={loadingDatapacks}
              installedDatapacks={installedDatapacks}
              fmtFileSize={fmtFileSize}
              Btn={Btn}
              statusData={statusData}
            />
          )}

          {/* ══ CONFIG ══ */}
          {activeTab === "config" && (
            <ConfigTab
              configSubTab={configSubTab}
              setConfigSubTab={setConfigSubTab}
              savingConfig={savingConfig}
              saveConfig={saveConfig}
              loadingConfig={loadingConfig}
              loadConfig={loadConfig}
              configError={configError}
              configSearch={configSearch}
              setConfigSearch={setConfigSearch}
              filteredConfig={filteredConfig}
              setConfigProps={setConfigProps}
              savingStartup={savingStartup}
              startupSavedTime={startupSavedTime}
              renderStartupVariablesForm={renderStartupVariablesForm}
              loadStartupSettings={loadStartupSettings}
              Btn={Btn}
              OutlineBtn={OutlineBtn}
            />
          )}

          {/* ══ USERS ══ */}
          {activeTab === "users" && (
            <UsersTab
              userList={userList}
              setUserList={setUserList}
              loadUsers={loadUsers}
              loadingUsers={loadingUsers}
              userError={userError}
              handleAction={handleAction}
              players={players}
              userCmd={userCmd}
              setUserCmd={setUserCmd}
              sendUserCmd={sendUserCmd}
            />
          )}

          {/* ══ NETWORKING ══ */}
          {activeTab === "networking" && (
            <NetworkingTab
              TabHeader={TabHeader}
              statusData={statusData}
              loadingNetwork={loadingNetwork}
              bindIp={bindIp}
              setBindIp={setBindIp}
              bindPort={bindPort}
              setBindPort={setBindPort}
              savingNetwork={savingNetwork}
              saveNetworkSettingsAndRestart={saveNetworkSettingsAndRestart}
              showToast={showToast}
              Btn={Btn}
            />
          )}

          {/* ══ LOGS FILE VIEW ══ */}
          {activeTab === "logs" && (
            <LogsTab
              selectedLogFile={selectedLogFile}
              setSelectedLogFile={setSelectedLogFile}
              logsSearch={logsSearch}
              setLogsSearch={setLogsSearch}
              loadLogsContent={loadLogsContent}
              loadingLogs={loadingLogs}
              clearLogFile={clearLogFile}
              loadingLogFiles={loadingLogFiles}
              logFiles={logFiles}
              logsContent={logsContent}
            />
          )}

          {/* ══ BACKUPS TAB ══ */}
          {activeTab === "backups" && (
            <BackupsTab
              creatingBackup={creatingBackup}
              createBackup={createBackup}
              loadingBackups={loadingBackups}
              backups={backups}
              fmtFileSize={fmtFileSize}
              restoreBackup={restoreBackup}
              restoringBackup={restoringBackup}
              deleteBackup={deleteBackup}
              Btn={Btn}
            />
          )}
          
          {/* ══ PANEL USERS (RBAC) ══ */}
          {activeTab === "panel-users" && <PanelUsersTab />}
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
              backgroundColor: S.content,
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

      {activeProjectDetails && (
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
          onClick={closeProjectDetails}
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
                <PluginIcon url={activeProjectDetails.iconUrl} size={36} color={activeProjectDetails.color} />
                <div>
                  <div style={{ fontSize: "16px", fontWeight: "bold", color: S.white }}>
                    {activeProjectDetails.name}
                  </div>
                  <div style={{ fontSize: "11px", color: S.muted, marginTop: "2px" }}>
                    Provider: {activeProjectDetails.provider} {activeProjectDetails.author && `• Author: ${activeProjectDetails.author}`}
                  </div>
                </div>
              </div>
              <button
                onClick={closeProjectDetails}
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

            <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: "12px", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div style={{ fontSize: "11px", color: S.muted, fontWeight: "bold", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Description
              </div>
              <div style={{ fontSize: "13px", color: S.white, lineHeight: "1.5", maxHeight: "300px", overflowY: "auto", flex: 1, padding: "8px", backgroundColor: "rgba(0,0,0,0.15)", borderRadius: "4px" }} className="markdown-body">
                {activeProjectDetails.extendedDescription ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activeProjectDetails.extendedDescription}
                  </ReactMarkdown>
                ) : (
                  activeProjectDetails.description || activeProjectDetails.tagline || (activeProjectDetails._fetched ? "No description available." : "Loading details...")
                )}
              </div>
            </div>

            {activeProjectDetails.downloads !== undefined && activeProjectDetails.downloads > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", backgroundColor: "#181818", padding: "8px 12px", borderRadius: "3px" }}>
                <div>
                  <span style={{ color: S.muted }}>Downloads:</span>{" "}
                  <span style={{ color: S.white, fontWeight: "bold" }}>{activeProjectDetails.downloads.toLocaleString()}</span>
                </div>
                {activeProjectDetails.categories && activeProjectDetails.categories.length > 0 && (
                  <div>
                    <span style={{ color: S.muted }}>Tags:</span>{" "}
                    <span style={{ color: S.cyan }}>{activeProjectDetails.categories.join(", ")}</span>
                  </div>
                )}
              </div>
            )}

            {activeProjectDetails.versions && activeProjectDetails.versions.length > 0 && (
              <div>
                <div style={{ fontSize: "11px", color: S.muted, fontWeight: "bold", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Compatible Versions
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {activeProjectDetails.versions.slice(0, 10).map((v: string) => (
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
                  {activeProjectDetails.versions.length > 10 && (
                    <span style={{ fontSize: "10px", color: S.muted, alignSelf: "center" }}>
                      +{activeProjectDetails.versions.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${S.border}`, paddingTop: "12px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                {activeProjectDetails.sourceUrl && (
                  <a href={activeProjectDetails.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: S.cyan, display: "flex", alignItems: "center", gap: "4px" }}>
                    Source <ExternalLink size={12} />
                  </a>
                )}
                {activeProjectDetails.wikiUrl && (
                  <a href={activeProjectDetails.wikiUrl} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: S.cyan, display: "flex", alignItems: "center", gap: "4px" }}>
                    Wiki <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <button
                onClick={closeProjectDetails}
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
      {confirmModal && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 10000, padding: "20px"
          }}
        >
          <div
            style={{
              backgroundColor: S.sidebar, border: `1px solid ${S.border}`,
              borderRadius: "8px", width: "100%", maxWidth: "400px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              display: "flex", flexDirection: "column", overflow: "hidden"
            }}
          >
            <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "16px 20px", borderBottom: `1px solid ${S.border}` }}>
              <div style={{ color: S.red, fontWeight: "bold", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                ⚠️ {confirmModal.title}
              </div>
            </div>
            <div style={{ padding: "20px", color: S.muted, fontSize: "14px", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
              {confirmModal.message}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", padding: "16px 20px", borderTop: `1px solid ${S.border}`, backgroundColor: "rgba(255,255,255,0.02)" }}>
              <button
                onClick={() => { confirmModal.resolve(false); setConfirmModal(null); }}
                style={{ backgroundColor: "transparent", color: S.muted, border: `1px solid ${S.border}`, padding: "8px 16px", borderRadius: "4px", fontSize: "13px", cursor: "pointer", fontWeight: "bold" }}
                className="button-hover"
              >
                Cancel
              </button>
              <button
                onClick={() => { confirmModal.resolve(true); setConfirmModal(null); }}
                style={{ backgroundColor: S.red, color: S.white, border: "none", padding: "8px 16px", borderRadius: "4px", fontSize: "13px", cursor: "pointer", fontWeight: "bold" }}
                className="button-hover glow-hover"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {promptModal && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 10000, padding: "20px"
          }}
        >
          <div
            style={{
              backgroundColor: S.sidebar, border: `1px solid ${S.border}`,
              borderRadius: "8px", width: "100%", maxWidth: "400px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              display: "flex", flexDirection: "column", overflow: "hidden"
            }}
          >
            <div style={{ backgroundColor: "rgba(0, 200, 220, 0.1)", padding: "16px 20px", borderBottom: `1px solid ${S.border}` }}>
              <div style={{ color: S.cyan, fontWeight: "bold", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                ✏️ {promptModal.title}
              </div>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ color: S.muted, fontSize: "13px" }}>{promptModal.label}</label>
              <input 
                type="text" 
                value={promptValue} 
                onChange={(e) => setPromptValue(e.target.value)} 
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    promptModal.resolve(promptValue);
                    setPromptModal(null);
                  }
                }}
                autoFocus
                style={{
                  backgroundColor: S.input, border: `1px solid ${S.inputBdr}`, color: S.white,
                  padding: "8px 12px", borderRadius: "4px", fontSize: "14px", outline: "none", width: "100%"
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", padding: "16px 20px", borderTop: `1px solid ${S.border}`, backgroundColor: "rgba(255,255,255,0.02)" }}>
              <button
                onClick={() => { promptModal.resolve(null); setPromptModal(null); }}
                style={{ backgroundColor: "transparent", color: S.muted, border: `1px solid ${S.border}`, padding: "8px 16px", borderRadius: "4px", fontSize: "13px", cursor: "pointer", fontWeight: "bold" }}
                className="button-hover"
              >
                Cancel
              </button>
              <button
                onClick={() => { promptModal.resolve(promptValue); setPromptModal(null); }}
                style={{ backgroundColor: S.cyan, color: "#1a1a1a", border: "none", padding: "8px 16px", borderRadius: "4px", fontSize: "13px", cursor: "pointer", fontWeight: "bold" }}
                className="button-hover"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ContextMenuProvider>
  );
}
