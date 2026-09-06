import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";
import { getNextSection } from "@/lib/tutorial/getNextSection";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();

  // SKIP SECTION
  if (body.skip === true) {
    const tutorial = await prisma.tutorialProgress.findUnique({
      where: { userId },
    });

    if (!tutorial) {
      return NextResponse.json(
        { error: "Tutorial not found" },
        { status: 404 }
      );
    }

    const currentSection = tutorial.currentSection ?? "";
    const completedSections = tutorial.completedSections ?? [];

    const role =
      session.user.role === "master" ? "admin" : session.user.role;

    const nextSection = getNextSection(currentSection, role);

    const updated = await prisma.tutorialProgress.update({
      where: { userId },
      data: {
        completedSections: [...completedSections, currentSection],
        currentSection: nextSection,
        currentStep: 0,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, tutorial: updated });
  }

  // FINISH TUTORIAL (enabled = false)
  const updated = await prisma.tutorialProgress.update({
    where: { userId },
    data: {
      enabled: body.enabled,
    },
  });

  return NextResponse.json({ success: true, tutorial: updated });
}
