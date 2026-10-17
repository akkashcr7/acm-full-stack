import { NextResponse } from "next/server";
import { AppStore } from "@/lib/store";

export async function GET() {
  const event = AppStore.getEvent();
  return NextResponse.json({ event });
}
