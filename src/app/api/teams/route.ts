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

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all");

    if (all === "true") {
      AppStore.clearTeams();
      return NextResponse.json({ success: true, message: "All teams cleared" });
    }

    if (!id) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    const removed = AppStore.deleteTeam(id);
    if (!removed) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Team removed" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to delete team";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

