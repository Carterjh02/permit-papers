import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import {
  updateUserPreferences,
  getUserPreferences,
} from "@/lib/preferences/updateUserPreferences";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await getUserPreferences(session.user.id);
  return NextResponse.json({ preferences: prefs });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const updated = await updateUserPreferences({
      userId: session.user.id,
      data: body as Record<string, string>,
    });

    return NextResponse.json({ success: true, preferences: updated });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update preferences";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}