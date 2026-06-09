import React from "react";
import { S } from "@/lib/constants";
import { Database } from "lucide-react";
import { PluginIcon } from "@/components/PluginIcon";

export function DatapacksTab({
  TabHeader,
  datapackError,
  setDatapackError,
  searchDatapacks,
  datapackSearch,
  setDatapackSearch,
  datapackCategory,
  setDatapackCategory,
  searchingDatapacks,
  searchResults,
  getInstalledDatapackFile,
  setSelectedDatapackDetails,
  deleteDatapack,
  installingDatapackIds,
  installDatapack,
  OutlineBtn,
  loadInstalledDatapacks,
  loadingDatapacks,
  installedDatapacks,
  fmtFileSize,
  Btn,
  statusData,
}: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%" }}>
      <TabHeader label="Datapack Search & Manager" icon={<Database size={20} />} />

      {datapackError && (
        <div
          style={{
            padding: "7px 18px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderBottom: `1px solid rgba(239, 68, 68, 0.3)`,
            color: S.red,
            fontSize: "12px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>{datapackError}</span>
          <button
            onClick={() => setDatapackError("")}
            style={{
              background: "none",
              border: "none",
              color: S.red,
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
        {/* Search / Add new datapacks section */}
        <div
          style={{
            border: `1px solid ${S.border}`,
            backgroundColor: S.content,
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
              Browse & Install Datapacks
            </div>
            <span style={{ fontSize: "11px", color: S.muted, border: `1px solid ${S.border}`, padding: "2px 8px", borderRadius: "3px", backgroundColor: S.content }}>
              Modrinth
            </span>
          </div>
          <div style={{ fontSize: "11px", color: S.orange, marginBottom: "12px", lineHeight: "1.4" }}>
            ⚠️ Note: Datapacks are installed to the world/datapacks/ folder.
          </div>

          {/* Search query input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              searchDatapacks();
            }}
            style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}
          >
            <input
              type="text"
              placeholder="Search datapacks e.g. Vanilla Tweaks, Terralith..."
              value={datapackSearch}
              onChange={(e) => setDatapackSearch(e.target.value)}
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
              value={datapackCategory}
              onChange={(e) => setDatapackCategory(e.target.value)}
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
              <option value="worldgen">World Generation</option>
              <option value="magic">Magic</option>
              <option value="technology">Technology</option>
              <option value="utility">Utility</option>
            </select>
            <Btn
              label={searchingDatapacks ? "Searching..." : "Search"}
              color={S.cyan}
              onClick={searchDatapacks}
              disabled={searchingDatapacks}
            />
          </form>

          {/* Search query results list */}
          {(() => {
            const filteredResults = searchResults; // For Datapacks we just use Modrinth

            if (searchingDatapacks) {
              return (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px", gap: "10px", color: S.muted }}>
                  <div className="spinner" />
                  <span>Querying datapack repository...</span>
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
                    const theme = { text: "#10b981", bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.3)" };
                    const installedJar = getInstalledDatapackFile(plugin);

                    return (
                      <div
                        key={plugin.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 12px",
                          backgroundColor: S.content,
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
                                Modrinth
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
                            onClick={() => setSelectedDatapackDetails(plugin)}
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
                              onClick={() => deleteDatapack(installedJar.name)}
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
                              disabled={loadingDatapacks}
                            >
                              {loadingDatapacks ? "Uninstalling..." : "Uninstall"}
                            </button>
                          ) : (
                             <Btn
                               label={!!installingDatapackIds[plugin.id] ? "Installing..." : "Install"}
                               color={S.green}
                               onClick={() => installDatapack(plugin)}
                               disabled={!!installingDatapackIds[plugin.id]}
                             />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            return datapackSearch ? (
              <div style={{ color: S.muted, fontSize: "12.5px", padding: "12px", textAlign: "center" }}>
                No datapacks found matching the filters. Try another query or adjust filters.
              </div>
            ) : null;
          })()}
        </div>

        {/* Installed datapacks list section */}
        <div
          style={{
            border: `1px solid ${S.border}`,
            backgroundColor: S.content,
            padding: "16px",
            borderRadius: "3px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: S.white }}>
              Installed Datapacks (/world/datapacks folder)
            </div>
            <OutlineBtn label="Refresh List" onClick={loadInstalledDatapacks} disabled={loadingDatapacks} />
          </div>

          {loadingDatapacks ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px", gap: "10px", color: S.muted }}>
              <div className="spinner" />
              <span>Reading installed datapacks directory...</span>
            </div>
          ) : installedDatapacks.length === 0 ? (
            <div style={{ color: S.muted, fontSize: "12.5px", fontStyle: "italic", padding: "12px 0", textAlign: "center" }}>
              No datapacks found in /world/datapacks directory. Try browsing and installing datapacks above.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {installedDatapacks.map((plugin: any) => {
                const filenameClean = plugin.name.replace(/\.(zip|jar)$/i, "").toLowerCase().replace(/[^a-z0-9]/g, "");
                
                let matched: any = searchResults.find((p: any) => {
                  const searchNameClean = p.name.toLowerCase().replace(/[^a-z0-9]/g, "");
                  return filenameClean === searchNameClean || filenameClean.includes(searchNameClean) || searchNameClean.includes(filenameClean);
                });

                const iconUrl = matched?.iconUrl;
                const displayName = plugin.name;
                const tagline = matched?.tagline || `Local datapack file. Path: world/datapacks/${plugin.name}`;
                const provider = matched?.provider || "Local File";
                const sizeText = plugin.size !== undefined ? fmtFileSize(plugin.size) : "";
                const providerColor = matched ? "#10b981" : S.muted;
                const providerBg = matched ? "rgba(16, 185, 129, 0.1)" : "rgba(255,255,255,0.03)";
                const providerBorder = matched ? "rgba(16, 185, 129, 0.3)" : S.border;

                return (
                  <div
                    key={plugin.name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      backgroundColor: S.content,
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
                        onClick={() => setSelectedDatapackDetails(matched || {
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
                        onClick={() => deleteDatapack(plugin.name)}
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
                        disabled={loadingDatapacks}
                      >
                        {loadingDatapacks ? "Uninstalling..." : "Uninstall"}
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
