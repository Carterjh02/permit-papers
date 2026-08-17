import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = session.user.companyId;
  const userId = session.user.id;

  const [companyPrefsRaw, userPrefsRaw] = await Promise.all([
    companyId
      ? prisma.companyPreferences.findUnique({ where: { companyId } })
      : null,
    prisma.userPreferences.findUnique({ where: { userId } }),
  ]);

  return NextResponse.json({
    companyPrefs: companyPrefsRaw,
    userPrefs: userPrefsRaw,
    effectivePrefs: {
      theme: userPrefsRaw?.theme ?? "light",
      uiFont: userPrefsRaw?.font ?? "inter",
      density: userPrefsRaw?.density ?? "comfortable",
    },
  });  
}
