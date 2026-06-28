import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken, type GetTokenParams } from "next-auth/jwt";

export async function GET(req: Request) {
  const token = await getToken({
    req: req as unknown as GetTokenParams["req"],
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) return new NextResponse("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId");

  if (!jobId) return new NextResponse("Missing jobId", { status: 400 });

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { company: true },
  });

  if (!job) return new NextResponse("Job not found", { status: 404 });

  return NextResponse.json({
    contractor: {
      name: job.company.name,
      email: job.company.email,
      phone: job.company.phone,
      address: job.company.address,
      licenseNumber: job.company.licenseNumber,
      website: job.company.website,
    },
    customer: {
      name: job.customerName,
      phone: job.customerPhone,
      address: job.customerAddress,
      city: job.customerCity,
      state: job.customerState,
      zip: job.customerZip,
    },
    property: {
      legalDescription: job.legalDescription,
      lot: job.lotNumber,
      block: job.blockNumber,
      subdivision: job.subdivision,
      building: job.buildingNumber,
      unit: job.unitNumber,
      taxFolioNumber: job.taxFolioNumber,
    },
    job: {
      jobNumber: job.jobNumber,
      title: job.title,
      value: job.jobValue,
      description: job.description,
    },
  });
}
