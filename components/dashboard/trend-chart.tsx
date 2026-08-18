"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";

const WIDTH = 600;
const HEIGHT = 140;
const PAD_X = 8;
const PAD_Y = 12;

export function TrendChart({ data, color = "var(--accent)" }: { data: { date: string; count: number }[]; color?: string }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.count));
  const innerWidth = WIDTH - PAD_X * 2;
  const innerHeight = HEIGHT - PAD_Y * 2;

  const points = data.map((d, i) => {
    const x = PAD_X + (data.length === 1 ? innerWidth / 2 : (i / (data.length - 1)) * innerWidth);
    const y = PAD_Y + innerHeight - (d.count / max) * innerHeight;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? 0} ${HEIGHT - PAD_Y} L ${points[0]?.x ?? 0} ${HEIGHT - PAD_Y} Z`;

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let closest = 0;
    let closestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - x);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setHoverIndex(closest);
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <path d={areaPath} fill={color} opacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {hovered && (
          <>
            <line x1={hovered.x} y1={PAD_Y} x2={hovered.x} y2={HEIGHT - PAD_Y} stroke="var(--border-strong)" strokeWidth={1} />
            <circle cx={hovered.x} cy={hovered.y} r={4} fill={color} stroke="var(--surface-1)" strokeWidth={2} />
          </>
        )}
      </svg>
      {hovered && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-[var(--radius-sm)] border border-border-strong bg-surface-3 px-2 py-1 text-[11px] shadow-[var(--shadow-md)]"
          style={{ left: `${(hovered.x / WIDTH) * 100}%` }}
        >
          <span className="font-medium text-text-primary">{hovered.count}</span>{" "}
          <span className="text-text-tertiary">{format(parseISO(hovered.date), "MMM d")}</span>
        </div>
      )}
      <div className="mt-1 flex justify-between text-[10px] text-text-tertiary">
        <span>{data[0] && format(parseISO(data[0].date), "MMM d")}</span>
        <span>{data[data.length - 1] && format(parseISO(data[data.length - 1].date), "MMM d")}</span>
      </div>
    </div>
  );
}
