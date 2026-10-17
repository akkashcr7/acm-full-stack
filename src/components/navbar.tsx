"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAce } from "@/context/ace-context";
import {
  RotateCw,
  Trophy,
  ClipboardCheck,
  Settings,
  QrCode,
  Sparkles,
  UserCheck,
  Volume2,
  VolumeX,
} from "lucide-react";
import { announcer } from "@/lib/announcer";
import { sounds } from "@/lib/sound";

export function Navbar() {
  const pathname = usePathname();
  const [voiceActive, setVoiceActive] = React.useState<boolean>(false);

  React.useEffect(() => {
    setVoiceActive(announcer.isEnabled());
  }, []);

  const toggleVoice = () => {
    sounds.playClick();
    const next = !voiceActive;
    setVoiceActive(next);
    announcer.setEnabled(next);
    if (next) {
      announcer.speak("Arena AI Voice Announcer online.");
    }
  };

  const {
    currentUser,
    isOnline,
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

        {/* Actions & Status */}
        <div className="flex items-center gap-2 sm:gap-3">

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

          {/* Arena AI Voice Announcer Button */}
          <button
            type="button"
            onClick={toggleVoice}
            title={voiceActive ? "Arena AI Voice Announcer: Active" : "Arena AI Voice Announcer: Muted"}
            className={`p-1.5 px-2 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
              voiceActive
                ? "bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(0,240,255,0.25)]"
                : "bg-surface-100 border-border/60 text-slate-400 hover:text-white"
            }`}
          >
            {voiceActive ? (
              <div className="flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-primary" />
                {/* 4-bar cyber audio waveform */}
                <div className="flex items-end gap-[2px] h-3">
                  <span className="w-[2px] h-1.5 bg-primary rounded-full animate-pulse" />
                  <span className="w-[2px] h-3 bg-primary rounded-full animate-bounce" />
                  <span className="w-[2px] h-2 bg-primary rounded-full animate-pulse" />
                  <span className="w-[2px] h-2.5 bg-primary rounded-full animate-bounce" />
                </div>
              </div>
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline text-[10px] font-bold">
              {voiceActive ? "Voice ON" : "Voice"}
            </span>
          </button>

          {/* User Account / Sign In / Role */}
          {currentUser.role === "public" ? (
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-primary/20 hover:scale-105"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2 bg-surface-100 p-1 pl-2 rounded-xl border border-border/60">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[11px] font-bold text-white leading-none truncate max-w-[100px]">
                    {currentUser.name.split(" ")[0]}
                  </p>
                  <p className="text-[9px] font-mono uppercase text-primary leading-tight">
                    {currentUser.role}
                  </p>
                </div>
              </div>

              {/* Quick switch or logout */}
              <Link
                href="/login"
                title="Switch account or sign out"
                className="px-2 py-1 rounded-lg text-[10px] font-mono text-slate-400 hover:text-white hover:bg-surface-200 transition-colors"
              >
                Switch
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Bottom Bar for Field Judges on Tablets & Phones */}
      <nav className="md:hidden fixed bottom-3 inset-x-3 z-50 glass-card bg-[#0D111E]/90 backdrop-blur-2xl border border-border/80 rounded-2xl py-2 px-3 shadow-2xl flex items-center justify-around">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative ${
                isActive ? "text-primary font-bold scale-105" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-mono tracking-tight">{link.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_#00F0FF] mt-0.5" />
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
