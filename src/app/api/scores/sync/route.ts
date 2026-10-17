import { NextResponse } from "next/server";
import { AppStore } from "@/lib/store";
import { BatchSyncSchema, validateScoresAgainstCriteria } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = BatchSyncSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Batch sync validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const criteria = AppStore.getCriteria();
    let syncedCount = 0;
    let conflictsCount = 0;
    const errors: string[] = [];

    for (const item of parsed.data.scores) {
      const valResult = validateScoresAgainstCriteria(item.criteriaScores, criteria);
      if (!valResult.valid) {
        errors.push(`Team ${item.teamId}: score validation failed`);
        continue;
      }

      try {
        const res = AppStore.submitScore({
          eventId: item.eventId,
          teamId: item.teamId,
          judgeId: item.judgeId,
          judgeName: item.judgeName,
          criteriaScores: item.criteriaScores,
          penalties: item.penalties,
          notes: item.notes,
          version: item.version,
          deviceId: item.deviceId,
        });

        if (res.conflict) {
          conflictsCount++;
        } else {
          syncedCount++;
        }
      } catch (err: unknown) {
        errors.push(err instanceof Error ? err.message : "Error submitting item");
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount,
      conflictsCount,
      errors,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
