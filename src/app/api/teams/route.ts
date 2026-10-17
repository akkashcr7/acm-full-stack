import { NextResponse } from "next/server";
import { AppStore } from "@/lib/store";

export async function GET() {
  const teams = AppStore.getTeams();
  return NextResponse.json({ teams });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.robotName) {
      return NextResponse.json(
        { error: "Team name and robot name are required" },
        { status: 400 }
      );
    }

    const newTeam = AppStore.addTeam({
      name: body.name,
      robotName: body.robotName,
      organization: body.organization || "Independent",
      eventId: body.eventId || "evt_ace_2026",
    });

    return NextResponse.json({ team: newTeam }, { status: 201 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to add team";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
