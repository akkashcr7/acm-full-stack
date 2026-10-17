import { offlineDB, QueuedOfflineScore, getOrCreateDeviceId } from "./db";
import { Team, ScoringCriterion, CriterionScore } from "@/types";

export interface SyncResult {
  syncedCount: number;
  conflictsCount: number;
  errors: string[];
}

/**
 * Checks if the browser is currently online (and not in simulated offline mode)
 */
export function isNetworkOnline(): boolean {
  if (typeof window === "undefined") return true;
  const simulatedOffline = localStorage.getItem("ace_simulate_offline") === "true";
  if (simulatedOffline) return false;
  return navigator.onLine;
}

export function setSimulatedOffline(offline: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem("ace_simulate_offline", offline ? "true" : "false");
  window.dispatchEvent(new Event("ace-connection-change"));
}

export function isSimulatedOffline(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("ace_simulate_offline") === "true";
}

/**
 * Cache current teams and criteria in IndexedDB for offline access
 */
export async function cacheMetadataForOffline(
  teams: Team[],
  criteria: ScoringCriterion[]
) {
  const db = offlineDB;
  if (!db) return;
  try {
    await db.transaction("rw", db.cachedTeams, db.cachedCriteria, async () => {
      await db.cachedTeams.clear();
      await db.cachedTeams.bulkAdd(teams);
      await db.cachedCriteria.clear();
      await db.cachedCriteria.bulkAdd(criteria);
    });
  } catch (err) {
    console.error("Failed to cache offline metadata:", err);
  }
}

/**
 * Queue a score offline in IndexedDB
 */
export async function queueScoreOffline(params: {
  eventId: string;
  teamId: string;
  teamName: string;
  judgeId: string;
  judgeName: string;
  criteriaScores: CriterionScore[];
  penalties: number;
  notes?: string;
}): Promise<QueuedOfflineScore> {
  const db = offlineDB;
  if (!db) {
    throw new Error("IndexedDB is not available in this environment.");
  }

  const record: QueuedOfflineScore = {
    id: `queue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    eventId: params.eventId,
    teamId: params.teamId,
    teamName: params.teamName,
    judgeId: params.judgeId,
    judgeName: params.judgeName,
    criteriaScores: params.criteriaScores,
    penalties: params.penalties,
    notes: params.notes,
    version: 1,
    deviceId: getOrCreateDeviceId(),
    timestamp: new Date().toISOString(),
    synced: 0,
    syncAttempts: 0,
  };

  await db.queuedScores.add(record);
  window.dispatchEvent(new Event("ace-queue-updated"));
  return record;
}

/**
 * Get count of pending offline scores
 */
export async function getPendingQueue(): Promise<QueuedOfflineScore[]> {
  const db = offlineDB;
  if (!db) return [];
  return await db.queuedScores.where("synced").equals(0).toArray();
}

/**
 * Push all queued offline scores to server
 */
export async function syncOfflineQueue(): Promise<SyncResult> {
  const db = offlineDB;
  if (!db) {
    return { syncedCount: 0, conflictsCount: 0, errors: [] };
  }

  const pending = await getPendingQueue();
  if (pending.length === 0) {
    return { syncedCount: 0, conflictsCount: 0, errors: [] };
  }

  if (!isNetworkOnline()) {
    return {
      syncedCount: 0,
      conflictsCount: 0,
      errors: ["Cannot sync: System is offline or in simulated airplane mode"],
    };
  }

  try {
    const response = await fetch("/api/scores/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scores: pending.map((item) => ({
          eventId: item.eventId,
          teamId: item.teamId,
          judgeId: item.judgeId,
          judgeName: item.judgeName,
          criteriaScores: item.criteriaScores,
          penalties: item.penalties,
          notes: item.notes,
          version: item.version,
          deviceId: item.deviceId,
          clientTimestamp: item.timestamp,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Sync failed with server status ${response.status}`);
    }

    const data = await response.json();

    // Mark items as synced in IndexedDB
    await db.transaction("rw", db.queuedScores, async () => {
      for (const item of pending) {
        await db.queuedScores.update(item.id, {
          synced: 1,
          syncAttempts: item.syncAttempts + 1,
        });
      }
    });

    window.dispatchEvent(new Event("ace-queue-updated"));
    return {
      syncedCount: data.syncedCount || pending.length,
      conflictsCount: data.conflictsCount || 0,
      errors: [],
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Sync error";
    // Increment sync attempts
    for (const item of pending) {
      await db.queuedScores.update(item.id, {
        syncAttempts: item.syncAttempts + 1,
        lastError: errorMsg,
      });
    }
    return {
      syncedCount: 0,
      conflictsCount: 0,
      errors: [errorMsg],
    };
  }
}
