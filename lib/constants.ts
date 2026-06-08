export const S = {
  bg: "var(--bg-base)",
  sidebar: "var(--bg-sidebar)",
  content: "var(--bg-panel)",
  topBar: "var(--bg-header)",
  border: "var(--border-subtle)",
  rowHover: "var(--bg-panel-hover)",
  cyan: "var(--color-cyan)",
  white: "var(--text-primary)",
  muted: "var(--text-muted)",
  red: "var(--color-danger)",
  green: "var(--color-success)",
  orange: "var(--color-warning)",
  purple: "var(--color-purple)",
  chartGreen: "var(--color-success)",
  chartOrange: "var(--color-warning)",
  chartBlue: "var(--brand-accent)",
  input: "rgba(0, 0, 0, 0.2)",
  inputBdr: "var(--border-subtle)",
};

export const POPULAR_PLUGINS_META: Record<string, { name: string; tagline: string; iconUrl: string; provider: string; color: string; bg: string; border: string }> = {
  essentials: {
    name: "EssentialsX",
    tagline: "Essential commands, teleports, economy, and moderating tools for Spigot/Paper.",
    iconUrl: "https://cdn.modrinth.com/user_content/img/V3a1mU1R.png",
    provider: "Spiget",
    color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", border: "rgba(59, 130, 246, 0.3)"
  },
  vault: {
    name: "Vault",
    tagline: "Secure framework connecting chat, economy, and permission systems with major plugins.",
    iconUrl: "https://cdn.spigotmc.org/image/resources-logos/3431.png",
    provider: "Spiget",
    color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", border: "rgba(59, 130, 246, 0.3)"
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
    color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", border: "rgba(59, 130, 246, 0.3)"
  },
  protocollib: {
    name: "ProtocolLib",
    tagline: "Lower-level packets manipulation hook library used by advanced server systems.",
    iconUrl: "https://cdn.spigotmc.org/image/resources-logos/1996.png",
    provider: "Spiget",
    color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", border: "rgba(59, 130, 246, 0.3)"
  },
  multiverse: {
    name: "Multiverse-Core",
    tagline: "Manage separate dimensions and custom worlds on a single server machine.",
    iconUrl: "https://cdn.spigotmc.org/image/resources-logos/390.png",
    provider: "Spiget",
    color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", border: "rgba(59, 130, 246, 0.3)"
  },
  chunky: {
    name: "Chunky",
    tagline: "Pre-generates server chunks dynamically to completely resolve player exploration lag.",
    iconUrl: "https://cdn.modrinth.com/user_content/img/lX7y5p1q.png",
    provider: "Modrinth",
    color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.3)"
  }
};
