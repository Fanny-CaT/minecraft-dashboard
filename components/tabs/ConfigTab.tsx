import React from "react";
import { S } from "@/lib/constants";
import { FileCog } from "lucide-react";

export function ConfigTab({
  configSubTab,
  setConfigSubTab,
  savingConfig,
  saveConfig,
  loadingConfig,
  loadConfig,
  configError,
  configSearch,
  setConfigSearch,
  filteredConfig,
  setConfigProps,
  savingStartup,
  startupSavedTime,
  renderStartupVariablesForm,
  loadStartupSettings,
  Btn,
  OutlineBtn,
}: any) {
  return (
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
          <FileCog size={24} />
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
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderBottom: `1px solid rgba(239, 68, 68, 0.3)`,
            color: S.red,
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
                backgroundColor: S.content,
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
                  backgroundColor: S.content,
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: `1px solid ${S.border}`,
                        backgroundColor: S.bg,
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
                      filteredConfig.map(([key, val]: [string, string]) => (
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
                                    setConfigProps((prev: Record<string, string>) => ({ ...prev, [key]: next }));
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
                                  setConfigProps((prev: Record<string, string>) => ({ ...prev, [key]: next }));
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
                                  setConfigProps((prev: Record<string, string>) => ({ ...prev, [key]: next }));
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
                                  setConfigProps((prev: Record<string, string>) => ({ ...prev, [key]: next }));
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
                                  setConfigProps((prev: Record<string, string>) => ({ ...prev, [key]: next }));
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
                                  setConfigProps((prev: Record<string, string>) => ({ ...prev, [key]: next }));
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
                                  setConfigProps((prev: Record<string, string>) => ({ ...prev, [key]: next }));
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
                backgroundColor: S.content,
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
  );
}
