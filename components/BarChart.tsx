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
        backgroundColor: "transparent",
        display: "flex",
        alignItems: "flex-end",
        gap: "2px",
        padding: "0 2px",
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
            minWidth: "2px",
            borderTopLeftRadius: "2px",
            borderTopRightRadius: "2px",
            opacity: v > 0 ? 0.9 : 0.1,
            transition: "height 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}
