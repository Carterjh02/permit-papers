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

  const body = await req.json();
  const section = body.section;

  if (!section || typeof section !== "string") {
    return NextResponse.json(
      { error: "Invalid section name" },
      { status: 400 }
    );
  }

  const tutorial = await prisma.tutorialProgress.findUnique({
    where: { userId },
  });

  if (!tutorial) {
    return NextResponse.json(
      { error: "Tutorial not found" },
      { status: 404 }
    );
  }

  const updated = await prisma.tutorialProgress.update({
    where: { userId },
    data: {
      currentSection: section,
      currentStep: 0,
      enabled: true,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ tutorial: updated });
}
