import {
  ScoringCriterion,
  ScoreSubmission,
  Team,
  TeamLeaderboardEntry,
} from "@/types";

/**
 * Calculates the total weighted score for a single submission
 */
export function calculateWeightedScore(
  criteriaScores: { criterionId: string; score: number }[],
  criteriaList: ScoringCriterion[],
  penalties: number = 0
): number {
  const criteriaMap = new Map(criteriaList.map((c) => [c.id, c]));
  let weightedSum = 0;

  for (const cs of criteriaScores) {
    const criterion = criteriaMap.get(cs.criterionId);
    const weight = criterion ? criterion.weight : 1.0;
    weightedSum += cs.score * weight;
  }

  const finalScore = Math.max(0, weightedSum - penalties);
  return Number(finalScore.toFixed(2));
}

/**
 * Detects 2-sigma anomalies across multiple judge submissions for the same team
 * "Flag a judge whose scores deviate more than 2σ from the panel mean for the same run."
 */
export function detectAnomalies(
  submissions: ScoreSubmission[]
): { submissionId: string; isAnomaly: boolean; reason?: string; zScore: number }[] {
  if (submissions.length < 2) {
    return submissions.map((s) => ({
      submissionId: s.id,
      isAnomaly: false,
      zScore: 0,
    }));
  }

  const scores = submissions.map((s) => s.totalWeightedScore);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Calculate standard deviation (sigma)
  const variance =
    scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) /
    scores.length;
  const sigma = Math.sqrt(variance);

  // If variance is 0 (all judges gave same score), no anomalies
  if (sigma === 0) {
    return submissions.map((s) => ({
      submissionId: s.id,
      isAnomaly: false,
      zScore: 0,
    }));
  }

  return submissions.map((s) => {
    // If score is within 5 points of the overall mean, it is never an anomaly
    if (Math.abs(s.totalWeightedScore - mean) <= 5.0) {
      return {
        submissionId: s.id,
        isAnomaly: false,
        zScore: 0,
      };
    }

    // Leave-one-out panel consensus: compare current judge with consensus of remaining judges
    const others = submissions.filter((o) => o.id !== s.id);
    let isAnomaly = false;
    let zScore = 0;

    if (others.length >= 2) {
      const otherScores = others.map((o) => o.totalWeightedScore);
      const otherMean = otherScores.reduce((a, b) => a + b, 0) / otherScores.length;
      const otherVariance =
        otherScores.reduce((acc, score) => acc + Math.pow(score - otherMean, 2), 0) /
        otherScores.length;
      const otherSigma = Math.sqrt(otherVariance);

      if (otherSigma > 0) {
        zScore = Number((Math.abs(s.totalWeightedScore - otherMean) / otherSigma).toFixed(2));
        isAnomaly = zScore > 2.0;
      } else if (Math.abs(s.totalWeightedScore - otherMean) > 10) {
        // All other judges agreed exactly, but this judge diverged by > 10 pts
        zScore = 99.0;
        isAnomaly = true;
      }
    } else {
      const deviation = Math.abs(s.totalWeightedScore - mean);
      zScore = Number((deviation / sigma).toFixed(2));
      isAnomaly = zScore > 2.0 || (submissions.length <= 4 && zScore >= 1.5);
    }

    let reason: string | undefined;
    if (isAnomaly) {
      reason = `Score (${s.totalWeightedScore}) deviates ${zScore}σ from panel consensus (mean=${mean.toFixed(
        1
      )}, σ=${sigma.toFixed(1)})`;
    }

    return {
      submissionId: s.id,
      isAnomaly,
      reason,
      zScore,
    };
  });
}

/**
 * Computes the aggregated leaderboard with deterministic tie-break rules
 */
export function generateLeaderboard(
  teams: Team[],
  submissions: ScoreSubmission[],
  criteriaList: ScoringCriterion[]
): TeamLeaderboardEntry[] {
  // Find highest weighted criterion for tie-break
  const sortedCriteria = [...criteriaList].sort((a, b) => b.weight - a.weight);
  const highestWeightedCriterion = sortedCriteria[0];

  // Group submissions by team
  const teamSubmissionsMap = new Map<string, ScoreSubmission[]>();
  for (const team of teams) {
    teamSubmissionsMap.set(team.id, []);
  }

  for (const sub of submissions) {
    const list = teamSubmissionsMap.get(sub.teamId);
    if (list) {
      list.push(sub);
    }
  }

  const entries: TeamLeaderboardEntry[] = [];

  for (const team of teams) {
    const subs = teamSubmissionsMap.get(team.id) || [];
    const runsCount = subs.length;

    if (runsCount === 0) {
      entries.push({
        rank: 0,
        team,
        totalScore: 0,
        rawTotal: 0,
        penalties: 0,
        runsCount: 0,
        scoresByCriterion: {},
        highestWeightedCriterionScore: 0,
        varianceScore: 0,
        lastUpdated: new Date().toISOString(),
      });
      continue;
    }

    // Average total score across submissions
    const totalWeightedScores = subs.map((s) => s.totalWeightedScore);
    const avgTotalScore =
      totalWeightedScores.reduce((a, b) => a + b, 0) / runsCount;

    const totalPenalties = subs.reduce((a, b) => a + b.penalties, 0) / runsCount;

    // Average score by criterion
    const criterionAverages: Record<string, number> = {};
    for (const c of criteriaList) {
      let sum = 0;
      let count = 0;
      for (const s of subs) {
        const found = s.criteriaScores.find((cs) => cs.criterionId === c.id);
        if (found) {
          sum += found.score;
          count++;
        }
      }
      criterionAverages[c.id] = count > 0 ? Number((sum / count).toFixed(1)) : 0;
    }

    // Highest weighted criterion average
    const highestCritScore = highestWeightedCriterion
      ? criterionAverages[highestWeightedCriterion.id] || 0
      : 0;

    // Judge variance (lower is more consistent)
    const mean = avgTotalScore;
    const variance =
      runsCount > 1
        ? subs.reduce((acc, s) => acc + Math.pow(s.totalWeightedScore - mean, 2), 0) /
          runsCount
        : 0;

    const latestSubmissionTime = subs.reduce((latest, s) => {
      const t = new Date(s.createdAt).getTime();
      return t > latest ? t : latest;
    }, 0);

    entries.push({
      rank: 0,
      team,
      totalScore: Number(avgTotalScore.toFixed(2)),
      rawTotal: Number(
        subs.reduce((acc, s) => {
          const rawSum = s.criteriaScores.reduce((cAcc, cs) => cAcc + cs.score, 0);
          return acc + rawSum;
        }, 0) / runsCount
      ).toFixed(1) as unknown as number,
      penalties: Number(totalPenalties.toFixed(1)),
      runsCount,
      scoresByCriterion: criterionAverages,
      highestWeightedCriterionScore: highestCritScore,
      varianceScore: Number(Math.sqrt(variance).toFixed(2)),
      lastUpdated:
        latestSubmissionTime > 0
          ? new Date(latestSubmissionTime).toISOString()
          : new Date().toISOString(),
    });
  }

  // TIE-BREAK SORTING ALGORITHM:
  // 1. Total Score (descending)
  // 2. Highest weighted criterion score (descending)
  // 3. Lowest penalties (ascending)
  // 4. Lowest variance (consistency)
  entries.sort((a, b) => {
    // Both haven't scored yet
    if (a.runsCount === 0 && b.runsCount === 0) return a.team.name.localeCompare(b.team.name);
    if (a.runsCount === 0) return 1;
    if (b.runsCount === 0) return -1;

    // 1. Total score
    if (Math.abs(b.totalScore - a.totalScore) > 0.001) {
      return b.totalScore - a.totalScore;
    }

    // 2. Tie-break: Highest-weighted criterion
    if (
      Math.abs(
        b.highestWeightedCriterionScore - a.highestWeightedCriterionScore
      ) > 0.001
    ) {
      a.tieBreakReason = `Tie broken by higher score in ${highestWeightedCriterion?.name || "top criterion"} (${a.highestWeightedCriterionScore} vs ${b.highestWeightedCriterionScore})`;
      b.tieBreakReason = `Tie broken by higher score in ${highestWeightedCriterion?.name || "top criterion"} (${b.highestWeightedCriterionScore} vs ${a.highestWeightedCriterionScore})`;
      return b.highestWeightedCriterionScore - a.highestWeightedCriterionScore;
    }

    // 3. Tie-break: Fewer penalties
    if (Math.abs(a.penalties - b.penalties) > 0.001) {
      a.tieBreakReason = `Tie broken by lower penalty deductions (${a.penalties} vs ${b.penalties})`;
      b.tieBreakReason = `Tie broken by lower penalty deductions (${b.penalties} vs ${a.penalties})`;
      return a.penalties - b.penalties;
    }

    // 4. Tie-break: Lower judge variance
    if (Math.abs(a.varianceScore - b.varianceScore) > 0.001) {
      a.tieBreakReason = `Tie broken by panel score consistency (σ=${a.varianceScore} vs σ=${b.varianceScore})`;
      b.tieBreakReason = `Tie broken by panel score consistency (σ=${b.varianceScore} vs σ=${a.varianceScore})`;
      return a.varianceScore - b.varianceScore;
    }

    return 0;
  });

  // Assign 1-based ranks
  return entries.map((entry, index) => ({
    ...entry,
    rank: entry.runsCount > 0 ? index + 1 : 999,
  }));
}
