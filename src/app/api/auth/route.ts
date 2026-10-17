import { NextResponse } from "next/server";
import { AppStore } from "@/lib/store";

export async function GET() {
  const users = AppStore.getUsers();
  return NextResponse.json({ users });
}

const VALID_PASSWORDS: Record<string, string> = {
  "admin@ace.ai": "Admin@123",
  "judge1@ace.ai": "Judge@123",
  "judge2@ace.ai": "Judge@123",
  "public@ace.ai": "Public@123",
};

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const users = AppStore.getUsers();
    const cleanEmail = email?.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return NextResponse.json(
        { error: "Account not found. Valid accounts: admin@ace.ai, judge1@ace.ai, judge2@ace.ai, public@ace.ai" },
        { status: 401 }
      );
    }

    // If password provided, verify against expected password
    const expectedPassword = VALID_PASSWORDS[cleanEmail];
    if (password && expectedPassword && password !== expectedPassword) {
      return NextResponse.json(
        { error: `Incorrect password for ${cleanEmail}. Default is: ${expectedPassword}` },
        { status: 401 }
      );
    }

    const sessionToken = `ace_token_${user.id}_${Date.now()}`;

    return NextResponse.json({
      success: true,
      user,
      token: sessionToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to process authentication request" }, { status: 500 });
  }
}

