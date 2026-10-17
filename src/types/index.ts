export type UserRole = "admin" | "judge" | "public";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface CompetitionEvent {
  id: string;
  name: string;
  description: string;
  date: string;
  status: "upcoming" | "in_progress" | "completed";
}

export interface Team {
  id: string;
  name: string;
  robotName: string;
  organization: string;
  eventId: string;
  qrCodeUrl: string;
}

export interface ScoringCriterion {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  weight: number; // e.g. 1.5, 1.0, 0.8
  category: "autonomous" | "teleop" | "design" | "innovation" | "general";
  eventId: string;
}

export interface CriterionScore {
  criterionId: string;
  score: number;
}

export interface ScoreSubmission {
  id: string;
  eventId: string;
  teamId: string;
  judgeId: string;
  judgeName: string;
  criteriaScores: CriterionScore[];
  penalties: number;
  notes?: string;
  totalWeightedScore: number;
  version: number; // for conflict detection
  deviceId: string;
  createdAt: string;
  syncedAt?: string;
  isAnomaly?: boolean;
  anomalyReason?: string;
}

export interface TeamLeaderboardEntry {
  rank: number;
  team: Team;
  totalScore: number;
  rawTotal: number;
  penalties: number;
  runsCount: number;
  scoresByCriterion: Record<string, number>; // criterionId -> average score
  highestWeightedCriterionScore: number;
  varianceScore: number;
  tieBreakReason?: string;
  lastUpdated: string;
}

export interface ScoreConflict {
  id: string;
  teamId: string;
  teamName: string;
  criterionId: string;
  criterionName: string;
  existingScore: {
    judgeId: string;
    judgeName: string;
    score: number;
    timestamp: string;
    version: number;
  };
  incomingScore: {
    judgeId: string;
    judgeName: string;
    score: number;
    timestamp: string;
    version: number;
  };
  status: "pending" | "resolved";
  resolutionPolicy?: "average" | "keep_existing" | "keep_incoming" | "manual";
  resolvedValue?: number;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: "SCORE_SUBMITTED" | "SCORE_UPDATED" | "CONFLICT_RESOLVED" | "CRITERIA_MODIFIED" | "PENALTY_APPLIED";
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  targetTeamId: string;
  targetTeamName: string;
  oldValue?: string | number | null;
  newValue: string | number;
  details: string;
}

export interface OfflineQueuedScore {
  id: string;
  teamId: string;
  judgeId: string;
  judgeName: string;
  criteriaScores: CriterionScore[];
  penalties: number;
  notes?: string;
  version: number;
  deviceId: string;
  timestamp: number;
  synced: boolean;
  syncAttempts: number;
}

export interface JudgeAssignment {
  id: string;
  judgeId: string;
  judgeName: string;
  teamIds: string[];
  eventId: string;
}
