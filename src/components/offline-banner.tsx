"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAce } from "@/context/ace-context";
import { WifiOff, RotateCw } from "lucide-react";

export function OfflineBanner() {
  const { isOnline, pendingQueueCount, triggerManualSync, isSyncing, toggleSimulatedOffline } = useAce();

  if (isOnline && pendingQueueCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden bg-gradient-to-r from-amber-950/60 via-amber-900/40 to-amber-950/60 border-b border-amber-500/30 text-amber-200"
      >
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <span className="font-semibold text-amber-300">
                {!isOnline ? "Offline Mode (Airplane Mode Active)" : "Sync Pending"}
              </span>
              <span className="text-amber-200/80 ml-1.5 hidden sm:inline">
                IndexedDB queue has {pendingQueueCount} score(s) stored locally.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isOnline && (
              <button
                onClick={toggleSimulatedOffline}
                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-medium text-amber-300 transition-colors"
              >
                Reconnect Network
              </button>
            )}

            {isOnline && pendingQueueCount > 0 && (
              <button
                onClick={triggerManualSync}
                disabled={isSyncing}
                className="px-3 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-[11px] flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <RotateCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync Now"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
