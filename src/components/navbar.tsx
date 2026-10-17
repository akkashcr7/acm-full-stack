"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAce } from "@/context/ace-context";
import {
  Plane,
  RotateCw,
  Trophy,
  ClipboardCheck,
  Settings,
  QrCode,
  Sparkles,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const {
    currentUser,
    switchRole,
    isOnline,
    isSimulated,
    toggleSimulatedOffline,
    pendingQueueCount,
    triggerManualSync,
    isSyncing,
    lastSyncMessage,
  } = useAce();

  const navLinks = [
    { href: "/", label: "Leaderboard", icon: Trophy },
    { href: "/judge", label: "Scoring Form", icon: ClipboardCheck },
    { href: "/admin", label: "Admin Hub", icon: Settings },
    { href: "/qr", label: "Team Badges", icon: QrCode },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur-xl">
      {/* Sync Toast message */}
      {lastSyncMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-primary/10 border-b border-primary/30 px-4 py-1.5 text-center text-xs font-medium text-primary flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          {lastSyncMessage}
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0D111E] rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base">TEAM ACE</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                JUDGE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">Offline-First Engine</p>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-100 p-1 rounded-xl border border-border/60">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
                  isActive ? "text-white font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/40 rounded-lg"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-primary" : ""}`} />
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Airplane Mode Simulator Switch */}
          <button
            onClick={toggleSimulatedOffline}
            title="Simulate Airplane Mode to test offline scoring"
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-1.5 ${
              isSimulated
                ? "bg-amber-500/15 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/10"
                : "bg-surface-100 border-border/60 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Plane className={`w-3.5 h-3.5 ${isSimulated ? "rotate-45 text-amber-400" : ""}`} />
            <span className="hidden lg:inline">{isSimulated ? "Airplane Mode ON" : "Simulate Offline"}</span>
          </button>

          {/* Sync Button & Queue Count */}
          {pendingQueueCount > 0 && (
            <button
              onClick={triggerManualSync}
              disabled={isSyncing || !isOnline}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-all animate-pulse"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{pendingQueueCount} Queued</span>
            </button>
          )}

          {/* Online / Offline Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-100 border border-border/60 text-[11px] font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-amber-400 animate-ping"
              }`}
            />
            <span className="hidden sm:inline text-slate-300">
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>

          {/* Persona / Role Selector (Critical for Demo reviewers!) */}
          <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-lg border border-border/60">
            {(["public", "judge", "admin"] as const).map((role) => {
              const isCurrent = currentUser.role === role;
              return (
                <button
                  key={role}
                  onClick={() => switchRole(role)}
                  className={`px-2 py-1 rounded text-[11px] font-medium capitalize transition-all ${
                    isCurrent
                      ? "bg-primary text-black font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {role}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
