"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ScoreConflict } from "@/types";
import { useAce } from "@/context/ace-context";
import {
  ShieldAlert,
  GitMerge,
  CheckCircle2,
  RotateCw,
  Scale,
} from "lucide-react";

export function ConflictCenter() {
  const { currentUser } = useAce();
  const [conflicts, setConflicts] = useState<ScoreConflict[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchConflicts = async () => {
    try {
      const res = await fetch("/api/conflicts");
      if (res.ok) {
        const data = await res.json();
        setConflicts(data.conflicts || []);
      }
    } catch (err) {
      console.error("Failed to load conflicts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConflicts();
    const interval = setInterval(fetchConflicts, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (
    conflictId: string,
    policy: "average" | "keep_existing" | "keep_incoming"
  ) => {
    setResolvingId(conflictId);
    try {
      const res = await fetch("/api/conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conflictId,
          resolutionPolicy: policy,
          resolvedBy: currentUser.id,
        }),
      });

      if (res.ok) {
        await fetchConflicts();
      }
    } catch (err) {
      console.error("Conflict resolution failed:", err);
    } finally {
      setResolvingId(null);
    }
  };

  const pending = conflicts.filter((c) => c.status === "pending");
  const resolved = conflicts.filter((c) => c.status === "resolved");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            Concurrency Conflict Resolution Hub
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Explicit policy-based merge engine. Never silent last-write-wins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchConflicts}
            className="p-2 rounded-lg bg-surface-100 hover:bg-surface-50 border border-border/60 text-slate-400 hover:text-white text-xs flex items-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs font-mono text-slate-400">
          Loading conflicts...
        </div>
      ) : pending.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center border border-emerald-500/20">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <h3 className="font-bold text-white text-sm">No Pending Concurrency Conflicts</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            All offline and multi-device score synchronizations are currently in consensus.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((conf) => {
            const midpoint = (
              (conf.existingScore.score + conf.incomingScore.score) /
              2
            ).toFixed(2);
            const isResolving = resolvingId === conf.id;

            return (
              <motion.div
                key={conf.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-5 border border-amber-500/40 shadow-xl shadow-amber-500/5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    <span className="font-bold text-white text-sm">
                      {conf.teamName} &bull; {conf.criterionName}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
                    AWAITING ADMIN RESOLUTION
                  </span>
                </div>

                {/* Side-by-side comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {/* Version A */}
                  <div className="bg-surface-100 p-4 rounded-xl border border-border/60">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-mono">Existing Record</span>
                      <span>v{conf.existingScore.version}</span>
                    </div>
                    <div className="font-mono font-extrabold text-2xl text-white mb-1">
                      {conf.existingScore.score.toFixed(1)} pts
                    </div>
                    <p className="text-xs text-slate-300 font-medium">
                      Judge: {conf.existingScore.judgeName}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {new Date(conf.existingScore.timestamp).toLocaleTimeString()}
                    </p>
                  </div>

                  {/* Version B */}
                  <div className="bg-surface-100 p-4 rounded-xl border border-primary/40">
                    <div className="flex items-center justify-between text-xs text-primary mb-2">
                      <span className="font-mono">Incoming Sync Record</span>
                      <span>v{conf.incomingScore.version}</span>
                    </div>
                    <div className="font-mono font-extrabold text-2xl text-primary mb-1">
                      {conf.incomingScore.score.toFixed(1)} pts
                    </div>
                    <p className="text-xs text-slate-300 font-medium">
                      Judge: {conf.incomingScore.judgeName}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {new Date(conf.incomingScore.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Resolution Policy Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-primary" />
                    <span>Average Consensus: <strong className="text-white">{midpoint} pts</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={isResolving}
                      onClick={() => handleResolve(conf.id, "average")}
                      className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-primary/20"
                    >
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>Merge (Average)</span>
                    </button>

                    <button
                      disabled={isResolving}
                      onClick={() => handleResolve(conf.id, "keep_incoming")}
                      className="px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-border/80 text-xs font-medium text-slate-300 transition-colors"
                    >
                      Accept Incoming
                    </button>

                    <button
                      disabled={isResolving}
                      onClick={() => handleResolve(conf.id, "keep_existing")}
                      className="px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-border/80 text-xs font-medium text-slate-300 transition-colors"
                    >
                      Keep Existing
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Resolved history */}
      {resolved.length > 0 && (
        <div className="mt-8 pt-6 border-t border-border/40">
          <h3 className="text-xs font-mono uppercase text-slate-400 mb-3">
            Resolved Conflicts Log ({resolved.length})
          </h3>
          <div className="space-y-2">
            {resolved.map((res) => (
              <div
                key={res.id}
                className="p-3 rounded-xl bg-surface-200/50 border border-border/40 text-xs flex items-center justify-between text-slate-400"
              >
                <span>{res.teamName} &bull; {res.criterionName}</span>
                <span className="font-mono text-emerald-400">
                  Policy: {res.resolutionPolicy} &bull; Final: {res.resolvedValue} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
