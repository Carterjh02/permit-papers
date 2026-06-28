import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken, type GetTokenParams } from "next-auth/jwt";

export async function GET(req: Request) {
  const token = await getToken({
    req: req as unknown as GetTokenParams["req"],
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) return new NextResponse("Unauthorized", { status: 401 });

  const role = token.role as string | undefined;
  const companyId = token.companyId as string | null;

  // master: see all companies; admin: only their own; user: none
  if (role === "master") {
    const companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(companies);
  }

  if (role === "admin" && companyId) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return new NextResponse("Not found", { status: 404 });
    return NextResponse.json([company]);
  }

  return new NextResponse("Forbidden", { status: 403 });
}
