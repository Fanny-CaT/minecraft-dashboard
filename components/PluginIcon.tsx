"use client";

import React, { useState, useEffect } from "react";
import { Ico } from "./icons";
import { S } from "@/lib/constants";

interface PluginIconProps {
  url?: string;
  size?: number;
  color?: string;
}

export const PluginIcon: React.FC<PluginIconProps> = ({ url, size = 36, color }) => {
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
