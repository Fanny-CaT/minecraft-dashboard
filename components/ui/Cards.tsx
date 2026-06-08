"use client";

import React from "react";
import { S } from "@/lib/constants";
import { SparklineChart } from "@/components/SparklineChart";

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "10px",
  color: S.muted,
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  display: "block",
};

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        backgroundColor: S.content,
        border: `1px solid ${S.border}`,
        padding: "20px",
        borderRadius: "4px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 style={{ fontSize: "14px", fontWeight: "bold", color: S.white, margin: 0 }}>{title}</h2>
      <p style={{ fontSize: "11px", color: S.muted, margin: "4px 0 0" }}>{subtitle}</p>
    </div>
  );
}

interface SparkCardProps {
  title: string;
  value: string;
  sub: string;
  valueColor: string;
  data: number[];
  sparkColor: string;
  gradientId: string;
  max: number;
  badge?: { label: string; color: string };
}

export function SparkCard({ title, value, sub, valueColor, data, sparkColor, gradientId, max, badge }: SparkCardProps) {
  return (
    <div
      style={{
        backgroundColor: S.bg,
        border: `1px solid ${S.border}`,
        borderRadius: "3px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span style={LABEL_STYLE}>{title}</span>
          <div style={{ fontSize: "22px", fontWeight: 700, color: valueColor, fontFamily: "monospace", marginTop: "4px" }}>
            {value}
          </div>
          <div style={{ fontSize: "10px", color: S.muted, marginTop: "2px" }}>{sub}</div>
        </div>
        {badge && (
          <div
            style={{
              fontSize: "9px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: badge.color,
              border: `1px solid ${badge.color}`,
              borderRadius: "2px",
              padding: "2px 8px",
              opacity: 0.9,
              whiteSpace: "nowrap",
            }}
          >
            {badge.label}
          </div>
        )}
      </div>
      <div style={{ height: "52px", borderRadius: "2px", overflow: "hidden" }}>
        <SparklineChart data={data} color={sparkColor} gradientId={gradientId} max={max} height={52} />
      </div>
    </div>
  );
}
