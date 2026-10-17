"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAce } from "@/context/ace-context";
import { UserRole } from "@/types";
import {
  signInWithFirebaseGoogle,
  isFirebaseConfigured,
  getFirebaseConfig,
  setupFirebase,
  FirebaseConfig,
} from "@/lib/firebase";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Trophy,
  AlertCircle,
  Eye,
  EyeOff,
  Scale,
  Crown,
  Eye as SpectatorIcon,
  Settings,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";
import { sounds } from "@/lib/sound";

export default function LoginPage() {
  const router = useRouter();
  const { login, currentUser, logout } = useAce();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("judge");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Firebase Config Modal State
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [rawSnippet, setRawSnippet] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [authDomain, setAuthDomain] = useState("");
  const [projectId, setProjectId] = useState("");
  const [appId, setAppId] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    setIsConfigured(isFirebaseConfigured());
    const existing = getFirebaseConfig();
    if (existing) {
      setApiKey(existing.apiKey || "");
      setAuthDomain(existing.authDomain || "");
      setProjectId(existing.projectId || "");
      setAppId(existing.appId || "");
    }

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const r = params.get("role") as UserRole | null;
      if (r === "admin" || r === "judge" || r === "public") {
        setSelectedRole(r);
      }
    }
  }, []);

  // Smart parser for pasting the entire firebaseConfig object from Firebase console
  const handleSnippetPaste = (val: string) => {
    setRawSnippet(val);
    const extract = (key: string) => {
      const match = val.match(new RegExp(`${key}["']?\\s*:\\s*["']([^"']+)["']`));
      return match ? match[1] : "";
    };

    const parsedKey = extract("apiKey");
    const parsedDomain = extract("authDomain");
    const parsedProject = extract("projectId");
    const parsedApp = extract("appId");

    if (parsedKey) setApiKey(parsedKey);
    if (parsedDomain) setAuthDomain(parsedDomain);
    if (parsedProject) setProjectId(parsedProject);
    if (parsedApp) setAppId(parsedApp);
  };

  const handleSaveFirebaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !projectId) {
      setError("Please provide at least the Firebase API Key and Project ID.");
      return;
    }

    try {
      const config: FirebaseConfig = {
        apiKey: apiKey.trim(),
        authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
        projectId: projectId.trim(),
        appId: appId.trim() || "1:web:app",
      };

      setupFirebase(config);
      setIsConfigured(true);
      setShowFirebaseModal(false);
      sounds.playSuccess();

      // Trigger Google Sign-In immediately with the newly saved configuration!
      setTimeout(() => {
        executeGoogleSignIn();
      }, 300);
    } catch {
      setError("Invalid Firebase config. Please verify your keys.");
    }
  };

  const executeGoogleSignIn = async () => {
    sounds.playClick();
    setGoogleLoading(true);
    setError(null);

    try {
      const fbResult = await signInWithFirebaseGoogle();

      if (fbResult.needsConfig) {
        setShowFirebaseModal(true);
        setGoogleLoading(false);
        return;
      }

      if (fbResult.success && fbResult.email) {
        const res = await login(
          fbResult.email,
          "firebase_google_auth",
          selectedRole,
          fbResult.displayName
        );

        if (res.success) {
          sounds.playSuccess();
          if (selectedRole === "admin") router.push("/admin");
          else if (selectedRole === "judge") router.push("/judge");
          else router.push("/");
          return;
        }
      } else if (fbResult.error) {
        if (!fbResult.error.includes("popup-closed-by-user")) {
          setError(fbResult.error);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google authentication error";
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignInClick = () => {
    if (!isFirebaseConfigured()) {
      setShowFirebaseModal(true);
    } else {
      executeGoogleSignIn();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid Gmail or email address.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await login(email.trim(), password, selectedRole);
    setLoading(false);

    if (result.success) {
      sounds.playSuccess();
      if (selectedRole === "admin" || email.toLowerCase().includes("admin")) {
        router.push("/admin");
      } else if (selectedRole === "judge" || email.toLowerCase().includes("judge")) {
        router.push("/judge");
      } else {
        router.push("/");
      }
    } else {
      sounds.playWarning();
      setError(result.error || "Authentication failed. Please check your credentials.");
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
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1px] shadow-xl shadow-cyan-500/20 mb-3">
            <div className="w-full h-full bg-[#0D111E] rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sign In to Platform
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Team ACE Autonomous Robotics Championship 2026
          </p>
        </div>

        {/* Current Active Session Pill (if already signed in) */}
        {currentUser.role !== "public" && (
          <div className="mb-5 p-3 rounded-2xl bg-surface-100/90 border border-border/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[10px] font-mono uppercase text-primary">
                  Active {currentUser.role} ({currentUser.email})
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
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-border/80 shadow-2xl space-y-5">
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

          {/* Continue with Google via Firebase */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGoogleSignInClick}
              disabled={googleLoading}
              className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm flex items-center justify-center gap-3 transition-all shadow-md hover:scale-[1.01] active:scale-[0.99]"
            >
              {googleLoading ? (
                <Sparkles className="w-4 h-4 animate-spin text-slate-800" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{googleLoading ? "Connecting Google..." : "Continue with Google"}</span>
            </button>

            {/* Firebase Config / Key button */}
            <button
              type="button"
              onClick={() => setShowFirebaseModal(true)}
              title={isConfigured ? "Firebase Connected" : "Configure Firebase Project"}
              className={`p-3 rounded-xl border transition-all ${
                isConfigured
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-surface-100 border-border/80 text-slate-400 hover:text-white hover:border-primary"
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-border/80 w-full" />
            <span className="bg-[#0b0f19] px-3 text-[11px] font-mono text-slate-400 uppercase tracking-wider shrink-0">
              or sign in with email
            </span>
            <div className="border-t border-border/80 w-full" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection Tabs */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Select Your Role
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-100 rounded-xl border border-border/60">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedRole("judge");
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    selectedRole === "judge"
                      ? "bg-primary text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Judge</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedRole("admin");
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    selectedRole === "admin"
                      ? "bg-primary text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedRole("public");
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    selectedRole === "public"
                      ? "bg-primary text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <SpectatorIcon className="w-3.5 h-3.5" />
                  <span>Public</span>
                </button>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Gmail or Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-100 border border-border/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
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
              <span>{loading ? "Authenticating..." : `Sign In as ${selectedRole.toUpperCase()}`}</span>
            </button>
          </form>
        </div>

        {/* Public Spectator Skip Link */}
        <div className="text-center mt-5">
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

      {/* Firebase Credentials Modal for Real Google Sign-In */}
      <AnimatePresence>
        {showFirebaseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-3xl p-6 sm:p-7 border border-border/80 w-full max-w-lg shadow-2xl relative space-y-4"
            >
              <button
                onClick={() => setShowFirebaseModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    Connect Firebase for Google Sign-In
                  </h3>
                  <p className="text-xs text-slate-400">
                    Enables authentic <strong className="text-white">accounts.google.com</strong> popups.
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 bg-surface-100 p-3 rounded-xl border border-border/60 space-y-1.5">
                <p className="font-semibold text-primary">Quick Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>
                    Open{" "}
                    <a
                      href="https://console.firebase.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      Firebase Console <ExternalLink className="w-2.5 h-2.5" />
                    </a>{" "}
                    &rarr; Project Settings &rarr; Your Apps &rarr; Web app.
                  </li>
                  <li>
                    In <span className="text-slate-200">Authentication &rarr; Sign-in method</span>, enable <strong className="text-white">Google</strong>.
                  </li>
                  <li>
                    Add <code className="bg-slate-900 px-1 py-0.5 rounded text-primary">acm-full-stack.vercel.app</code> to <span className="text-slate-200">Authorized domains</span>.
                  </li>
                </ol>
              </div>

              <form onSubmit={handleSaveFirebaseConfig} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">
                    Paste entire firebaseConfig snippet (Auto-parses)
                  </label>
                  <textarea
                    rows={2}
                    placeholder={`const firebaseConfig = {\n  apiKey: "AIza...",\n  projectId: "..."\n};`}
                    value={rawSnippet}
                    onChange={(e) => handleSnippetPaste(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-100 border border-border/60 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">
                      API Key
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="AIzaSy..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-surface-100 border border-border/60 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">
                      Project ID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="my-ace-robotics"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-surface-100 border border-border/60 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">
                      Auth Domain
                    </label>
                    <input
                      type="text"
                      placeholder="my-ace-robotics.firebaseapp.com"
                      value={authDomain}
                      onChange={(e) => setAuthDomain(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-surface-100 border border-border/60 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">
                      App ID
                    </label>
                    <input
                      type="text"
                      placeholder="1:123456:web:abcd"
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-surface-100 border border-border/60 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-slate-400">
                    Saved in browser storage & ready immediately.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowFirebaseModal(false)}
                      className="px-3 py-1.5 rounded-xl bg-surface-100 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-primary/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save & Launch Google Sign-In</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
