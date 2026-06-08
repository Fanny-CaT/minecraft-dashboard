"use client";

import React, { useMemo } from "react";

interface SparklineChartProps {
  data: number[];
  color: string;
  gradientId: string;
  max?: number;
  height?: number;
  width?: number;
}

export function SparklineChart({
  data,
  color,
  gradientId,
  max,
  height = 50,
  width = 300,
}: SparklineChartProps) {
  const points = useMemo(() => {
    if (data.length === 0) return "";
    const effectiveMax = max !== undefined ? max : Math.max(...data, 1);
    
    // Create a smooth curve
    const xStep = width / Math.max(data.length - 1, 1);
    const getCoords = (val: number, i: number) => {
      const x = i * xStep;
      // height - 2 so the stroke doesn't clip
      const y = height - (val / effectiveMax) * (height - 2) - 1;
      return { x, y };
    };

    let path = `M ${getCoords(data[0], 0).x},${getCoords(data[0], 0).y}`;
    
    for (let i = 0; i < data.length - 1; i++) {
      const p0 = getCoords(data[i], i);
      const p1 = getCoords(data[i + 1], i + 1);
      // Cubic bezier for smoothing
      const cx = (p0.x + p1.x) / 2;
      path += ` C ${cx},${p0.y} ${cx},${p1.y} ${p1.x},${p1.y}`;
    }
    return path;
  }, [data, max, height, width]);

  const fillPath = useMemo(() => {
    if (!points) return "";
    return `${points} L ${width},${height} L 0,${height} Z`;
  }, [points, width, height]);

  if (data.length === 0) {
    return (
      <div style={{ width: "100%", height, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", fontSize: "10px" }}>
        NO DATA
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
        <filter id={`${gradientId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Background fill */}
      <path d={fillPath} fill={`url(#${gradientId})`} />
      
      {/* Glow path */}
      <path d={points} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.5} filter={`url(#${gradientId}-glow)`} />
      
      {/* Main sharp path */}
      <path d={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
