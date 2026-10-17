"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAce } from "@/context/ace-context";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  UserCheck,
  Sparkles,
  Trophy,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { sounds } from "@/lib/sound";

export default function LoginPage() {
  const router = useRouter();
  const { login, currentUser, logout } = useAce();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const QUICK_ACCOUNTS = [
    {
      role: "Lead Administrator",
      email: "admin@ace.ai",
      pass: "Admin@123",
      name: "Alex Vance",
      badgeColor: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
      targetPath: "/admin",
    },
    {
      role: "Certified Judge",
      email: "judge1@ace.ai",
      pass: "Judge@123",
      name: "Dr. Sarah Chen",
      badgeColor: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
      targetPath: "/judge",
    },
    {
      role: "Secondary Judge",
      email: "judge2@ace.ai",
      pass: "Judge@123",
      name: "Marcus Brody",
      badgeColor: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
      targetPath: "/judge",
    },
    {
      role: "Spectator / Public",
      email: "public@ace.ai",
      pass: "Public@123",
      name: "Public Viewer",
      badgeColor: "bg-slate-500/10 border-slate-500/30 text-slate-300",
      targetPath: "/",
    },
  ];

  const handleQuickSelect = (acc: (typeof QUICK_ACCOUNTS)[0]) => {
    sounds.playClick();
    setEmail(acc.email);
    setPassword(acc.pass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your account email address.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      sounds.playSuccess();
      const matched = QUICK_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === email.toLowerCase()
      );
      if (matched) {
        router.push(matched.targetPath);
      } else {
        router.push("/");
      }
    } else {
      sounds.playWarning();
      setError(result.error || "Authentication failed. Check credentials.");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1px] shadow-xl shadow-cyan-500/20 mb-4">
            <div className="w-full h-full bg-[#0D111E] rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Official Portal Sign In
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
            Team ACE Autonomous Robotics Championship 2026 Authentication Gateway
          </p>
        </div>

        {/* Current Active Session Pill (if already signed in) */}
        {currentUser.role !== "public" && (
          <div className="mb-6 p-3 rounded-2xl bg-surface-100/90 border border-border/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[10px] font-mono uppercase text-primary">
                  Active {currentUser.role}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                sounds.playClick();
              }}
              className="text-xs text-slate-400 hover:text-rose-400 font-mono transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Login Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-border/80 shadow-2xl space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="admin@ace.ai or judge1@ace.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-100 border border-border/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter access key"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-100 border border-border/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/25 hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>{loading ? "Authenticating..." : "Sign In to Platform"}</span>
            </button>
          </form>

          {/* Quick-Fill Official Roles */}
          <div className="pt-4 border-t border-border/60">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-primary" />
                Quick-Access Official Identities
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickSelect(acc)}
                  className={`p-2.5 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${acc.badgeColor}`}
                >
                  <p className="text-[11px] font-bold leading-tight truncate">
                    {acc.name}
                  </p>
                  <p className="text-[10px] font-mono opacity-80 truncate">
                    {acc.role}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Public Spectator Skip Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              sounds.playClick();
              router.push("/");
            }}
            className="text-xs text-slate-400 hover:text-primary font-mono inline-flex items-center gap-1.5 transition-colors"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Continue as Spectator (Live Leaderboard) &rarr;</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
