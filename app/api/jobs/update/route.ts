import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken, type GetTokenParams } from "next-auth/jwt";

export async function POST(req: Request) {
  const token = await getToken({
    req: req as unknown as GetTokenParams["req"],
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { jobId } = body;

  if (!jobId) return new NextResponse("Missing jobId", { status: 400 });

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: {
      jobNumber: body.jobNumber,
      title: body.title,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
      customerCity: body.customerCity,
      customerState: body.customerState,
      customerZip: body.customerZip,
      legalDescription: body.legalDescription,
      taxFolioNumber: body.taxFolioNumber,
      jobValue: body.jobValue,
      description: body.description,

      // Ensure preview refreshes after job update
      updatedAt: new Date(),
    },
  });

  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/parse-legal`, {
    method: "POST",
    body: JSON.stringify({ jobId }),
  });

  return NextResponse.json(updatedJob);
}
