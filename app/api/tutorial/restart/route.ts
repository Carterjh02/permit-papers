import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";

const JOB_FLOW_SECTIONS = [
  "job-flow",
  "job-flow1",
  "snippet-workflow",
  "property-workflow",
  "manual-workflow",
];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { section } = await req.json();

  // Get user role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Define flows
  const adminFlow = [
    "welcome",
    "company-setup",
    "user-management",
    "formatting",
    "job-flow",
  ];

  const userFlow = ["welcome", "job-flow"];

  const flow = user.role === "admin" ? adminFlow : userFlow;

  // Determine which sections to reset
  const resetSections =
    section === "job-flow" ? JOB_FLOW_SECTIONS : [section];

  // Completed sections = all except reset ones
  const completed = flow.filter((s) => !resetSections.includes(s));

  const updated = await prisma.tutorialProgress.update({
    where: { userId },
    data: {
      enabled: true,
      currentSection: section,
      currentStep: 0,
      completedSections: completed,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, tutorial: updated });
}
