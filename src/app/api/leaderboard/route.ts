import { NextResponse } from "next/server";
import { AppStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const leaderboard = AppStore.getLeaderboard();
  const criteria = AppStore.getCriteria();
  const event = AppStore.getEvent();

  return NextResponse.json({
    event,
    leaderboard,
    criteria,
    timestamp: new Date().toISOString(),
  });
}
