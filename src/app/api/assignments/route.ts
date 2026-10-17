import { NextResponse } from "next/server";
import { AppStore } from "@/lib/store";

export async function GET() {
  const assignments = AppStore.getAssignments();
  return NextResponse.json({ assignments });
}

export async function POST(req: Request) {
  try {
    const { judgeId, judgeName, teamIds } = await req.json();
    if (!judgeId || !teamIds) {
      return NextResponse.json({ error: "judgeId and teamIds are required" }, { status: 400 });
    }

    AppStore.setAssignment(judgeId, judgeName || "Judge", teamIds);
    return NextResponse.json({ success: true, assignments: AppStore.getAssignments() });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error setting assignment";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
