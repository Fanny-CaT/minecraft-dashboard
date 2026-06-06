"use client";

import React from "react";

export function BarChart({ values, color }: { values: number[]; color: string }) {
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
