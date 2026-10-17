import {
  User,
  CompetitionEvent,
  Team,
  ScoringCriterion,
  ScoreSubmission,
  ScoreConflict,
  AuditLogEntry,
  TeamLeaderboardEntry,
  JudgeAssignment,
} from "@/types";
import {
  calculateWeightedScore,
  generateLeaderboard,
  detectAnomalies,
} from "./scoring";

// Pre-seeded initial data for Team ACE Robotics Competition
const INITIAL_USERS: User[] = [
  {
    id: "usr_admin",
    name: "Alex Vance (Lead Admin)",
    email: "admin@ace.ai",
    role: "admin",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: "usr_judge1",
    name: "Dr. Sarah Chen (Judge 1)",
    email: "judge1@ace.ai",
    role: "judge",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: "usr_judge2",
    name: "Marcus Brody (Judge 2)",
    email: "judge2@ace.ai",
    role: "judge",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: "usr_public",
    name: "Spectator / Public",
    email: "public@ace.ai",
    role: "public",
  },
];

const INITIAL_EVENT: CompetitionEvent = {
  id: "evt_ace_2026",
  name: "Team ACE Autonomous Robotics Championship 2026",
  description: "High-stakes autonomous navigation, payload delivery & obstacle traversal.",
  date: "2026-10-18",
  status: "in_progress",
};

const INITIAL_CRITERIA: ScoringCriterion[] = [
  {
    id: "crit_auto_nav",
    name: "Autonomous Navigation",
    description: "Path accuracy, waypoint adherence, and dynamic re-routing without human input.",
    maxScore: 30,
    weight: 1.5,
    category: "autonomous",
    eventId: "evt_ace_2026",
  },
  {
    id: "crit_obstacle",
    name: "Obstacle Course & Hazard Clearance",
    description: "Speed, precision, and agility crossing rough terrain and unexpected barriers.",
    maxScore: 25,
    weight: 1.2,
    category: "teleop",
    eventId: "evt_ace_2026",
  },
  {
    id: "crit_mech_robust",
    name: "Mechanical Robustness & Build",
    description: "Chassis structural integrity, sensor mounting durability, and thermal management.",
    maxScore: 25,
    weight: 1.0,
    category: "design",
    eventId: "evt_ace_2026",
  },
  {
    id: "crit_innovation",
    name: "Algorithmic Innovation & Code Quality",
    description: "Efficiency of onboard SLAM, sensor fusion, and failure-recovery algorithms.",
    maxScore: 20,
    weight: 0.8,
    category: "innovation",
    eventId: "evt_ace_2026",
  },
];

const INITIAL_TEAMS: Team[] = [
  {
    id: "team_alpha",
    name: "CyberViper",
    robotName: "Viper-X Mk IV",
    organization: "MIT Robotics Lab",
    eventId: "evt_ace_2026",
    qrCodeUrl: "/api/qr?data=team_alpha",
  },
  {
    id: "team_beta",
    name: "RoboTitans",
    robotName: "Atlas Prime",
    organization: "Stanford Robotics",
    eventId: "evt_ace_2026",
    qrCodeUrl: "/api/qr?data=team_beta",
  },
  {
    id: "team_gamma",
    name: "QuantumGear",
    robotName: "Q-Rover 900",
    organization: "Carnegie Mellon",
    eventId: "evt_ace_2026",
    qrCodeUrl: "/api/qr?data=team_gamma",
  },
  {
    id: "team_delta",
    name: "AeroBotics",
    robotName: "SkyHawker",
    organization: "Georgia Tech",
    eventId: "evt_ace_2026",
    qrCodeUrl: "/api/qr?data=team_delta",
  },
  {
    id: "team_epsilon",
    name: "Nexus Mech",
    robotName: "Apex Sentinel",
    organization: "Team ACE Core",
    eventId: "evt_ace_2026",
    qrCodeUrl: "/api/qr?data=team_epsilon",
  },
];

// Initial seeded scores so leaderboard is instantly populated with realistic competition data
const INITIAL_SUBMISSIONS: ScoreSubmission[] = [
  {
    id: "sub_1",
    eventId: "evt_ace_2026",
    teamId: "team_beta",
    judgeId: "usr_judge1",
    judgeName: "Dr. Sarah Chen (Judge 1)",
    criteriaScores: [
      { criterionId: "crit_auto_nav", score: 28 },
      { criterionId: "crit_obstacle", score: 24 },
      { criterionId: "crit_mech_robust", score: 23 },
      { criterionId: "crit_innovation", score: 19 },
    ],
    penalties: 0,
    notes: "Flawless autonomous navigation run.",
    totalWeightedScore: 109.0,
    version: 1,
    deviceId: "device_pad_01",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "sub_2",
    eventId: "evt_ace_2026",
    teamId: "team_alpha",
    judgeId: "usr_judge1",
    judgeName: "Dr. Sarah Chen (Judge 1)",
    criteriaScores: [
      { criterionId: "crit_auto_nav", score: 27 },
      { criterionId: "crit_obstacle", score: 22 },
      { criterionId: "crit_mech_robust", score: 24 },
      { criterionId: "crit_innovation", score: 18 },
    ],
    penalties: 2,
    notes: "Minor perimeter touch on obstacle 3.",
    totalWeightedScore: 103.3,
    version: 1,
    deviceId: "device_pad_01",
    createdAt: new Date(Date.now() - 2400000).toISOString(),
  },
  {
    id: "sub_3",
    eventId: "evt_ace_2026",
    teamId: "team_gamma",
    judgeId: "usr_judge2",
    judgeName: "Marcus Brody (Judge 2)",
    criteriaScores: [
      { criterionId: "crit_auto_nav", score: 25 },
      { criterionId: "crit_obstacle", score: 23 },
      { criterionId: "crit_mech_robust", score: 21 },
      { criterionId: "crit_innovation", score: 17 },
    ],
    penalties: 0,
    notes: "Solid SLAM performance.",
    totalWeightedScore: 99.7,
    version: 1,
    deviceId: "device_pad_02",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "log_init_1",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    action: "SCORE_SUBMITTED",
    actorId: "usr_judge1",
    actorName: "Dr. Sarah Chen",
    actorRole: "judge",
    targetTeamId: "team_beta",
    targetTeamName: "RoboTitans",
    oldValue: null,
    newValue: 109.0,
    details: "Run 1 scored. Autonomous Nav: 28, Obstacle: 24.",
  },
  {
    id: "log_init_2",
    timestamp: new Date(Date.now() - 2400000).toISOString(),
    action: "SCORE_SUBMITTED",
    actorId: "usr_judge1",
    actorName: "Dr. Sarah Chen",
    actorRole: "judge",
    targetTeamId: "team_alpha",
    targetTeamName: "CyberViper",
    oldValue: null,
    newValue: 103.3,
    details: "Run 1 scored with 2 penalty points.",
  },
];

// In-Memory store attached to globalThis so it persists across Next.js API hot-reloads and invocations
declare global {
  // eslint-disable-next-line no-var
  var __ACE_STORE__: {
    users: User[];
    event: CompetitionEvent;
    teams: Team[];
    criteria: ScoringCriterion[];
    submissions: ScoreSubmission[];
    conflicts: ScoreConflict[];
    auditLogs: AuditLogEntry[];
    assignments: JudgeAssignment[];
    sseClients: Set<(data: string) => void>;
  };
}

const INITIAL_ASSIGNMENTS: JudgeAssignment[] = [
  {
    id: "asgn_1",
    judgeId: "usr_judge1",
    judgeName: "Dr. Sarah Chen (Judge 1)",
    teamIds: ["team_alpha", "team_beta", "team_delta"],
    eventId: "evt_ace_2026",
  },
  {
    id: "asgn_2",
    judgeId: "usr_judge2",
    judgeName: "Marcus Brody (Judge 2)",
    teamIds: ["team_gamma", "team_epsilon"],
    eventId: "evt_ace_2026",
  },
];

if (!globalThis.__ACE_STORE__) {
  globalThis.__ACE_STORE__ = {
    users: [...INITIAL_USERS],
    event: { ...INITIAL_EVENT },
    teams: [...INITIAL_TEAMS],
    criteria: [...INITIAL_CRITERIA],
    submissions: [...INITIAL_SUBMISSIONS],
    conflicts: [],
    auditLogs: [...INITIAL_AUDIT_LOGS],
    assignments: [...INITIAL_ASSIGNMENTS],
    sseClients: new Set(),
  };
}

const store = globalThis.__ACE_STORE__;

export const AppStore = {
  getUsers: () => store.users,
  getUserById: (id: string) => store.users.find((u) => u.id === id),
  getEvent: () => store.event,
  updateEvent: (updates: Partial<CompetitionEvent>) => {
    store.event = { ...store.event, ...updates };
    AppStore.notifySSE("EVENT_UPDATED");
    return store.event;
  },
  getTeams: () => store.teams,
  getTeamById: (id: string) => store.teams.find((t) => t.id === id),
  getCriteria: () => store.criteria,
  getCriterionById: (id: string) => store.criteria.find((c) => c.id === id),
  getSubmissions: () => store.submissions,
  getConflicts: () => store.conflicts,
  getAuditLogs: () => [...store.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  getAssignments: () => store.assignments,
  getAssignmentsForJudge: (judgeId: string) => store.assignments.find((a) => a.judgeId === judgeId)?.teamIds || [],
  setAssignment: (judgeId: string, judgeName: string, teamIds: string[]) => {
    const existing = store.assignments.find((a) => a.judgeId === judgeId);
    if (existing) {
      existing.teamIds = teamIds;
    } else {
      store.assignments.push({
        id: `asgn_${Date.now()}`,
        judgeId,
        judgeName,
        teamIds,
        eventId: "evt_ace_2026",
      });
    }
    AppStore.notifySSE("ASSIGNMENT_UPDATED");
  },

  // One-click simulated conflict generator (for demo review / testing on demand!)
  createSimulatedConflict: (): ScoreConflict => {
    const conflict: ScoreConflict = {
      id: `conf_sim_${Date.now()}`,
      teamId: "team_beta",
      teamName: "RoboTitans",
      criterionId: "crit_auto_nav",
      criterionName: "Autonomous Navigation",
      existingScore: {
        judgeId: "usr_judge1",
        judgeName: "Dr. Sarah Chen (Judge 1)",
        score: 28.0,
        timestamp: new Date(Date.now() - 120000).toISOString(),
        version: 1,
      },
      incomingScore: {
        judgeId: "usr_judge1",
        judgeName: "Dr. Sarah Chen (Judge 1 - Tablet B)",
        score: 22.0,
        timestamp: new Date().toISOString(),
        version: 2,
      },
      status: "pending",
    };

    store.conflicts.push(conflict);
    AppStore.addAuditLog({
      action: "SCORE_SUBMITTED",
      actorId: "usr_judge1",
      actorName: "Dr. Sarah Chen",
      actorRole: "judge",
      targetTeamId: "team_beta",
      targetTeamName: "RoboTitans",
      oldValue: 28.0,
      newValue: 22.0,
      details: "CONCURRENCY CONFLICT DETECTED between Offline Tablet A (28.0) and Offline Tablet B (22.0).",
    });

    AppStore.notifySSE("CONFLICT_DETECTED");
    return conflict;
  },

  // Add / Update Criteria (Admin Core Feature)
  addCriterion: (criterion: Omit<ScoringCriterion, "id">): ScoringCriterion => {
    const newCriterion: ScoringCriterion = {
      ...criterion,
      id: `crit_${Date.now()}`,
    };
    store.criteria.push(newCriterion);

    AppStore.addAuditLog({
      action: "CRITERIA_MODIFIED",
      actorId: "usr_admin",
      actorName: "Admin",
      actorRole: "admin",
      targetTeamId: "all",
      targetTeamName: "Competition Criteria",
      oldValue: null,
      newValue: `${newCriterion.name} (wt: ${newCriterion.weight})`,
      details: `Added new judging criterion "${newCriterion.name}" with max score ${newCriterion.maxScore} and weight ${newCriterion.weight}`,
    });

    AppStore.notifySSE("CRITERIA_UPDATED");
    return newCriterion;
  },

  updateCriterion: (id: string, updates: Partial<ScoringCriterion>): ScoringCriterion | null => {
    const index = store.criteria.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const oldCrit = store.criteria[index];
    const updated = { ...oldCrit, ...updates };
    store.criteria[index] = updated;

    AppStore.addAuditLog({
      action: "CRITERIA_MODIFIED",
      actorId: "usr_admin",
      actorName: "Admin",
      actorRole: "admin",
      targetTeamId: "all",
      targetTeamName: "Competition Criteria",
      oldValue: `${oldCrit.name} (wt: ${oldCrit.weight})`,
      newValue: `${updated.name} (wt: ${updated.weight})`,
      details: `Updated judging criterion "${updated.name}"`,
    });

    AppStore.notifySSE("CRITERIA_UPDATED");
    return updated;
  },

  deleteCriterion: (id: string): boolean => {
    const index = store.criteria.findIndex((c) => c.id === id);
    if (index === -1) return false;
    const removed = store.criteria.splice(index, 1)[0];

    AppStore.addAuditLog({
      action: "CRITERIA_MODIFIED",
      actorId: "usr_admin",
      actorName: "Admin",
      actorRole: "admin",
      targetTeamId: "all",
      targetTeamName: "Competition Criteria",
      oldValue: removed.name,
      newValue: "DELETED",
      details: `Deleted criterion "${removed.name}"`,
    });

    AppStore.notifySSE("CRITERIA_UPDATED");
    return true;
  },

  // Teams Management
  addTeam: (team: Omit<Team, "id" | "qrCodeUrl">): Team => {
    const newId = `team_${Date.now()}`;
    const newTeam: Team = {
      ...team,
      id: newId,
      qrCodeUrl: `/api/qr?data=${newId}`,
    };
    store.teams.push(newTeam);
    AppStore.notifySSE("TEAM_ADDED");
    return newTeam;
  },

  // Add / Sync Score with Conflict Detection and 2-Sigma Anomaly Detection
  submitScore: (
    data: {
      eventId: string;
      teamId: string;
      judgeId: string;
      judgeName: string;
      criteriaScores: { criterionId: string; score: number }[];
      penalties?: number;
      notes?: string;
      version?: number;
      deviceId?: string;
      clientTimestamp?: string;
    }
  ): { submission: ScoreSubmission; conflict?: ScoreConflict; isAnomaly: boolean } => {
    const team = AppStore.getTeamById(data.teamId);
    if (!team) throw new Error("Team not found");

    const penalties = data.penalties || 0;
    const totalWeighted = calculateWeightedScore(
      data.criteriaScores,
      store.criteria,
      penalties
    );

    const version = data.version || 1;
    const deviceId = data.deviceId || "web-client";
    const timestamp = data.clientTimestamp || new Date().toISOString();

    // Check for CONFLICT:
    // If another submission exists for this team by a different judge or device within a short window
    // with differing scores for the same criteria
    const existingSubmission = store.submissions.find(
      (s) => s.teamId === data.teamId && s.judgeId === data.judgeId
    );

    if (existingSubmission && existingSubmission.deviceId !== deviceId) {
      // Different device edited same judge score offline! Explicit conflict!
      const conflict: ScoreConflict = {
        id: `conf_${Date.now()}`,
        teamId: team.id,
        teamName: team.name,
        criterionId: "composite",
        criterionName: "Overall Run Score",
        existingScore: {
          judgeId: existingSubmission.judgeId,
          judgeName: existingSubmission.judgeName,
          score: existingSubmission.totalWeightedScore,
          timestamp: existingSubmission.createdAt,
          version: existingSubmission.version,
        },
        incomingScore: {
          judgeId: data.judgeId,
          judgeName: data.judgeName,
          score: totalWeighted,
          timestamp,
          version,
        },
        status: "pending",
      };

      store.conflicts.push(conflict);

      AppStore.addAuditLog({
        action: "SCORE_SUBMITTED",
        actorId: data.judgeId,
        actorName: data.judgeName,
        actorRole: "judge",
        targetTeamId: team.id,
        targetTeamName: team.name,
        oldValue: existingSubmission.totalWeightedScore,
        newValue: totalWeighted,
        details: `CONCURRENCY CONFLICT DETECTED between devices "${existingSubmission.deviceId}" and "${deviceId}". Sent to Conflict Center.`,
      });

      AppStore.notifySSE("CONFLICT_DETECTED");
      return { submission: existingSubmission, conflict, isAnomaly: false };
    }

    const submission: ScoreSubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      eventId: data.eventId,
      teamId: data.teamId,
      judgeId: data.judgeId,
      judgeName: data.judgeName,
      criteriaScores: data.criteriaScores,
      penalties,
      notes: data.notes,
      totalWeightedScore: totalWeighted,
      version,
      deviceId,
      createdAt: timestamp,
      syncedAt: new Date().toISOString(),
    };

    store.submissions.push(submission);

    // Run 2-Sigma Anomaly Detection across all judge scores for this team
    const teamSubs = store.submissions.filter((s) => s.teamId === data.teamId);
    const anomalies = detectAnomalies(teamSubs);
    const thisAnomaly = anomalies.find((a) => a.submissionId === submission.id);

    if (thisAnomaly && thisAnomaly.isAnomaly) {
      submission.isAnomaly = true;
      submission.anomalyReason = thisAnomaly.reason;
    }

    // Record Audit Log
    AppStore.addAuditLog({
      action: existingSubmission ? "SCORE_UPDATED" : "SCORE_SUBMITTED",
      actorId: data.judgeId,
      actorName: data.judgeName,
      actorRole: "judge",
      targetTeamId: team.id,
      targetTeamName: team.name,
      oldValue: existingSubmission ? existingSubmission.totalWeightedScore : null,
      newValue: totalWeighted,
      details: submission.isAnomaly
        ? `[ANOMALY FLAG] ${submission.anomalyReason}`
        : `Submitted score (${totalWeighted.toFixed(2)} pts). Penalties: ${penalties}.`,
    });

    // Notify all live leaderboard listeners (< 2s update requirement!)
    AppStore.notifySSE("SCORE_SUBMITTED");

    return {
      submission,
      isAnomaly: Boolean(submission.isAnomaly),
    };
  },

  // Resolve a detected conflict
  resolveConflict: (
    conflictId: string,
    policy: "average" | "keep_existing" | "keep_incoming" | "manual",
    resolvedBy: string,
    manualValue?: number
  ): ScoreConflict | null => {
    const conflict = store.conflicts.find((c) => c.id === conflictId);
    if (!conflict) return null;

    let finalValue = conflict.incomingScore.score;
    if (policy === "average") {
      finalValue = Number(
        ((conflict.existingScore.score + conflict.incomingScore.score) / 2).toFixed(2)
      );
    } else if (policy === "keep_existing") {
      finalValue = conflict.existingScore.score;
    } else if (policy === "manual" && manualValue !== undefined) {
      finalValue = manualValue;
    }

    conflict.status = "resolved";
    conflict.resolutionPolicy = policy;
    conflict.resolvedValue = finalValue;
    conflict.resolvedBy = resolvedBy;
    conflict.resolvedAt = new Date().toISOString();

    // Create a synthesized resolved submission
    const existingIndex = store.submissions.findIndex(
      (s) => s.teamId === conflict.teamId && s.judgeId === conflict.incomingScore.judgeId
    );

    if (existingIndex !== -1) {
      store.submissions[existingIndex].totalWeightedScore = finalValue;
    }

    AppStore.addAuditLog({
      action: "CONFLICT_RESOLVED",
      actorId: resolvedBy,
      actorName: "Admin Resolver",
      actorRole: "admin",
      targetTeamId: conflict.teamId,
      targetTeamName: conflict.teamName,
      oldValue: `${conflict.existingScore.score} vs ${conflict.incomingScore.score}`,
      newValue: finalValue,
      details: `Conflict resolved via policy "${policy}". Applied score: ${finalValue}`,
    });

    AppStore.notifySSE("CONFLICT_RESOLVED");
    return conflict;
  },

  // Leaderboard generator
  getLeaderboard: (): TeamLeaderboardEntry[] => {
    return generateLeaderboard(store.teams, store.submissions, store.criteria);
  },

  // Audit Log helper
  addAuditLog: (entry: Omit<AuditLogEntry, "id" | "timestamp">) => {
    const log: AuditLogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    store.auditLogs.unshift(log);
    // Keep last 500 logs in memory
    if (store.auditLogs.length > 500) {
      store.auditLogs.pop();
    }
  },

  // SSE real-time broadcast (< 2s update)
  addSSEClient: (send: (data: string) => void) => {
    store.sseClients.add(send);
    return () => {
      store.sseClients.delete(send);
    };
  },

  notifySSE: (eventType: string) => {
    const leaderboard = AppStore.getLeaderboard();
    const payload = JSON.stringify({
      type: eventType,
      timestamp: Date.now(),
      leaderboard,
    });
    store.sseClients.forEach((client) => {
      try {
        client(payload);
      } catch {
        store.sseClients.delete(client);
      }
    });
  },

  // Generate CSV data for export
  generateCSVExport: (): string => {
    const leaderboard = AppStore.getLeaderboard();
    const criteria = store.criteria;

    // Header row
    const headers = [
      "Rank",
      "Team Name",
      "Robot Name",
      "Organization",
      "Total Score",
      "Raw Score",
      "Penalties",
      ...criteria.map((c) => `${c.name} (wt ${c.weight})`),
      "Tie-Break Note",
    ];

    const rows = leaderboard.map((row) => [
      row.rank,
      `"${row.team.name}"`,
      `"${row.team.robotName}"`,
      `"${row.team.organization}"`,
      row.totalScore,
      row.rawTotal,
      row.penalties,
      ...criteria.map((c) => row.scoresByCriterion[c.id] ?? 0),
      `"${row.tieBreakReason || "Standard ranking"}"`,
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  },
};
