"use client";

import React, { useState, useEffect } from "react";
import { Activity, ShieldCheck, Wifi, Radio, Cpu, Award } from "lucide-react";
import { useAce } from "@/context/ace-context";

export function TelemetryTicker() {
  const { isOnline, pendingQueueCount } = useAce();
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const items = [
    {
      icon: Radio,
      label: "ARENA TELEMETRY",
      value: "ACTIVE",
      color: "text-emerald-400",
      glow: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
    },
    {
      icon: Activity,
      label: "CHAMPIONSHIP",
      value: "TEAM ACE 2026",
      color: "text-primary",
      glow: "bg-primary shadow-[0_0_8px_#00F0FF]",
    },
    {
      icon: Wifi,
      label: "NETWORK SYNC",
      value: isOnline ? "REAL-TIME SSE (0-LATENCY)" : "OFFLINE PERSISTENCE",
      color: isOnline ? "text-cyan-300" : "text-amber-400",
      glow: isOnline ? "bg-cyan-400" : "bg-amber-400",
    },
    {
      icon: Cpu,
      label: "DATA ENGINE",
      value: pendingQueueCount > 0 ? `${pendingQueueCount} QUEUED` : "INDEXEDDB v5 ALL SYNCED",
      color: "text-indigo-300",
      glow: "bg-indigo-400",
    },
    {
      icon: ShieldCheck,
      label: "SCORING INTEGRITY",
      value: "2-SIGMA ANOMALY CONSENSUS",
      color: "text-purple-300",
      glow: "bg-purple-400",
    },
    {
      icon: Award,
      label: "TIE-BREAKER PROTOCOL",
      value: "MULTI-TIER WEIGHTED VARIANCE",
      color: "text-amber-300",
      glow: "bg-amber-400",
    },
  ];

  return (
    <div className="w-full bg-[#070A12]/90 border-b border-border/50 backdrop-blur-md overflow-hidden py-1 px-2 select-none">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-2 text-[10px] font-mono">
        {/* Left static badge */}
        <div className="flex items-center gap-1.5 shrink-0 bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-md text-primary font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
          <span>LIVE BROADCAST</span>
          {timeStr && <span className="text-slate-400 ml-1 text-[9px]">{timeStr} UTC</span>}
        </div>

        {/* Scrolling Telemetry Marquee Ribbon */}
        <div className="flex-1 overflow-hidden relative mx-3 mask-fade">
          <div className="flex items-center gap-8 whitespace-nowrap animate-marquee">
            {items.concat(items).map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-center gap-2 shrink-0">
                  <Icon className={`w-3 h-3 ${item.color}`} />
                  <span className="text-slate-400 uppercase tracking-wider">{item.label}:</span>
                  <span className={`font-bold ${item.color}`}>{item.value}</span>
                  <span className="text-slate-700 mx-2">&bull;</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right status */}
        <div className="hidden sm:flex items-center gap-2 shrink-0 text-slate-400 text-[9px]">
          <span>GRID: 45PX SPOTLIGHT</span>
          <span className="text-slate-700">&bull;</span>
          <span className="text-primary font-semibold">v5.0 PROD</span>
        </div>
      </div>
    </div>
  );
}
