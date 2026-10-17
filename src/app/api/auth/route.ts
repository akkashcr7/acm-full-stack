import { NextResponse } from "next/server";
import { AppStore } from "@/lib/store";

export async function GET() {
  const users = AppStore.getUsers();
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const users = AppStore.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email?.toLowerCase());

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials. Use demo accounts: admin@ace.ai, judge1@ace.ai, judge2@ace.ai" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user,
      token: `demo_jwt_token_${user.id}_${Date.now()}`,
    });
  } catch {
    return NextResponse.json({ error: "Failed to process auth" }, { status: 500 });
  }
}
