import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const role = session.user.role;

  let tutorial = await prisma.tutorialProgress.findUnique({
    where: { userId },
  });

  // Auto-create tutorial if missing
  if (!tutorial) {
    tutorial = await prisma.tutorialProgress.create({
      data: {
        userId,
        enabled: true,
        currentSection: "welcome",
        currentStep: 0,
        completedSections: [],
      },
    });
  }

  // If disabled, return as-is
  if (!tutorial.enabled) {
    return NextResponse.json({ tutorial });
  }

  // ROLE-AWARE ONBOARDING FLOW
  const adminFlow = [
    "welcome",
    "company-setup",
    "user-management",
    "formatting",
    "job-flow",
    "snippet-workflow",
    "property-workflow",
    "manual-workflow",
    "job-flow1",
  ];
  
  const userFlow = [
    "welcome",
    "job-flow",
    "snippet-workflow",
    "property-workflow",
    "manual-workflow",
    "job-flow1",
  ];

  const flow = role === "admin" ? adminFlow : userFlow;

  // Branch sections must NOT be overwritten
  const branchSections = [
    "snippet-workflow",
    "property-workflow",
    "manual-workflow",
  ];

  const completed = tutorial.completedSections ?? [];
  const currentSection = tutorial.currentSection ?? "welcome";

  // STOP if the current section is already completed
  if (
    tutorial.currentSection &&
    completed.includes(tutorial.currentSection)
  ) {
    tutorial = await prisma.tutorialProgress.update({
      where: { userId },
      data: {
        enabled: false,
        currentSection: null,
        currentStep: null,
      },
    });

  return NextResponse.json({ tutorial });
}

  // If currentSection is valid OR a branch section → do nothing
  if (flow.includes(currentSection) || branchSections.includes(currentSection)) {
    return NextResponse.json({ tutorial });
  }

  // Otherwise, determine correct section based on completedSections
  for (const section of flow) {
    if (!completed.includes(section)) {
      tutorial = await prisma.tutorialProgress.update({
        where: { userId },
        data: { currentSection: section },
      });
      break;
    }
  }

  return NextResponse.json({ tutorial });
}
