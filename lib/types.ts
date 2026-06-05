export interface StatusData {
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

export interface FileEntry {
  name: string;
  size?: number;
  isFile: boolean;
  modifyTime?: number;
  extension?: string;
}

export interface PlayerEntry {
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

export type Tab =
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

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  msg: string;
}
