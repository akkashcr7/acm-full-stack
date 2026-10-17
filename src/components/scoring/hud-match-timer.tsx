"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Flag, Timer } from "lucide-react";
import { sounds } from "@/lib/sound";
import { announcer } from "@/lib/announcer";

interface HudMatchTimerProps {
  teamName: string;
  onTagPenalty: (timestampText: string) => void;
}

export function HudMatchTimer({ teamName, onTagPenalty }: HudMatchTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState<number>(180); // Default 3 mins
  const [timeLeft, setTimeLeft] = useState<number>(180);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [recentTags, setRecentTags] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Formatting MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            setIsRunning(false);
            sounds.playWarning();
            announcer.announceTrialEnd(teamName);
            return 0;
          }
          if (prev <= 6 && prev > 1) {
            sounds.playClick();
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft, teamName]);

  const handleTogglePlay = () => {
    sounds.playClick();
    if (!isRunning && timeLeft === totalSeconds) {
      announcer.announceTrialStart(teamName);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = (duration: number = totalSeconds) => {
    sounds.playClick();
    setIsRunning(false);
    setTimeLeft(duration);
    setTotalSeconds(duration);
  };

  const handleTagPenalty = () => {
    sounds.playWarning();
    const elapsed = totalSeconds - timeLeft;
    const tag = `[${formatTime(elapsed)}] Penalty mark recorded`;
    setRecentTags((prev) => [tag, ...prev.slice(0, 3)]);
    onTagPenalty(tag);
  };

  // Circular progress calculations
  const progress = totalSeconds > 0 ? timeLeft / totalSeconds : 0;
  const strokeDashoffset = 188 - 188 * progress; // 2 * PI * r (r=30)

  const isLowTime = timeLeft <= 30 && timeLeft > 0;
  const isExpired = timeLeft === 0;

  return (
    <div className="glass-card rounded-2xl p-4 border border-border/80 relative overflow-hidden bg-gradient-to-r from-surface-100/90 via-surface-100 to-[#0B0F19]">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Timer Identity & Ring */}
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 70 70">
              <circle
                cx="35"
                cy="35"
                r="30"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="5"
              />
              <circle
                cx="35"
                cy="35"
                r="30"
                fill="none"
                stroke={isExpired ? "#F43F5E" : isLowTime ? "#F59E0B" : "#00F0FF"}
                strokeWidth="5"
                strokeDasharray="188"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <Timer className={`w-5 h-5 absolute ${isExpired ? "text-rose-400 animate-bounce" : isLowTime ? "text-amber-400 animate-pulse" : "text-primary"}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">
                Arena Match HUD Clock
              </span>
              {isRunning && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shadow-[0_0_8px_#34d399]" />
              )}
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-white flex items-center gap-1.5">
              <span>{formatTime(timeLeft)}</span>
              {isExpired && (
                <span className="text-xs font-mono uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  TIME UP
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Target: <strong className="text-white">{teamName}</strong>
            </p>
          </div>
        </div>

        {/* Center: Controls & Presets */}
        <div className="flex items-center gap-2">
          {/* Preset Buttons */}
          <div className="flex items-center bg-surface-200/90 rounded-xl p-0.5 border border-border/60">
            <button
              type="button"
              onClick={() => handleReset(180)}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                totalSeconds === 180 ? "bg-primary text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              3m Run
            </button>
            <button
              type="button"
              onClick={() => handleReset(300)}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                totalSeconds === 300 ? "bg-primary text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              5m Run
            </button>
          </div>

          {/* Play / Pause Toggle */}
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`px-3 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-md ${
              isRunning
                ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                : "bg-primary hover:bg-primary-dark text-slate-950 shadow-primary/20 hover:scale-105"
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? "Pause" : "Start Run"}</span>
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={() => handleReset(totalSeconds)}
            title="Reset timer"
            className="p-2 rounded-xl bg-surface-200 hover:bg-surface-300 border border-border/60 text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Instant Timestamp Penalty Tagger */}
        <div className="flex flex-col items-center sm:items-end gap-1">
          <button
            type="button"
            onClick={handleTagPenalty}
            className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <Flag className="w-3.5 h-3.5 text-rose-400" />
            <span>Tag Penalty at {formatTime(totalSeconds - timeLeft)}</span>
          </button>
          {recentTags.length > 0 && (
            <span className="text-[9px] font-mono text-slate-400 truncate max-w-[170px]">
              Last: {recentTags[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
