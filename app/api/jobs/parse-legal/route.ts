// app/api/jobs/parse-legal/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseLegalDescription } from "@/lib/legalDescriptionParser";

export async function POST(req: Request) {
  const { jobId } = await req.json();

  if (!jobId) {
    return new NextResponse("Missing jobId", { status: 400 });
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return new NextResponse("Job not found", { status: 404 });

  const parsed = parseLegalDescription(job.legalDescription);

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: {
      lotNumber: parsed.lotNumber,
      blockNumber: parsed.blockNumber,
      subdivision: parsed.subdivision,
      buildingNumber: parsed.buildingNumber,
      unitNumber: parsed.unitNumber,
    },
  });

  return NextResponse.json(updated);
}
