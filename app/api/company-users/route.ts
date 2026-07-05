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
  const requesterCompanyId = token.companyId as string | null;

  const url = new URL(req.url);
  const companyId = url.searchParams.get("companyId");

  if (role !== "master" && role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let targetCompanyId: string | null = null;

  if (role === "master") {
    targetCompanyId = companyId ?? null;
  } else {
    targetCompanyId = requesterCompanyId;
  }

  const users = await prisma.user.findMany({
    where: {
      companyId: targetCompanyId ?? undefined,
    },
    orderBy: { username: "asc" },
  });

  return NextResponse.json(
    users.map((u: { id: string; username: string; role: string; companyId: string | null }) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      companyId: u.companyId,
    }))
  );
}
