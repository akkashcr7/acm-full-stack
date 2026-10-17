import { NextResponse } from "next/server";
import { AppStore } from "@/lib/store";

export async function GET() {
  const users = AppStore.getUsers();
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  try {
    const { email, name, role, avatar } = await req.json();
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid Gmail or email address." },
        { status: 400 }
      );
    }

    // Upsert or retrieve user (works with any Gmail or email domain)
    const user = AppStore.upsertUser({
      email: cleanEmail,
      name,
      role: role || (cleanEmail.includes("admin") ? "admin" : "judge"),
      avatar,
    });

    const sessionToken = `ace_token_${user.id}_${Date.now()}`;

    return NextResponse.json({
      success: true,
      user,
      token: sessionToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to process authentication request";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

