import { describe, it, expect } from "vitest";
import { AppStore } from "@/lib/store";
import {
  calculateWeightedScore,
  detectAnomalies,
  generateLeaderboard,
} from "@/lib/scoring";
import {
  validateScoresAgainstCriteria,
  ScoreSubmissionSchema,
  CriterionCreateSchema,
} from "@/lib/validation";
import { ScoringCriterion, ScoreSubmission, Team } from "@/types";

describe("Team ACE Competition Judging Platform - 15+ Unit & API Tests", () => {
  const mockCriteria: ScoringCriterion[] = [
    {
      id: "crit_nav",
      name: "Autonomous Navigation",
      description: "Path accuracy",
      maxScore: 30,
      weight: 1.5,
      category: "autonomous",
      eventId: "test_event",
    },
    {
      id: "crit_obs",
      name: "Obstacle Course",
      description: "Clearance time",
      maxScore: 20,
      weight: 1.0,
      category: "teleop",
      eventId: "test_event",
    },
    {
      id: "crit_mech",
      name: "Mechanical Design",
      description: "Structural integrity",
      maxScore: 10,
      weight: 0.5,
      category: "design",
      eventId: "test_event",
    },
  ];

  const mockTeams: Team[] = [
    {
      id: "team_1",
      name: "Team Alpha",
      robotName: "AlphaBot",
      organization: "ACE Lab",
      eventId: "test_event",
      qrCodeUrl: "",
    },
    {
      id: "team_2",
      name: "Team Beta",
      robotName: "BetaBot",
      organization: "ACE Lab",
      eventId: "test_event",
      qrCodeUrl: "",
    },
  ];

  // Test 1: Event and Teams retrieval
  it("Test 1: AppStore should provide valid event metadata and teams", () => {
    const event = AppStore.getEvent();
    expect(event).toBeDefined();
    expect(event.name).toContain("Team ACE");
    AppStore.addTeam({
      name: "CyberViper",
      robotName: "Viper-X Mk IV",
      organization: "MIT Robotics Lab",
      eventId: event.id,
    });
    AppStore.addTeam({
      name: "RoboTitans",
      robotName: "Atlas Prime",
      organization: "Stanford Robotics",
      eventId: event.id,
    });
    const teams = AppStore.getTeams();
    expect(teams.length).toBeGreaterThanOrEqual(2);
  });

  // Test 2: Criteria retrieval & weighting
  it("Test 2: AppStore should provide criteria with valid positive weights", () => {
    const criteria = AppStore.getCriteria();
    expect(criteria.length).toBeGreaterThanOrEqual(3);
    for (const c of criteria) {
      expect(c.weight).toBeGreaterThan(0);
      expect(c.maxScore).toBeGreaterThan(0);
    }
  });

  // Test 3: Weighted score calculation
  it("Test 3: calculateWeightedScore should correctly apply criterion weights", () => {
    // 20 * 1.5 + 15 * 1.0 + 10 * 0.5 = 30 + 15 + 5 = 50.0
    const score = calculateWeightedScore(
      [
        { criterionId: "crit_nav", score: 20 },
        { criterionId: "crit_obs", score: 15 },
        { criterionId: "crit_mech", score: 10 },
      ],
      mockCriteria,
      0
    );
    expect(score).toBe(50.0);
  });

  // Test 4: Penalty deduction
  it("Test 4: calculateWeightedScore should deduct penalty points properly", () => {
    // 50.0 - 5 = 45.0
    const score = calculateWeightedScore(
      [
        { criterionId: "crit_nav", score: 20 },
        { criterionId: "crit_obs", score: 15 },
        { criterionId: "crit_mech", score: 10 },
      ],
      mockCriteria,
      5
    );
    expect(score).toBe(45.0);
  });

  // Test 5: Dynamic server-side validation against maxScore
  it("Test 5: validateScoresAgainstCriteria should fail if score exceeds maxScore", () => {
    const result = validateScoresAgainstCriteria(
      [
        { criterionId: "crit_nav", score: 35 }, // max is 30!
      ],
      mockCriteria
    );
    expect(result.valid).toBe(false);
    expect(result.errors["crit_nav"]).toBeDefined();
    expect(result.errors["crit_nav"]).toContain("cannot exceed maximum of 30");
  });

  // Test 6: Dynamic validation rejects negative scores
  it("Test 6: validateScoresAgainstCriteria should fail if score is negative", () => {
    const result = validateScoresAgainstCriteria(
      [{ criterionId: "crit_obs", score: -2 }],
      mockCriteria
    );
    expect(result.valid).toBe(false);
    expect(result.errors["crit_obs"]).toContain("cannot be less than 0");
  });

  // Test 7: Zod schema rejects malformed score submission
  it("Test 7: ScoreSubmissionSchema should reject empty teamId or empty criteriaScores", () => {
    const invalidData = {
      eventId: "e1",
      teamId: "",
      judgeId: "j1",
      judgeName: "Judge One",
      criteriaScores: [],
    };
    const parsed = ScoreSubmissionSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  // Test 8: Zod schema validates criterion creation
  it("Test 8: CriterionCreateSchema should validate newly defined judging criteria", () => {
    const validCriterion = {
      name: "Sensing & Perception",
      description: "LiDAR and Camera reliability",
      maxScore: 25,
      weight: 1.25,
      category: "autonomous",
      eventId: "evt_1",
    };
    const parsed = CriterionCreateSchema.safeParse(validCriterion);
    expect(parsed.success).toBe(true);
  });

  // Test 9: 2-Sigma Anomaly Detection flags statistical outlier
  it("Test 9: detectAnomalies should flag a judge deviating more than 2-sigma from panel mean", () => {
    const submissions: ScoreSubmission[] = [
      {
        id: "s1",
        eventId: "e1",
        teamId: "t1",
        judgeId: "j1",
        judgeName: "Judge 1",
        criteriaScores: [],
        penalties: 0,
        totalWeightedScore: 80,
        version: 1,
        deviceId: "d1",
        createdAt: new Date().toISOString(),
      },
      {
        id: "s2",
        eventId: "e1",
        teamId: "t1",
        judgeId: "j2",
        judgeName: "Judge 2",
        criteriaScores: [],
        penalties: 0,
        totalWeightedScore: 82,
        version: 1,
        deviceId: "d2",
        createdAt: new Date().toISOString(),
      },
      {
        id: "s3",
        eventId: "e1",
        teamId: "t1",
        judgeId: "j3",
        judgeName: "Judge 3",
        criteriaScores: [],
        penalties: 0,
        totalWeightedScore: 81,
        version: 1,
        deviceId: "d3",
        createdAt: new Date().toISOString(),
      },
      {
        id: "s4",
        eventId: "e1",
        teamId: "t1",
        judgeId: "j_rogue",
        judgeName: "Rogue Judge",
        criteriaScores: [],
        penalties: 0,
        totalWeightedScore: 10, // extreme outlier!
        version: 1,
        deviceId: "d4",
        createdAt: new Date().toISOString(),
      },
    ];

    const anomalies = detectAnomalies(submissions);
    const rogue = anomalies.find((a) => a.submissionId === "s4");
    expect(rogue?.isAnomaly).toBe(true);
    expect(rogue?.zScore).toBeGreaterThan(2.0);
  });

  // Test 10: 2-Sigma Anomaly does NOT flag consistent scores
  it("Test 10: detectAnomalies should not flag judges when scores are consistent", () => {
    const submissions: ScoreSubmission[] = [
      {
        id: "s1",
        eventId: "e1",
        teamId: "t1",
        judgeId: "j1",
        judgeName: "Judge 1",
        criteriaScores: [],
        penalties: 0,
        totalWeightedScore: 80,
        version: 1,
        deviceId: "d1",
        createdAt: new Date().toISOString(),
      },
      {
        id: "s2",
        eventId: "e1",
        teamId: "t1",
        judgeId: "j2",
        judgeName: "Judge 2",
        criteriaScores: [],
        penalties: 0,
        totalWeightedScore: 82,
        version: 1,
        deviceId: "d2",
        createdAt: new Date().toISOString(),
      },
      {
        id: "s3",
        eventId: "e1",
        teamId: "t1",
        judgeId: "j3",
        judgeName: "Judge 3",
        criteriaScores: [],
        penalties: 0,
        totalWeightedScore: 81,
        version: 1,
        deviceId: "d3",
        createdAt: new Date().toISOString(),
      },
    ];

    const anomalies = detectAnomalies(submissions);
    for (const a of anomalies) {
      expect(a.isAnomaly).toBe(false);
    }
  });

  // Test 11: Tie-break Rule 1: Higher score in highest-weighted criterion
  it("Test 11: generateLeaderboard should break tie using highest-weighted criterion", () => {
    // Both teams total 50 points, but Team 1 scored higher in crit_nav (weight 1.5)
    const subTeam1: ScoreSubmission = {
      id: "sub_t1",
      eventId: "test_event",
      teamId: "team_1",
      judgeId: "j1",
      judgeName: "Judge 1",
      criteriaScores: [
        { criterionId: "crit_nav", score: 25 }, // Higher in top criterion
        { criterionId: "crit_obs", score: 10 },
        { criterionId: "crit_mech", score: 5 },
      ],
      penalties: 0,
      totalWeightedScore: 50.0,
      version: 1,
      deviceId: "d1",
      createdAt: new Date().toISOString(),
    };

    const subTeam2: ScoreSubmission = {
      id: "sub_t2",
      eventId: "test_event",
      teamId: "team_2",
      judgeId: "j1",
      judgeName: "Judge 1",
      criteriaScores: [
        { criterionId: "crit_nav", score: 15 }, // Lower in top criterion
        { criterionId: "crit_obs", score: 25 },
        { criterionId: "crit_mech", score: 5 },
      ],
      penalties: 0,
      totalWeightedScore: 50.0,
      version: 1,
      deviceId: "d1",
      createdAt: new Date().toISOString(),
    };

    const leaderboard = generateLeaderboard(mockTeams, [subTeam1, subTeam2], mockCriteria);
    expect(leaderboard[0].team.id).toBe("team_1");
    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[1].team.id).toBe("team_2");
    expect(leaderboard[1].rank).toBe(2);
    expect(leaderboard[0].tieBreakReason).toContain("Autonomous Navigation");
  });

  // Test 12: Tie-break Rule 2: Fewer penalties
  it("Test 12: generateLeaderboard should break tie using lower penalties when criterion scores match", () => {
    const subTeam1: ScoreSubmission = {
      id: "sub_t1_p",
      eventId: "test_event",
      teamId: "team_1",
      judgeId: "j1",
      judgeName: "Judge 1",
      criteriaScores: [
        { criterionId: "crit_nav", score: 20 },
        { criterionId: "crit_obs", score: 20 },
        { criterionId: "crit_mech", score: 10 },
      ],
      penalties: 0, // 0 penalties
      totalWeightedScore: 55.0,
      version: 1,
      deviceId: "d1",
      createdAt: new Date().toISOString(),
    };

    const subTeam2: ScoreSubmission = {
      id: "sub_t2_p",
      eventId: "test_event",
      teamId: "team_2",
      judgeId: "j1",
      judgeName: "Judge 1",
      criteriaScores: [
        { criterionId: "crit_nav", score: 20 },
        { criterionId: "crit_obs", score: 20 },
        { criterionId: "crit_mech", score: 10 },
      ],
      penalties: 3, // 3 penalties
      totalWeightedScore: 55.0,
      version: 1,
      deviceId: "d1",
      createdAt: new Date().toISOString(),
    };

    const leaderboard = generateLeaderboard(mockTeams, [subTeam1, subTeam2], mockCriteria);
    expect(leaderboard[0].team.id).toBe("team_1");
    expect(leaderboard[0].tieBreakReason).toContain("penalty deductions");
  });

  // Test 13: Conflict detection between multiple devices
  it("Test 13: AppStore should detect concurrency conflict when different devices submit divergent scores", () => {
    let team = AppStore.getTeams().find((t) => t.id === "team_delta");
    if (!team) {
      team = AppStore.addTeam({
        name: "AeroBotics",
        robotName: "SkyHawker",
        organization: "Georgia Tech",
        eventId: "evt_ace_2026",
      });
    }
    const res1 = AppStore.submitScore({
      eventId: "evt_ace_2026",
      teamId: team.id,
      judgeId: "usr_judge1",
      judgeName: "Dr. Sarah Chen",
      criteriaScores: [{ criterionId: "crit_auto_nav", score: 20 }],
      deviceId: "device_tablet_A",
    });
    expect(res1.conflict).toBeUndefined();

    // Now tablet B submits a divergent score for the same judge & team
    const res2 = AppStore.submitScore({
      eventId: "evt_ace_2026",
      teamId: team.id,
      judgeId: "usr_judge1",
      judgeName: "Dr. Sarah Chen",
      criteriaScores: [{ criterionId: "crit_auto_nav", score: 28 }],
      deviceId: "device_phone_B",
    });

    expect(res2.conflict).toBeDefined();
    expect(res2.conflict?.status).toBe("pending");
  });

  // Test 14: Conflict resolution via "average" policy
  it("Test 14: AppStore should resolve conflict via 'average' policy and log to audit", () => {
    const conflicts = AppStore.getConflicts();
    const pending = conflicts.find((c) => c.status === "pending");
    expect(pending).toBeDefined();

    if (pending) {
      const resolved = AppStore.resolveConflict(
        pending.id,
        "average",
        "usr_admin"
      );
      expect(resolved?.status).toBe("resolved");
      expect(resolved?.resolutionPolicy).toBe("average");
      expect(resolved?.resolvedValue).toBeDefined();
    }
  });

  // Test 15: Audit Trail logging
  it("Test 15: AppStore should record every score and conflict resolution in Audit Log", () => {
    const logs = AppStore.getAuditLogs();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].timestamp).toBeDefined();
    expect(logs[0].actorRole).toBeDefined();
    expect(logs[0].action).toMatch(/SCORE_SUBMITTED|SCORE_UPDATED|CONFLICT_RESOLVED|CRITERIA_MODIFIED/);
  });

  // Test 16: CSV Export format
  it("Test 16: AppStore should generate valid CSV export with headers and team rankings", () => {
    const csv = AppStore.generateCSVExport();
    expect(csv).toContain("Rank,Team Name,Robot Name,Organization,Total Score");
    expect(csv).toContain("CyberViper");
  });
});
