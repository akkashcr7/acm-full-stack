"use client";

import React from "react";
import { ScoringCriterion } from "@/types";

interface PerformanceRadarProps {
  criteria: ScoringCriterion[];
  scores: Record<string, number>;
  averages?: Record<string, number>;
  teamName: string;
  size?: number;
}

export function PerformanceRadar({
  criteria,
  scores,
  averages,
  teamName,
  size = 280,
}: PerformanceRadarProps) {
  if (!criteria || criteria.length < 3) {
    return (
      <div className="w-full py-8 text-center text-xs text-slate-500 font-mono">
        At least 3 criteria required for radar visualization.
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.34;
  const count = criteria.length;

  const getCoordinates = (index: number, normalizedValue: number, rOffset: number = 0) => {
    const angle = (index * 2 * Math.PI) / count - Math.PI / 2;
    const r = radius * Math.min(Math.max(normalizedValue, 0.05), 1.0) + rOffset;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      angle,
    };
  };

  // Concentric levels (25%, 50%, 75%, 100%)
  const levels = [0.25, 0.5, 0.75, 1.0];

  // Path generator for a polygon at a specific scale or dataset
  const generatePath = (values: number[]) => {
    const points = values.map((val, idx) => {
      const { x, y } = getCoordinates(idx, val);
      return `${x},${y}`;
    });
    return `M ${points.join(" L ")} Z`;
  };

  // Team normalized values (score / maxScore)
  const teamValues = criteria.map((c) => {
    const raw = scores[c.id] ?? 0;
    return c.maxScore > 0 ? raw / c.maxScore : 0;
  });

  // Benchmark average normalized values (fallback to 65% benchmark if empty)
  const avgValues = criteria.map((c) => {
    if (averages && averages[c.id] !== undefined && c.maxScore > 0) {
      return averages[c.id] / c.maxScore;
    }
    return 0.62; // Standard tournament field baseline
  });

  const teamPath = generatePath(teamValues);
  const avgPath = generatePath(avgValues);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="overflow-visible select-none drop-shadow-[0_0_12px_rgba(0,240,255,0.15)]"
        >
          <defs>
            <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.15" />
            </linearGradient>
            <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Concentric Grid Rings */}
          {levels.map((lvl, idx) => {
            const levelPoints = criteria.map((_, i) => {
              const { x, y } = getCoordinates(i, lvl);
              return `${x},${y}`;
            });
            const d = `M ${levelPoints.join(" L ")} Z`;
            return (
              <path
                key={idx}
                d={d}
                fill="none"
                stroke={idx === levels.length - 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}
                strokeWidth={idx === levels.length - 1 ? "1.5" : "1"}
              />
            );
          })}

          {/* Radial Axis Spokes */}
          {criteria.map((_, idx) => {
            const { x, y } = getCoordinates(idx, 1.0);
            return (
              <line
                key={idx}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            );
          })}

          {/* Tournament Benchmark Average Polygon */}
          <path
            d={avgPath}
            fill="rgba(148, 163, 184, 0.08)"
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="transition-all duration-500"
          />

          {/* Team Performance Polygon */}
          <path
            d={teamPath}
            fill="url(#radarGradient)"
            stroke="#00F0FF"
            strokeWidth="2.5"
            filter="url(#radarGlow)"
            className="transition-all duration-500"
          />

          {/* Vertex Nodes for Team Data Points */}
          {criteria.map((c, idx) => {
            const val = teamValues[idx];
            const { x, y } = getCoordinates(idx, val);
            const rawScore = scores[c.id] ?? 0;
            return (
              <g key={c.id}>
                <circle
                  cx={x}
                  cy={y}
                  r="4.5"
                  fill="#00F0FF"
                  stroke="#0D111E"
                  strokeWidth="2"
                  className="transition-all duration-300 hover:scale-125"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="7"
                  fill="none"
                  stroke="#00F0FF"
                  strokeWidth="1"
                  opacity="0.4"
                />
                <title>{`${c.name}: ${rawScore} / ${c.maxScore} pts (weight ${c.weight})`}</title>
              </g>
            );
          })}

          {/* Axis Labels outside perimeter */}
          {criteria.map((c, idx) => {
            const angle = (idx * 2 * Math.PI) / count - Math.PI / 2;
            const labelR = radius + 24;
            const lx = cx + labelR * Math.cos(angle);
            const ly = cy + labelR * Math.sin(angle);
            const rawScore = scores[c.id] ?? 0;

            const textAnchor =
              Math.cos(angle) > 0.3 ? "start" : Math.cos(angle) < -0.3 ? "end" : "middle";

            return (
              <g key={c.id} className="cursor-default">
                <text
                  x={lx}
                  y={ly - 2}
                  textAnchor={textAnchor}
                  className="fill-slate-300 font-mono text-[9px] font-bold"
                >
                  {c.name.split(" ")[0]}
                </text>
                <text
                  x={lx}
                  y={ly + 9}
                  textAnchor={textAnchor}
                  className="fill-primary font-mono text-[8px]"
                >
                  {rawScore}/{c.maxScore}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[10px] font-mono">
        <div className="flex items-center gap-1.5 text-primary">
          <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_6px_#00F0FF]" />
          <span className="font-semibold">{teamName}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="w-3 h-0.5 border-t border-dashed border-slate-400" />
          <span>Tournament Baseline</span>
        </div>
      </div>
    </div>
  );
}
