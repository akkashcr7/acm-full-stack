import { NextResponse } from "next/server";
import { AppStore } from "@/lib/store";

export async function GET() {
  const logs = AppStore.getAuditLogs();
  return NextResponse.json({ logs });
}
