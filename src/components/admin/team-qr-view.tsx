"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Team } from "@/types";
import { QrCode, Plus, ExternalLink, Trash2 } from "lucide-react";

export function TeamQRView() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: "",
    robotName: "",
    organization: "",
  });

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams || []);
      }
    } catch (err) {
      console.error("Failed to load teams:", err);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleDeleteTeam = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const res = await fetch(`/api/teams?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchTeams();
      }
    } catch (err) {
      console.error("Failed to delete team:", err);
    }
  };

  const handleClearAllTeams = async () => {
    if (!confirm("Are you sure you want to clear all teams? This will reset the competition roster.")) return;
    try {
      const res = await fetch(`/api/teams?all=true`, { method: "DELETE" });
      if (res.ok) {
        await fetchTeams();
      }
    } catch (err) {
      console.error("Failed to clear teams:", err);
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ name: "", robotName: "", organization: "" });
        setShowAdd(false);
        await fetchTeams();
      }
    } catch (err) {
      console.error("Failed to add team:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Official Team Badges & QR Check-In
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Judges scan these physical QR tags on robots to instantly load the scoring rubric.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {teams.length > 0 && (
            <button
              onClick={handleClearAllTeams}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Teams</span>
            </button>
          )}

          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>Register Team</span>
          </button>
        </div>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAddTeam}
          className="glass-card rounded-2xl p-5 border border-primary/40 space-y-4"
        >
          <h3 className="font-bold text-sm text-white">Register New Robotics Team</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Team Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. RoboHawks"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-100 border border-border/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Robot Name / Model
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Talon-9"
                value={formData.robotName}
                onChange={(e) => setFormData({ ...formData, robotName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-100 border border-border/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Organization / Lab
              </label>
              <input
                type="text"
                placeholder="e.g. Robotics Institute"
                value={formData.organization}
                onChange={(e) =>
                  setFormData({ ...formData, organization: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-surface-100 border border-border/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 rounded-xl bg-surface-100 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-primary text-slate-950 font-bold text-xs"
            >
              Register & Generate QR
            </button>
          </div>
        </form>
      )}

      {/* Grid of Team Badges */}
      {teams.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-border/60">
          <QrCode className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="font-bold text-white text-base">No Teams Registered</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No teams are currently registered. Click &ldquo;Register Team&rdquo; above to add your official competition teams!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((t) => (
            <div
              key={t.id}
              className="glass-card rounded-2xl p-5 border border-border/60 flex flex-col justify-between items-center text-center relative overflow-hidden group"
            >
              {/* Delete Team Button */}
              <button
                onClick={() => handleDeleteTeam(t.id, t.name)}
                title={`Delete ${t.name}`}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-surface-100 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Holographic Header Bar */}
              <div className="w-full pb-3 border-b border-border/40 mb-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-semibold">
                  Team ACE &bull; Competitor Pass
                </span>
                <h3 className="font-extrabold text-white text-base mt-0.5">{t.name}</h3>
                <p className="text-xs text-slate-400">{t.organization}</p>
              </div>

              {/* QR Code Container */}
              <div className="w-40 h-40 bg-slate-950 rounded-xl border border-primary/40 flex items-center justify-center p-2 mb-3 shadow-lg shadow-primary/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.qrCodeUrl}
                  alt={`${t.name} QR Code`}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-xs font-mono text-slate-300 mb-3">
                Robot: <strong className="text-primary">{t.robotName}</strong>
              </div>

              {/* Direct Link to score this team */}
              <Link
                href={`/judge?teamId=${t.id}`}
                className="w-full py-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-border/80 text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-primary" />
                <span>Open Scoring Rubric</span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
