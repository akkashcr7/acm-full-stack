import Dexie, { Table } from "dexie";
import { Team, ScoringCriterion, CriterionScore } from "@/types";

export interface QueuedOfflineScore {
  id: string; // client UUID
  eventId: string;
  teamId: string;
  teamName: string;
  judgeId: string;
  judgeName: string;
  criteriaScores: CriterionScore[];
  penalties: number;
  notes?: string;
  version: number;
  deviceId: string;
  timestamp: string;
  synced: number; // 0 = false, 1 = true
  syncAttempts: number;
  lastError?: string;
}

export class AceJudgeDatabase extends Dexie {
  queuedScores!: Table<QueuedOfflineScore, string>;
  cachedTeams!: Table<Team, string>;
  cachedCriteria!: Table<ScoringCriterion, string>;

  constructor() {
    super("AceJudgeDB");
    this.version(1).stores({
      queuedScores: "id, teamId, judgeId, synced, timestamp",
      cachedTeams: "id, name, eventId",
      cachedCriteria: "id, category, eventId",
    });
  }
}

// Client-side singleton instance with SSR safety
export const offlineDB = typeof window !== "undefined" ? new AceJudgeDatabase() : null;

/**
 * Get device fingerprint/ID to track multi-device conflicts
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "server-device";
  let deviceId = localStorage.getItem("ace_device_id");
  if (!deviceId) {
    deviceId = `dev_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`;
    localStorage.setItem("ace_device_id", deviceId);
  }
  return deviceId;
}
