import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { updateCompanyPreferences, getCompanyPreferences } from "@/lib/preferences/updateCompanyPreferences";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = session.user.companyId;

  if (!companyId) {
    return NextResponse.json({ error: "No active company" }, { status: 400 });
  }

  const prefs = await getCompanyPreferences(companyId);
  return NextResponse.json({ preferences: prefs });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const companyId = session.user.companyId;

  if (!companyId) {
    return NextResponse.json({ error: "No active company" }, { status: 400 });
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
    const updated = await updateCompanyPreferences({
      companyId,
      data: body,
    });

    return NextResponse.json({ success: true, preferences: updated });
} catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update preferences";
  
    return NextResponse.json({ error: message }, { status: 400 });
  }
}