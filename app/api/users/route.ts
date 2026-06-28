// app/api/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken, type GetTokenParams } from "next-auth/jwt";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const token = await getToken({
    req: req as unknown as GetTokenParams["req"],
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) return new NextResponse("Unauthorized", { status: 401 });

  const role = token.role as string | undefined;
  const requesterCompanyId = token.companyId as string | null;

  // Only master or admin can create users
  if (!(role === "master" || role === "admin")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const body = await req.json();
  const { username, password, userRole, companyId } = body as {
    username: string;
    password: string;
    userRole: "admin" | "user";
    companyId?: string | null;
  };

  if (!username || !password || !userRole) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  let targetCompanyId: string | null = null;

  if (role === "master") {
    // master can specify any companyId (or null)
    targetCompanyId = companyId ?? null;
  } else {
    // company admin can only create users in their own company
    if (!requesterCompanyId) {
      return new NextResponse("No company context", { status: 400 });
    }
    targetCompanyId = requesterCompanyId;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const created = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: userRole,
        companyId: targetCompanyId,
      },
    });

    return NextResponse.json(
      {
        id: created.id,
        username: created.username,
        role: created.role,
        companyId: created.companyId,
      },
      { status: 201 }
    );
  } catch {
    return new NextResponse("Error creating user", { status: 500 });
  }  
}
