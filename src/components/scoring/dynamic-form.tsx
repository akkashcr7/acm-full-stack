"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Team, ScoringCriterion, CriterionScore, JudgeAssignment } from "@/types";
import { useAce } from "@/context/ace-context";
import { calculateWeightedScore } from "@/lib/scoring";
import { queueScoreOffline, isNetworkOnline } from "@/lib/offline/sync";
import { offlineDB, getOrCreateDeviceId } from "@/lib/offline/db";
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  Sparkles,
  Zap,
  RotateCw,
  Camera,
  Target,
} from "lucide-react";
import { sounds } from "@/lib/sound";

export function DynamicScoringForm({ initialTeamId }: { initialTeamId?: string }) {
  const { currentUser, isOnline } = useAce();
  const [teams, setTeams] = useState<Team[]>([]);
  const [criteria, setCriteria] = useState<ScoringCriterion[]>([]);
  const [assignedTeamIds, setAssignedTeamIds] = useState<string[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(initialTeamId || "");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [penalties, setPenalties] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "offline" | "error" | "anomaly";
    text: string;
  } | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  // Load teams & criteria (from network or IndexedDB offline cache!)
  useEffect(() => {
    const loadData = async () => {
      try {
        if (isNetworkOnline()) {
          const [teamsRes, critRes, asgnRes] = await Promise.all([
            fetch("/api/teams"),
            fetch("/api/criteria"),
            fetch("/api/assignments"),
          ]);
          if (teamsRes.ok && critRes.ok) {
            const { teams } = await teamsRes.json();
            const { criteria } = await critRes.json();
            setTeams(teams);
            setCriteria(criteria);
            if (asgnRes.ok) {
              const { assignments } = await asgnRes.json();
              const myAsgn = assignments?.find((a: JudgeAssignment) => a.judgeId === currentUser.id);
              if (myAsgn) setAssignedTeamIds(myAsgn.teamIds);
            }
            if (!selectedTeamId && teams.length > 0) {
              setSelectedTeamId(teams[0].id);
            }
            // Initialize default scores
            const initialScores: Record<string, number> = {};
            for (const c of criteria) {
              initialScores[c.id] = Math.round(c.maxScore * 0.75);
            }
            setScores(initialScores);
            return;
          }
        }

        // Offline Fallback: Load from IndexedDB
        if (offlineDB) {
          const cachedTeams = await offlineDB.cachedTeams.toArray();
          const cachedCriteria = await offlineDB.cachedCriteria.toArray();
          if (cachedTeams.length > 0) {
            setTeams(cachedTeams);
            if (!selectedTeamId) setSelectedTeamId(cachedTeams[0].id);
          }
          if (cachedCriteria.length > 0) {
            setCriteria(cachedCriteria);
            const initialScores: Record<string, number> = {};
            for (const c of cachedCriteria) {
              initialScores[c.id] = Math.round(c.maxScore * 0.75);
            }
            setScores(initialScores);
          }
        }
      } catch (err) {
        console.error("Failed to load scoring setup:", err);
      }
    };

    loadData();
  }, [selectedTeamId, currentUser.id]);

  // Camera scanner handling with real-time BarcodeDetector
  useEffect(() => {
    let stream: MediaStream | null = null;
    let scanInterval: NodeJS.Timeout | null = null;

    if (showQRModal) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: "environment" } })
          .then((s) => {
            stream = s;
            setCameraActive(true);
            if (videoRef.current) {
              videoRef.current.srcObject = s;
            }

            // Real-time BarcodeDetector API for instant QR decoding
            if (typeof window !== "undefined" && "BarcodeDetector" in window) {
              try {
                // @ts-expect-error Native BarcodeDetector
                const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
                scanInterval = setInterval(async () => {
                  if (
                    videoRef.current &&
                    videoRef.current.readyState >= 2
                  ) {
                    try {
                      const barcodes = await detector.detect(videoRef.current);
                      if (barcodes && barcodes.length > 0) {
                        const raw = barcodes[0].rawValue || "";
                        const matched = teams.find(
                          (t) =>
                            t.id === raw ||
                            raw.includes(t.id) ||
                            raw.toLowerCase().includes(t.name.toLowerCase())
                        );
                        if (matched) {
                          sounds.playSuccess();
                          setSelectedTeamId(matched.id);
                          setShowQRModal(false);
                        }
                      }
                    } catch {
                      // Skip frame if decoding in progress
                    }
                  }
                }, 300);
              } catch {
                // BarcodeDetector format not supported
              }
            }
          })
          .catch(() => {
            setCameraActive(false);
          });
      }
    } else {
      if (stream) {
        (stream as MediaStream).getTracks().forEach((track) => track.stop());
      }
      if (scanInterval) clearInterval(scanInterval);
      setCameraActive(false);
    }

    return () => {
      if (stream) {
        (stream as MediaStream).getTracks().forEach((track) => track.stop());
      }
      if (scanInterval) clearInterval(scanInterval);
    };
  }, [showQRModal, teams]);

  const applyPreset = (type: "perfect" | "penalty" | "anomaly") => {
    sounds.playClick();
    if (type === "perfect") {
      const pScores: Record<string, number> = {};
      criteria.forEach((c) => {
        pScores[c.id] = c.maxScore;
      });
      setScores(pScores);
      setPenalties(0);
      setNotes("Flawless autonomous run with optimal path navigation.");
    } else if (type === "penalty") {
      const pScores: Record<string, number> = {};
      criteria.forEach((c) => {
        pScores[c.id] = Math.round(c.maxScore * 0.85);
      });
      setScores(pScores);
      setPenalties(3);
      setNotes("Minor perimeter boundary violation on obstacle 2.");
    } else if (type === "anomaly") {
      const pScores: Record<string, number> = {};
      criteria.forEach((c) => {
        pScores[c.id] = Math.max(1, Math.round(c.maxScore * 0.15));
      });
      setScores(pScores);
      setPenalties(8);
      setNotes("Hardware stall and total sensor failure (Triggers 2σ anomaly flag).");
    }
  };

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  // Calculate live weighted total
  const criteriaScoresList: CriterionScore[] = criteria.map((c) => ({
    criterionId: c.id,
    score: scores[c.id] ?? 0,
  }));
  const liveTotalScore = calculateWeightedScore(criteriaScoresList, criteria, penalties);

  const handleScoreChange = (criterionId: string, value: number, max: number) => {
    const clamped = Math.max(0, Math.min(max, value));
    setScores((prev) => ({ ...prev, [criterionId]: clamped }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    setSubmitting(true);
    setStatusMessage(null);

    const submissionPayload = {
      eventId: selectedTeam.eventId || "evt_ace_2026",
      teamId: selectedTeam.id,
      judgeId: currentUser.id,
      judgeName: currentUser.name,
      criteriaScores: criteriaScoresList,
      penalties,
      notes,
      version: 1,
      deviceId: getOrCreateDeviceId(),
    };

    try {
      // Offline-First Check: If offline or airplane mode, queue into IndexedDB!
      if (!isNetworkOnline()) {
        await queueScoreOffline({
          ...submissionPayload,
          teamName: selectedTeam.name,
        });

        sounds.playSync();
        setStatusMessage({
          type: "offline",
          text: `Offline Mode: Score (${liveTotalScore.toFixed(
            1
          )} pts) saved locally to IndexedDB queue. It will auto-sync when online.`,
        });
        setSubmitting(false);
        return;
      }

      // Online: Submit directly to API
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      sounds.playSuccess();
      if (data.isAnomaly) {
        setStatusMessage({
          type: "anomaly",
          text: `Score submitted! Note: Anomaly detected: deviates > 2σ from panel consensus.`,
        });
      } else if (data.conflict) {
        setStatusMessage({
          type: "offline",
          text: `Concurrent conflict detected for ${selectedTeam.name}. Sent to Admin Conflict Center for resolution!`,
        });
      } else {
        setStatusMessage({
          type: "success",
          text: `Score for ${selectedTeam.name} (${liveTotalScore.toFixed(
            1
          )} pts) submitted and broadcasted live!`,
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Error submitting score";
      setStatusMessage({
        type: "error",
        text: errorMsg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-primary">
            Judge Evaluation Console
          </span>
          <h1 className="text-2xl font-black text-white">Dynamic Scoring Form</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluating as: <span className="text-slate-200 font-semibold">{currentUser.name}</span>
          </p>
        </div>

        {/* QR Scan Button */}
        <button
          onClick={() => setShowQRModal(true)}
          className="px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/40 text-primary text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-primary/10"
        >
          <Camera className="w-4 h-4" />
          <span>Scan Team QR</span>
        </button>
      </div>

      {/* Status banner */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl mb-6 text-xs flex items-start gap-3 border ${
              statusMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : statusMessage.type === "offline"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : statusMessage.type === "anomaly"
                ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : statusMessage.type === "offline" ? (
              <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
            ) : statusMessage.type === "anomaly" ? (
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{statusMessage.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Team Selection */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-border/80">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Target Robotics Team
            </label>
            <span className="text-[10px] font-mono text-primary">
              Select or scan QR to switch
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {teams.map((t) => {
              const isSelected = t.id === selectedTeamId;
              const isAssigned = assignedTeamIds.includes(t.id);
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedTeamId(t.id);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? "bg-primary/15 border-primary text-white shadow-md shadow-primary/10"
                      : "bg-surface-100 border-border/60 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {isAssigned && (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                  )}
                  <p className="font-bold text-sm truncate">{t.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{t.robotName}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Presets Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface-100/90 rounded-2xl border border-border/80">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-primary" />
            Quick Scenarios:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset("perfect")}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-[11px] font-semibold text-emerald-300 transition-colors"
            >
              🎯 Perfect Run
            </button>
            <button
              type="button"
              onClick={() => applyPreset("penalty")}
              className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-[11px] font-semibold text-amber-300 transition-colors"
            >
              ⚠️ Minor Penalty
            </button>
            <button
              type="button"
              onClick={() => applyPreset("anomaly")}
              className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-[11px] font-semibold text-purple-300 transition-colors"
            >
              🚨 2σ Outlier
            </button>
          </div>
        </div>

        {/* Dynamic Criteria Sliders */}
        <div className="glass-card rounded-2xl p-5 border border-border/80 space-y-5">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h3 className="font-bold text-white text-sm">Official Judging Rubric</h3>
            <span className="text-[11px] font-mono text-primary font-medium">
              Dynamic Weighted Matrix
            </span>
          </div>

          {criteria.map((c) => {
            const currentScore = scores[c.id] ?? 0;
            return (
              <div key={c.id} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">{c.name}</span>
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-surface-50 border border-border/60 text-[10px] font-mono text-primary">
                      wt {c.weight}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-base font-bold text-white">{currentScore}</span>
                    <span className="text-slate-500 text-xs">/ {c.maxScore}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">{c.description}</p>

                {/* Interactive Slider */}
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max={c.maxScore}
                    step="1"
                    value={currentScore}
                    onChange={(e) => handleScoreChange(c.id, Number(e.target.value), c.maxScore)}
                    className="w-full h-2 bg-surface-50 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleScoreChange(c.id, currentScore - 1, c.maxScore)}
                      className="w-7 h-7 rounded-lg bg-surface-100 hover:bg-surface-50 border border-border/60 text-white font-mono text-xs flex items-center justify-center"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScoreChange(c.id, currentScore + 1, c.maxScore)}
                      className="w-7 h-7 rounded-lg bg-surface-100 hover:bg-surface-50 border border-border/60 text-white font-mono text-xs flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Penalties Slider */}
          <div className="border-t border-border/40 pt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-rose-400">Rule Violation Penalties</span>
              <span className="font-mono font-bold text-rose-400">-{penalties} pts</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Boundary crossing, human intervention, or mechanical drop deduction.
            </p>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={penalties}
              onChange={(e) => setPenalties(Number(e.target.value))}
              className="w-full h-2 bg-surface-50 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          {/* Notes */}
          <div className="border-t border-border/40 pt-3">
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Field Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Remarkable waypoint recovery on ramp..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-100 border border-border/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Live Calculation Sticky Bar */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-primary/30 flex items-center justify-between shadow-xl shadow-primary/10">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Calculated Run Total
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">
                {liveTotalScore.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-primary font-semibold">weighted pts</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-slate-950 font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
          >
            {submitting ? (
              <RotateCw className="w-4 h-4 animate-spin" />
            ) : !isOnline ? (
              <WifiOff className="w-4 h-4" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>{!isOnline ? "Save to Offline Queue" : "Submit Score"}</span>
          </button>
        </div>
      </form>

      {/* QR Code Scanner Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel w-full max-w-sm rounded-2xl p-6 border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                Scan Team QR Code
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-xs font-mono text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="w-full aspect-square bg-slate-950 rounded-xl border border-primary/40 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
              />
              {!cameraActive && (
                <div className="w-48 h-48 border-2 border-primary/60 border-dashed rounded-xl flex flex-col items-center justify-center p-4">
                  <QrCode className="w-16 h-16 text-primary/40 animate-pulse mb-2" />
                  <p className="text-[11px] text-slate-400 font-mono">
                    Point camera at robot or badge QR code
                  </p>
                </div>
              )}
              {/* Animated laser scanning reticle line */}
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#00F0FF] animate-pulse-slow top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-[10px] uppercase font-mono text-slate-400 text-center">
                Or Quick-Select Demo Team:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {teams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTeamId(t.id);
                      setShowQRModal(false);
                    }}
                    className="p-2 rounded-lg bg-surface-100 hover:bg-surface-50 border border-border/60 text-xs font-medium text-white truncate"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
