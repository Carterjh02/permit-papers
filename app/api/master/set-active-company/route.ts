import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type Role = "user" | "admin" | "master";

interface SessionUser {
  id: string;
  username: string;
  role: Role;
  companyId: string | null;
  activeCompanyId: string | null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as SessionUser;

  if (user.role !== "master") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { companyId }: { companyId: string } = await req.json();

  return NextResponse.json({ ok: true, companyId });
}
