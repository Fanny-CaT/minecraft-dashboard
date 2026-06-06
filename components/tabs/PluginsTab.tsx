import React from "react";
import { S, POPULAR_PLUGINS_META } from "@/lib/constants";
import { Puzzle } from "lucide-react";
import { PluginIcon } from "@/components/PluginIcon";

export function PluginsTab({
  TabHeader,
  pluginError,
  setPluginError,
  searchPlugins,
  pluginSearch,
  setPluginSearch,
  pluginCategory,
  setPluginCategory,
  filterProvider,
  setFilterProvider,
  filterVersion,
  setFilterVersion,
  searchingPlugins,
  searchResults,
  getInstalledPluginFile,
  setSelectedPluginDetails,
  deletePlugin,
  installingPluginIds,
  installPlugin,
  OutlineBtn,
  loadInstalledPlugins,
  loadingPlugins,
  installedPlugins,
  fmtFileSize,
  Btn,
}: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%" }}>
      <TabHeader label="Plugin Search & Manager" icon={<Puzzle size={20} />} />

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
              marginBottom: "4px",
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: 600, color: S.white }}>
              Browse & Install Plugins
            </div>
            <span style={{ fontSize: "11px", color: S.muted, border: `1px solid ${S.border}`, padding: "2px 8px", borderRadius: "3px", backgroundColor: "#1e1e1e" }}>
              Modrinth, Spiget & Hangar
            </span>
          </div>
          <div style={{ fontSize: "11px", color: S.orange, marginBottom: "12px", lineHeight: "1.4" }}>
            ⚠️ Note: Due to Vercel free tier limits, plugins larger than 4.5MB may fail to install via the dashboard and cause an HTTP 500. For large plugins like WorldEdit, please upload manually via SFTP.
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
                minWidth: "150px",
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
              value={pluginCategory}
              onChange={(e) => setPluginCategory(e.target.value)}
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
              <option value="">All Categories</option>
              <option value="admin">Admin & Management</option>
              <option value="world">World Generation</option>
              <option value="economy">Economy</option>
              <option value="chat">Chat & Roles</option>
              <option value="optimization">Optimization</option>
              <option value="utility">Utility & API</option>
            </select>
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
            const filteredResults = searchResults.filter((plugin: any) => {
              if (filterProvider !== "all") {
                if (plugin.provider?.toLowerCase() !== filterProvider.toLowerCase()) {
                  return false;
                }
              }
              if (filterVersion !== "all") {
                const versions = plugin.versions || [];
                if (versions.length === 0) return true; // Don't hide plugins that don't report versions

                const cleanFilter = filterVersion.trim().toLowerCase();
                const hasVersion = versions.some((v: string) => {
                  const cleanV = v.trim().toLowerCase();
                  if (cleanV === cleanFilter) return true;
                  // If plugin supports '1.20', it should match filter '1.20.4'
                  if (cleanFilter.startsWith(cleanV + ".")) return true;
                  // If filter is '1.20', it should match plugin '1.20.4'
                  if (cleanV.startsWith(cleanFilter + ".")) return true;
                  return false;
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
                  {filteredResults.map((plugin: any) => {
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
              {installedPlugins.map((plugin: any) => {
                const filenameClean = plugin.name.replace(/\.jar$/i, "").toLowerCase().replace(/[^a-z0-9]/g, "");
                
                let matched: any = searchResults.find((p: any) => {
                  const searchNameClean = p.name.toLowerCase().replace(/[^a-z0-9]/g, "");
                  return filenameClean === searchNameClean || filenameClean.includes(searchNameClean) || searchNameClean.includes(filenameClean);
                });

                if (!matched) {
                  const key = Object.keys(POPULAR_PLUGINS_META).find((k) => filenameClean.includes(k) || k.includes(filenameClean));
                  if (key) {
                    matched = (POPULAR_PLUGINS_META as any)[key];
                  }
                }

                const iconUrl = matched?.iconUrl;
                const displayName = plugin.name;
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
  );
}
