"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TeamLeaderboardEntry, ScoringCriterion } from "@/types";
import { Podium } from "./podium";
import {
  Trophy,
  Maximize2,
  Minimize2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Layers,
  Search,
  Volume2,
  VolumeX,
  Clock,
} from "lucide-react";
import { sounds } from "@/lib/sound";
import { PerformanceRadar } from "../analytics/performance-radar";
import { announcer } from "@/lib/announcer";

export function LeaderboardView() {
  const [entries, setEntries] = useState<TeamLeaderboardEntry[]>([]);
  const [criteria, setCriteria] = useState<ScoringCriterion[]>([]);
  const [eventName, setEventName] = useState<string>("Team ACE Robotics Championship");
  const [loading, setLoading] = useState<boolean>(true);
  const [isProjectorMode, setIsProjectorMode] = useState<boolean>(false);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [livePulse, setLivePulse] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Initial Fetch & SSE Subscription
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const fetchInitial = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const data = await res.json();
          setEntries(data.leaderboard || []);
          setCriteria(data.criteria || []);
          if (data.event?.name) setEventName(data.event.name);
          setLoading(false);
        }
      } catch (err) {
        console.error("Initial leaderboard fetch failed:", err);
        setLoading(false);
      }
    };

    fetchInitial();

    // Connect to Server-Sent Events (SSE) for < 2-second real-time live updates!
    try {
      eventSource = new EventSource("/api/leaderboard/stream");

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.leaderboard) {
            setEntries((prev) => {
              if (
                data.leaderboard.length > 0 &&
                prev.length > 0 &&
                prev[0].team.id !== data.leaderboard[0].team.id
              ) {
                announcer.announceLeadChange(
                  data.leaderboard[0].team.name,
                  data.leaderboard[0].totalScore
                );
              }
              return data.leaderboard;
            });
            setLastUpdated(new Date());
            sounds.playSync();
            // Flash live pulse
            setLivePulse(true);
            setTimeout(() => setLivePulse(false), 1200);
          }
        } catch {
          // ignore non-json pings
        }
      };

      eventSource.onerror = () => {
        // Fallback polling every 3 seconds if SSE connection drops
        eventSource?.close();
      };
    } catch {
      console.warn("SSE not available, relying on polling fallback");
    }

    // Polling fallback interval to ensure sync even if SSE is interrupted
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const data = await res.json();
          setEntries(data.leaderboard || []);
          if (data.criteria) setCriteria(data.criteria);
        }
      } catch {
        // silent offline
      }
    }, 3000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, []);

  const toggleExpand = (teamId: string) => {
    sounds.playClick();
    setExpandedTeamId(expandedTeamId === teamId ? null : teamId);
  };

  const filteredEntries = entries.filter(
    (e) =>
      e.team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.team.robotName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.team.organization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`min-h-[calc(100vh-4rem)] transition-all duration-300 ${
        isProjectorMode
          ? "fixed inset-0 z-50 bg-[#07090E] p-6 sm:p-10 overflow-y-auto"
          : "max-w-6xl mx-auto px-4 py-8"
      }`}
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                livePulse ? "bg-primary animate-ping" : "bg-emerald-400 shadow-[0_0_10px_#10B981]"
              }`}
            />
            <span className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
              Live Stream &bull; &lt; 2s Latency
            </span>
          </div>
          <h1
            className={`font-black tracking-tight text-white ${
              isProjectorMode ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
            }`}
          >
            {eventName}
          </h1>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
            <Clock className="w-3.5 h-3.5" />
            Last calculated {lastUpdated.toLocaleTimeString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              sounds.enabled = next;
              if (next) sounds.playClick();
            }}
            title={soundEnabled ? "Sound enabled" : "Sound muted"}
            className="p-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-border/80 text-xs text-slate-300 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-primary" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Projector Mode Toggle */}
          <button
            onClick={() => setIsProjectorMode(!isProjectorMode)}
            className="px-3.5 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-border/80 text-xs font-medium text-slate-300 flex items-center gap-2 transition-all hover:border-primary/40"
          >
            {isProjectorMode ? (
              <>
                <Minimize2 className="w-4 h-4 text-primary" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-primary" />
                <span>Projector Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top 3 Podium (Hidden in compact mobile view if projector mode is off) */}
      {!loading && entries.length > 0 && <Podium entries={entries} />}

      {/* Search Filter Bar */}
      <div className="mt-6 mb-3 relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search by team, robot model, or organization..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-100 border border-border/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
        />
      </div>

      {/* Leaderboard Table / Card List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-4 py-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-4">
            <span className="w-8 text-center">Rank</span>
            <span>Team & Robot</span>
          </div>
          <div className="flex items-center gap-6 sm:gap-10">
            <span className="hidden sm:inline">Runs</span>
            <span className="hidden sm:inline">Penalties</span>
            <span className="w-20 text-right font-bold text-slate-200">Total Pts</span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <RotateCw className="w-8 h-8 mx-auto text-primary animate-spin mb-3" />
            <p className="text-sm text-slate-400 font-mono">Loading real-time scores...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center border border-border/60">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No Teams Registered Yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              The competition board is ready. Admins can register official teams in the Admin Hub &rarr; Teams.
            </p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No matching teams found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search query.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredEntries.map((entry, index) => {
              const isExpanded = expandedTeamId === entry.team.id;
              const isTopThree = index < 3;
              const rankColor =
                index === 0
                  ? "text-amber-300 border-amber-400/50 bg-amber-400/10"
                  : index === 1
                  ? "text-slate-300 border-slate-400/50 bg-slate-400/10"
                  : index === 2
                  ? "text-amber-500 border-amber-600/50 bg-amber-600/10"
                  : "text-slate-400 border-border/60 bg-surface-100";

              return (
                <motion.div
                  layout
                  layoutId={entry.team.id}
                  key={entry.team.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  className={`glass-card rounded-2xl border transition-all overflow-hidden ${
                    isTopThree ? "border-primary/25 shadow-lg shadow-primary/5" : "border-border/60"
                  }`}
                >
                  <div
                    onClick={() => toggleExpand(entry.team.id)}
                    className="p-4 sm:px-6 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Rank & Team Details */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center font-mono font-bold text-sm shrink-0 ${rankColor}`}
                      >
                        #{entry.rank === 999 ? "-" : entry.rank}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm sm:text-base truncate">
                            {entry.team.name}
                          </h4>
                          {entry.tieBreakReason && (
                            <span
                              title={entry.tieBreakReason}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 shrink-0"
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                              Tie-Break
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono truncate">
                          <span className="text-primary/90">{entry.team.robotName}</span>
                          <span>&bull;</span>
                          <span className="truncate">{entry.team.organization}</span>
                        </div>
                      </div>
                    </div>

                    {/* Scores & Actions */}
                    <div className="flex items-center gap-4 sm:gap-10 shrink-0">
                      <div className="hidden sm:block text-center font-mono text-xs text-slate-300">
                        <span className="font-semibold text-white">{entry.runsCount}</span>
                        <span className="text-slate-500 text-[10px] ml-1">runs</span>
                      </div>

                      <div className="hidden sm:block text-center font-mono text-xs text-slate-300">
                        {entry.penalties > 0 ? (
                          <span className="text-rose-400 font-semibold">-{entry.penalties}</span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-extrabold text-base sm:text-xl text-white">
                          {entry.totalScore.toFixed(1)}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block -mt-1">
                          pts
                        </span>
                      </div>

                      <div className="text-slate-500 hover:text-slate-300">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Criteria Breakdown Accordion */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border/40 bg-surface-200/50 p-4 sm:px-6"
                      >
                        <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-primary" />
                            Judging Criteria Breakdown
                          </span>
                          {entry.tieBreakReason && (
                            <span className="text-indigo-300 font-sans normal-case">
                              {entry.tieBreakReason}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col lg:flex-row items-center gap-6">
                          {/* Criteria Bars Grid */}
                          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {criteria.map((c) => {
                              const score = entry.scoresByCriterion[c.id] ?? 0;
                              const percentage = Math.min(100, (score / c.maxScore) * 100);
                              return (
                                <div
                                  key={c.id}
                                  className="bg-surface-100/80 rounded-xl p-3 border border-border/40"
                                >
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="font-medium text-slate-200 truncate pr-2">
                                      {c.name}
                                    </span>
                                    <span className="text-[10px] font-mono text-primary font-bold">
                                      wt {c.weight}
                                    </span>
                                  </div>
                                  <div className="flex items-baseline justify-between mb-1.5">
                                    <span className="text-lg font-mono font-bold text-white">
                                      {score.toFixed(1)}
                                    </span>
                                    <span className="text-xs font-mono text-slate-500">
                                      / {c.maxScore}
                                    </span>
                                  </div>
                                  {/* Mini Progress bar */}
                                  <div className="w-full h-1.5 bg-surface-50 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Holographic Performance Radar Spider Chart */}
                          {criteria.length >= 3 && (
                            <div className="shrink-0 flex flex-col items-center p-2 rounded-2xl bg-surface-100/50 border border-border/30">
                              <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold mb-1">
                                Capability Profile Radar
                              </span>
                              <PerformanceRadar
                                criteria={criteria}
                                scores={entry.scoresByCriterion}
                                teamName={entry.team.name}
                                size={220}
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
