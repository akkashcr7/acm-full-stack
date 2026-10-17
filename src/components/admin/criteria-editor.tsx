"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScoringCriterion } from "@/types";
import { Plus, Trash2, Sliders } from "lucide-react";

export function CriteriaEditor() {
  const [criteria, setCriteria] = useState<ScoringCriterion[]>([]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    maxScore: 25,
    weight: 1.0,
    category: "autonomous" as ScoringCriterion["category"],
  });
  const [saving, setSaving] = useState<boolean>(false);

  const fetchCriteria = async () => {
    try {
      const res = await fetch("/api/criteria");
      if (res.ok) {
        const data = await res.json();
        setCriteria(data.criteria || []);
      }
    } catch (err) {
      console.error("Failed to fetch criteria:", err);
    }
  };

  useEffect(() => {
    fetchCriteria();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          eventId: "evt_ace_2026",
        }),
      });

      if (res.ok) {
        setFormData({
          name: "",
          description: "",
          maxScore: 25,
          weight: 1.0,
          category: "autonomous",
        });
        setShowAddForm(false);
        await fetchCriteria();
      }
    } catch (err) {
      console.error("Failed to add criterion:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this judging criterion?")) return;
    try {
      const res = await fetch(`/api/criteria?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchCriteria();
      }
    } catch (err) {
      console.error("Failed to delete criterion:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            Judging Criteria & Weight Distribution
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic scoring metrics evaluated across all robot trial runs.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Criterion</span>
        </button>
      </div>

      {/* Add Criterion Drawer */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="glass-card rounded-2xl p-5 border border-primary/40 space-y-4 overflow-hidden"
          >
            <h3 className="font-bold text-sm text-white">Create New Judging Criterion</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Criterion Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramp Ascent Speed"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-100 border border-border/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as ScoringCriterion["category"],
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-surface-100 border border-border/60 text-xs text-white focus:outline-none focus:border-primary"
                >
                  <option value="autonomous">Autonomous</option>
                  <option value="teleop">Tele-Op</option>
                  <option value="design">Mechanical Design</option>
                  <option value="innovation">Innovation / AI</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Max Score
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={formData.maxScore}
                  onChange={(e) =>
                    setFormData({ ...formData, maxScore: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-surface-100 border border-border/60 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Weight Multiplier (e.g. 1.5)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5.0"
                  required
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-surface-100 border border-border/60 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Description & Rubric Guidance
              </label>
              <textarea
                rows={2}
                placeholder="Explain the grading criteria for field judges..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-surface-100 border border-border/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl bg-surface-100 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-xl bg-primary text-slate-950 font-bold text-xs"
              >
                {saving ? "Saving..." : "Save Criterion"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Criteria Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {criteria.map((c) => (
          <div
            key={c.id}
            className="glass-card rounded-2xl p-4 border border-border/60 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-bold text-white text-sm">{c.name}</h4>
                <button
                  onClick={() => handleDelete(c.id)}
                  title="Delete criterion"
                  className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-3">{c.description}</p>
            </div>

            <div className="flex items-center justify-between border-t border-border/40 pt-2.5 text-xs font-mono">
              <span className="text-slate-400">
                Max: <strong className="text-white">{c.maxScore}</strong>
              </span>
              <span className="text-primary font-bold">
                Weight: &times;{c.weight}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
