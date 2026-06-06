"use client";

interface SparklineProps {
  data: number[];
  color: string;
  /** Y-axis max value (default 100) */
  max?: number;
  height?: number;
  /** If true, fills the area under the line */
  fill?: boolean;
  /** Unique ID suffix for the SVG gradient — prevents id collisions */
  gradientId: string;
}

/**
 * Lightweight SVG sparkline — no external dependencies.
 * Renders a polyline with an optional gradient fill and a live "dot" at the current value.
 */
export function SparklineChart({
  data,
  color,
  max = 100,
  height = 52,
  fill = true,
  gradientId,
}: SparklineProps) {
  const W = 300;
  const H = height;
  const PAD = 3;
  const usableH = H - PAD * 2;

  if (data.length < 2) {
    return (
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke={color} strokeOpacity={0.15} strokeWidth={1} strokeDasharray="4 4" />
      </svg>
    );
  }

  const toY = (v: number) => PAD + usableH - (Math.min(Math.max(v, 0), max) / max) * usableH;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = toY(v);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const lastX = W;
  const lastY = toY(data[data.length - 1]);

  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {fill && (
        <polygon
          points={`0,${H} ${points.join(" ")} ${W},${H}`}
          fill={`url(#${gradientId})`}
        />
      )}

      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Current value dot */}
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
      <circle cx={lastX} cy={lastY} r="5" fill={color} fillOpacity="0.2" />
    </svg>
  );
}
