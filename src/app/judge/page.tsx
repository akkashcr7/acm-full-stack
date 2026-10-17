"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DynamicScoringForm } from "@/components/scoring/dynamic-form";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAce } from "@/context/ace-context";
import { RotateCw, ClipboardCheck, UserCheck, ArrowRight } from "lucide-react";

function JudgeContent() {
  const searchParams = useSearchParams();
  const { currentUser, switchRole } = useAce();
  const teamId = searchParams.get("teamId") || undefined;

  if (currentUser.role === "public") {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-8 border border-border/80 shadow-2xl space-y-5"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            <ClipboardCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">
              Official Judge Scoring Terminal
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              You are currently browsing as a Spectator. Sign in as a certified Judge to evaluate autonomous robot trial runs, submit scores, and manage offline queues.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/20"
            >
              <UserCheck className="w-4 h-4" />
              <span>Sign In as Judge</span>
            </Link>
            <button
              onClick={() => switchRole("judge")}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-surface-100 hover:bg-surface-200 border border-border/80 text-white font-mono text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <span>Instant Activate Judge Mode</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return <DynamicScoringForm initialTeamId={teamId} />;
}

export default function JudgePage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <RotateCw className="w-8 h-8 mx-auto text-primary animate-spin mb-3" />
          <p className="text-xs font-mono text-slate-400">Loading scoring rubric...</p>
        </div>
      }
    >
      <JudgeContent />
    </Suspense>
  );
}
