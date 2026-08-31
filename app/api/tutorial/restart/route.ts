import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { section } = await req.json();

  const updated = await prisma.tutorialProgress.update({
    where: { userId },
    data: {
      currentSection: section,
      currentStep: 0,
      completedSections: {
        set: [],
      },
    },
  });

  return NextResponse.json({ success: true, tutorial: updated });
}
