"use client";

import React, { useState, useEffect } from "react";
import { AuditLogEntry } from "@/types";
import { Download, History, Search } from "lucide-react";

export function AuditLogTable() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState<string>("");

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/audit");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.targetTeamName.toLowerCase().includes(search.toLowerCase()) ||
      l.actorName.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            Official Competition Audit Trail
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically timestamped log of all judge submissions, revisions & conflict resolutions.
          </p>
        </div>

        <a
          href="/api/audit/export"
          download
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20"
        >
          <Download className="w-4 h-4" />
          <span>Export Results CSV</span>
        </a>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by team, judge, or action description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-100 border border-border/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
        />
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl border border-border/60 overflow-hidden">
        <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-200/80 sticky top-0 font-mono text-[11px] text-slate-400 uppercase tracking-wider border-b border-border/60">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Judge / Actor</th>
                <th className="py-3 px-4">Target Team</th>
                <th className="py-3 px-4">Score Delta</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isAnomaly = log.details.includes("[ANOMALY FLAG]");
                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isAnomaly ? "bg-purple-950/20" : ""
                      }`}
                    >
                      <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.action === "SCORE_SUBMITTED"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : log.action === "CONFLICT_RESOLVED"
                              ? "bg-amber-500/15 text-amber-300"
                              : "bg-indigo-500/15 text-indigo-300"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-200 font-sans font-medium">
                        {log.actorName}
                      </td>
                      <td className="py-2.5 px-4 text-white font-sans font-bold">
                        {log.targetTeamName}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {log.oldValue !== null && log.oldValue !== undefined ? (
                          <span className="text-slate-400">
                            {String(log.oldValue)} &rarr;{" "}
                            <strong className="text-primary">{String(log.newValue)}</strong>
                          </span>
                        ) : (
                          <strong className="text-primary">{String(log.newValue)}</strong>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-300 font-sans max-w-xs truncate">
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
