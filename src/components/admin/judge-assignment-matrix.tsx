"use client";

import React, { useState, useEffect } from "react";
import { User, Team, JudgeAssignment } from "@/types";
import { UserCheck, Check, RotateCw } from "lucide-react";
import { sounds } from "@/lib/sound";

export function JudgeAssignmentMatrix() {
  const [judges, setJudges] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      const [uRes, tRes, aRes] = await Promise.all([
        fetch("/api/auth"),
        fetch("/api/teams"),
        fetch("/api/assignments"),
      ]);
      if (uRes.ok && tRes.ok && aRes.ok) {
        const { users } = await uRes.json();
        const { teams } = await tRes.json();
        const { assignments } = await aRes.json();
        setJudges(users.filter((u: User) => u.role === "judge"));
        setTeams(teams);
        setAssignments(assignments || []);
      }
    } catch (err) {
      console.error("Failed to load assignment data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleAssignment = async (judge: User, teamId: string) => {
    sounds.playClick();
    const currentAssignment = assignments.find((a) => a.judgeId === judge.id);
    const currentTeamIds = currentAssignment ? [...currentAssignment.teamIds] : [];

    const exists = currentTeamIds.includes(teamId);
    const updatedTeamIds = exists
      ? currentTeamIds.filter((id) => id !== teamId)
      : [...currentTeamIds, teamId];

    // Optimistic UI update
    setAssignments((prev) => {
      const next = prev.filter((a) => a.judgeId !== judge.id);
      next.push({
        id: currentAssignment?.id || `asgn_${Date.now()}`,
        judgeId: judge.id,
        judgeName: judge.name,
        teamIds: updatedTeamIds,
        eventId: "evt_ace_2026",
      });
      return next;
    });

    setSaving(true);
    try {
      await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judgeId: judge.id,
          judgeName: judge.name,
          teamIds: updatedTeamIds,
        }),
      });
    } catch (err) {
      console.error("Failed to save assignment:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Judge Roster & Team Allocations
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Allocate official scoring panels to robot trials across the arena.
          </p>
        </div>

        {saving && (
          <span className="text-xs font-mono text-primary flex items-center gap-1.5 animate-pulse">
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
            Saving assignments...
          </span>
        )}
      </div>

      {teams.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center border border-border/80">
          <UserCheck className="w-10 h-10 text-slate-500 mx-auto mb-2" />
          <h3 className="font-bold text-white text-sm">No Teams Registered Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Please register competition teams in the &ldquo;Teams & QR Badges&rdquo; tab to allocate judges.
          </p>
        </div>
      ) : judges.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center border border-border/80">
          <UserCheck className="w-10 h-10 text-slate-500 mx-auto mb-2" />
          <h3 className="font-bold text-white text-sm">No Certified Judges Logged In</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Judges will appear here automatically when they sign in with their Google or judge email.
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-border/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-200/90 font-mono text-slate-400 uppercase tracking-wider border-b border-border/60">
                <tr>
                  <th className="py-3 px-4">Robot Team</th>
                  <th className="py-3 px-4">Organization</th>
                  {judges.map((j) => (
                    <th key={j.id} className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-slate-200">{j.name}</span>
                        <span className="text-[10px] text-primary lowercase">{j.email}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {teams.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{t.name}</p>
                      <p className="text-[11px] font-mono text-primary">{t.robotName}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{t.organization}</td>

                    {judges.map((j) => {
                      const asgn = assignments.find((a) => a.judgeId === j.id);
                      const isAssigned = asgn?.teamIds.includes(t.id);

                      return (
                        <td key={j.id} className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleAssignment(j, t.id)}
                            className={`w-7 h-7 mx-auto rounded-lg border flex items-center justify-center transition-all ${
                              isAssigned
                                ? "bg-primary border-primary text-slate-950 font-bold shadow-md shadow-primary/20 scale-105"
                                : "bg-surface-100 border-border/60 text-slate-600 hover:border-slate-400"
                            }`}
                          >
                            {isAssigned ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
