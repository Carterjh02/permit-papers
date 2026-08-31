import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { getSectionStepCount } from "@/lib/tutorial/getSectionStepCount";
import { getNextSection } from "@/lib/tutorial/getNextSection";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const role = session.user.role;

  const tutorial = await prisma.tutorialProgress.findUnique({
    where: { userId },
  });

  if (!tutorial) {
    return Response.json({ error: "Tutorial not found" }, { status: 404 });
  }

  const stepCount = getSectionStepCount(tutorial.currentSection!, role);
  const nextStep = (tutorial.currentStep ?? 0) + 1;

  // If nextStep is still within this section → just increment
  if (nextStep < stepCount) {
    const updated = await prisma.tutorialProgress.update({
      where: { userId },
      data: {
        currentStep: nextStep,
        updatedAt: new Date(),
      },
    });

    return Response.json({ tutorial: updated });
  }

  // Otherwise → section complete → move to next section
  const nextSection = getNextSection(tutorial.currentSection!, role);

  const updated = await prisma.tutorialProgress.update({
    where: { userId },
    data: {
      completedSections: [...tutorial.completedSections, tutorial.currentSection!],
      currentSection: nextSection,
      currentStep: 0,
      updatedAt: new Date(),
    },
  });

  return Response.json({ tutorial: updated });
}
