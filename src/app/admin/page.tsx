"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CriteriaEditor } from "@/components/admin/criteria-editor";
import { ConflictCenter } from "@/components/admin/conflict-center";
import { AuditLogTable } from "@/components/admin/audit-log-table";
import { TeamQRView } from "@/components/admin/team-qr-view";
import {
  Sliders,
  ShieldAlert,
  History,
  QrCode,
  ShieldCheck,
} from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"criteria" | "conflicts" | "audit" | "teams">("criteria");

  const tabs = [
    { id: "criteria", label: "Criteria & Weights", icon: Sliders },
    { id: "conflicts", label: "Conflict Center", icon: ShieldAlert },
    { id: "audit", label: "Audit Trail & CSV", icon: History },
    { id: "teams", label: "Teams & QR Badges", icon: QrCode },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
            Admin Authority Console
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
          Competition Control & Governance
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage dynamic rubrics, resolve offline multi-device conflicts, and inspect audit logs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 bg-surface-100 p-1.5 rounded-2xl border border-border/60 max-w-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                isActive ? "text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="admin-tab-bg"
                  className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/20"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {activeTab === "criteria" && <CriteriaEditor />}
        {activeTab === "conflicts" && <ConflictCenter />}
        {activeTab === "audit" && <AuditLogTable />}
        {activeTab === "teams" && <TeamQRView />}
      </motion.div>
    </div>
  );
}
