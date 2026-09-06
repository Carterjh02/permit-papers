import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";
import { getPreviousSection } from "@/lib/tutorial/getPreviousSection";
import { getSectionStepCount } from "@/lib/tutorial/getSectionStepCount";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const role = session.user.role === "master" ? "admin" : session.user.role;

  const tutorial = await prisma.tutorialProgress.findUnique({ where: { userId } });
  if (!tutorial) {
    return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
  }

  const currentStep = tutorial.currentStep ?? 0;

  // If we can go back inside the section
  if (currentStep > 0) {
    const updated = await prisma.tutorialProgress.update({
      where: { userId },
      data: {
        currentStep: currentStep - 1,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ tutorial: updated });
  }

  // Otherwise go back to previous section
  const previousSection = getPreviousSection(tutorial.currentSection!, role);
  const previousStepCount = getSectionStepCount(previousSection, role);

  const updated = await prisma.tutorialProgress.update({
    where: { userId },
    data: {
      currentSection: previousSection,
      currentStep: previousStepCount - 1,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ tutorial: updated });
}
