import { NextResponse } from "next/server";
import { AppStore } from "@/lib/store";

export async function POST() {
  const conflict = AppStore.createSimulatedConflict();
  return NextResponse.json({ success: true, conflict });
}
