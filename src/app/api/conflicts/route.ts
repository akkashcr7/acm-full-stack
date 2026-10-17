import { NextResponse } from "next/server";
import { AppStore } from "@/lib/store";
import { ConflictResolutionSchema } from "@/lib/validation";

export async function GET() {
  const conflicts = AppStore.getConflicts();
  return NextResponse.json({ conflicts });
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = ConflictResolutionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid conflict resolution request", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const resolved = AppStore.resolveConflict(
      parsed.data.conflictId,
      parsed.data.resolutionPolicy,
      parsed.data.resolvedBy,
      parsed.data.manualValue
    );

    if (!resolved) {
      return NextResponse.json({ error: "Conflict not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, conflict: resolved });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
