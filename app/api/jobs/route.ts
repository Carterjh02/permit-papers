import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken, type GetTokenParams } from "next-auth/jwt";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const companyId = url.searchParams.get("companyId");

  const results = await prisma.job.findMany({
    where: {
      companyId: companyId === "null" ? undefined : companyId ?? undefined,
      OR: [
        { jobNumber: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(results);
}

export async function POST(req: Request) {
  const token = await getToken({
    req: req as unknown as GetTokenParams["req"],
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) return new NextResponse("Unauthorized", { status: 401 });
  if (!(token.role === "admin" || token.role === "master"))
    return new NextResponse("Forbidden", { status: 403 });

  const body = await req.json();
  const { companyId, jobNumber, title, customerName, description } = body;

  const created = await prisma.job.create({
    data: {
      companyId,
      jobNumber,
      title,
      customerName,
      description,
      createdBy: token.id as string,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
