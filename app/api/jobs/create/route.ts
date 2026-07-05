import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = session.user.companyId;

  const body = await req.json();

  // Count existing jobs for this company
  const count = await prisma.job.count({
    where: { companyId },
  });

  // FIX: jobNumber must be a number
  const jobNumber = count + 1;

  const job = await prisma.job.create({
    data: {
      companyId,
      jobNumber,
      title: `Job #${jobNumber}`,
      customerName: body.customerName,
      customerAddress: body.customerAddress,
      customerCity: body.customerCity,
      customerState: body.customerState,
      customerZip: body.customerZip,
      taxFolioNumber: body.taxFolioNumber,
      jobValue: body.jobValue ? Number(body.jobValue) : null,
      description: body.description,
      createdBy: session.user.id,
    },
  });

  return NextResponse.json({ jobId: job.id });
}
