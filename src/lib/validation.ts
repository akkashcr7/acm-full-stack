import { z } from "zod";
import { ScoringCriterion } from "@/types";

export const CriterionScoreSchema = z.object({
  criterionId: z.string().min(1, "Criterion ID is required"),
  score: z.number().min(0, "Score cannot be negative"),
});

export const ScoreSubmissionSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  teamId: z.string().min(1, "Team ID is required"),
  judgeId: z.string().min(1, "Judge ID is required"),
  judgeName: z.string().min(1, "Judge Name is required"),
  criteriaScores: z.array(CriterionScoreSchema).min(1, "At least one criterion score is required"),
  penalties: z.number().min(0, "Penalties cannot be negative").default(0),
  notes: z.string().optional(),
  version: z.number().int().min(1).default(1),
  deviceId: z.string().default("web-client"),
});

export const BatchSyncSchema = z.object({
  scores: z.array(ScoreSubmissionSchema),
});

export const ConflictResolutionSchema = z.object({
  conflictId: z.string().min(1, "Conflict ID is required"),
  resolutionPolicy: z.enum(["average", "keep_existing", "keep_incoming", "manual"]),
  manualValue: z.number().min(0).optional(),
  resolvedBy: z.string().min(1, "Resolver ID is required"),
});

export const CriterionCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().default(""),
  maxScore: z.number().positive("Max score must be greater than 0"),
  weight: z.number().positive("Weight must be greater than 0"),
  category: z.enum(["autonomous", "teleop", "design", "innovation", "general"]),
  eventId: z.string().min(1, "Event ID is required"),
});

/**
 * Validates criteria scores against dynamic max score definitions
 */
export function validateScoresAgainstCriteria(
  criteriaScores: { criterionId: string; score: number }[],
  criteriaList: ScoringCriterion[]
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const criteriaMap = new Map(criteriaList.map((c) => [c.id, c]));

  for (const cs of criteriaScores) {
    const criterion = criteriaMap.get(cs.criterionId);
    if (!criterion) {
      errors[cs.criterionId] = `Unknown criterion ID: ${cs.criterionId}`;
      continue;
    }
    if (cs.score < 0) {
      errors[cs.criterionId] = `Score cannot be less than 0`;
    } else if (cs.score > criterion.maxScore) {
      errors[cs.criterionId] = `Score cannot exceed maximum of ${criterion.maxScore}`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
