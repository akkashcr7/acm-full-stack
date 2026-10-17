import { NextResponse } from "next/server";
import { AppStore } from "@/lib/store";
import { ScoreSubmissionSchema, validateScoresAgainstCriteria } from "@/lib/validation";

export async function GET() {
  const submissions = AppStore.getSubmissions();
  return NextResponse.json({ submissions });
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = ScoreSubmissionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Validate scores against dynamic maxScore of criteria
    const criteria = AppStore.getCriteria();
    const validationResult = validateScoresAgainstCriteria(
      parsed.data.criteriaScores,
      criteria
    );

    if (!validationResult.valid) {
      return NextResponse.json(
        { error: "Criterion score out of bounds", details: validationResult.errors },
        { status: 422 }
      );
    }

    const result = AppStore.submitScore({
      eventId: parsed.data.eventId,
      teamId: parsed.data.teamId,
      judgeId: parsed.data.judgeId,
      judgeName: parsed.data.judgeName,
      criteriaScores: parsed.data.criteriaScores,
      penalties: parsed.data.penalties,
      notes: parsed.data.notes,
      version: parsed.data.version,
      deviceId: parsed.data.deviceId,
    });

    return NextResponse.json(
      {
        success: true,
        submission: result.submission,
        conflict: result.conflict || null,
        isAnomaly: result.isAnomaly,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
