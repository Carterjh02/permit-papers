import { prisma } from "@/lib/prisma";

export async function getTutorialState(userId: string) {
  return prisma.tutorialProgress.findUnique({ where: { userId } });
}

export async function setTutorialStep(
  userId: string,
  section: string,
  step: number
) {
  return prisma.tutorialProgress.update({
    where: { userId },
    data: {
      currentSection: section,
      currentStep: step,
    },
  });
}

export async function completeSection(userId: string, section: string) {
  const existing = await prisma.tutorialProgress.findUnique({
    where: { userId },
  });

  const updatedSections = Array.from(
    new Set([...(existing?.completedSections ?? []), section])
  );

  return prisma.tutorialProgress.update({
    where: { userId },
    data: {
      completedSections: updatedSections,
    },
  });
}
