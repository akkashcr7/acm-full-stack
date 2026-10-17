"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { TeamLeaderboardEntry } from "@/types";
import { Trophy, Crown, Medal, Award } from "lucide-react";
import confetti from "canvas-confetti";

interface PodiumProps {
  entries: TeamLeaderboardEntry[];
}

export function Podium({ entries }: PodiumProps) {
  const topThree = entries.slice(0, 3);
  const first = topThree[0];
  const second = topThree[1];
  const third = topThree[2];

  const firstTeamId = first?.team.id;
  const firstScore = first?.totalScore;

  useEffect(() => {
    if (firstTeamId && firstScore && firstScore > 0) {
      // Gentle celebratory confetti trigger on podium load
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#00F0FF", "#8B5CF6", "#F59E0B"],
        disableForReducedMotion: true,
      });
    }
  }, [firstTeamId, firstScore]);

  if (!first || first.totalScore === 0) return null;

  return (
    <div className="w-full pt-4 pb-8">
      <div className="flex items-center justify-center gap-2 mb-6">
        <Crown className="w-5 h-5 text-amber-400" />
        <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-300">
          Championship Podium
        </h2>
      </div>

      <div className="flex items-end justify-center gap-3 sm:gap-6 max-w-4xl mx-auto px-2">
        {/* 2nd Place (Silver - Left) */}
        {second && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex-1 max-w-[200px] flex flex-col items-center"
          >
            {/* Card */}
            <div className="w-full text-center mb-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center mb-2 shadow-lg shadow-slate-400/10">
                <Medal className="w-6 h-6 text-slate-300" />
              </div>
              <h3 className="font-bold text-white text-sm sm:text-base truncate px-1">
                {second.team.name}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">{second.team.robotName}</p>
              <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-600 text-xs font-mono font-semibold text-slate-200">
                {second.totalScore.toFixed(1)} pts
              </div>
            </div>

            {/* Pedestal */}
            <div className="w-full h-32 rounded-t-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/90 border-t-2 border-x border-slate-400/40 flex flex-col items-center justify-center p-3 relative overflow-hidden backdrop-blur-md">
              <span className="text-3xl font-black text-slate-400/40">2</span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mt-1">
                Runner Up
              </span>
            </div>
          </motion.div>
        )}

        {/* 1st Place (Gold - Center) */}
        {first && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 max-w-[240px] flex flex-col items-center z-10"
          >
            {/* Card */}
            <div className="w-full text-center mb-3">
              <div className="relative w-16 h-16 mx-auto rounded-full bg-gradient-to-b from-amber-400/30 to-amber-600/30 border-2 border-amber-400 flex items-center justify-center mb-2 shadow-xl shadow-amber-400/25">
                <Crown className="w-8 h-8 text-amber-300 animate-bounce" />
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-black">
                  1
                </div>
              </div>
              <h3 className="font-extrabold text-white text-base sm:text-lg truncate px-1">
                {first.team.name}
              </h3>
              <p className="text-xs text-amber-300/90 font-medium truncate">{first.team.robotName}</p>
              <div className="inline-block mt-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/60 text-sm font-mono font-bold text-amber-300 shadow-lg shadow-amber-400/20">
                {first.totalScore.toFixed(1)} pts
              </div>
            </div>

            {/* Pedestal */}
            <div className="w-full h-44 rounded-t-2xl bg-gradient-to-b from-amber-500/25 via-amber-950/40 to-slate-950/90 border-t-2 border-x border-amber-400/60 flex flex-col items-center justify-center p-3 relative overflow-hidden backdrop-blur-md shadow-2xl shadow-amber-500/10">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/15 via-transparent to-transparent pointer-events-none" />
              <Trophy className="w-8 h-8 text-amber-400/50 mb-1" />
              <span className="text-4xl font-black text-amber-400/80">1</span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-300 font-bold mt-1">
                Champion
              </span>
            </div>
          </motion.div>
        )}

        {/* 3rd Place (Bronze - Right) */}
        {third && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 max-w-[200px] flex flex-col items-center"
          >
            {/* Card */}
            <div className="w-full text-center mb-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-900/40 border-2 border-amber-700/80 flex items-center justify-center mb-2 shadow-lg shadow-amber-900/20">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-bold text-white text-sm sm:text-base truncate px-1">
                {third.team.name}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">{third.team.robotName}</p>
              <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-amber-900/30 border border-amber-700/60 text-xs font-mono font-semibold text-amber-400">
                {third.totalScore.toFixed(1)} pts
              </div>
            </div>

            {/* Pedestal */}
            <div className="w-full h-24 rounded-t-2xl bg-gradient-to-b from-amber-950/40 to-slate-900/90 border-t-2 border-x border-amber-700/40 flex flex-col items-center justify-center p-3 relative overflow-hidden backdrop-blur-md">
              <span className="text-3xl font-black text-amber-700/40">3</span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-600/80 mt-1">
                3rd Place
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
