import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken, type GetTokenParams } from "next-auth/jwt";

export async function POST(req: Request) {
  const token = await getToken({
    req: req as unknown as GetTokenParams["req"],
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) return new NextResponse("Unauthorized", { status: 401 });

  const role = token.role as string;
  if (role !== "master") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const body = await req.json();

  const template = await prisma.formTemplate.create({
    data: {
      name: body.name,
      description: body.description ?? "",
      formType: body.formType ?? "",
      county: body.county ?? "",
      municipality: body.municipality ?? "",
      path: body.path,            // ✔ REQUIRED: actual Supabase storage path
      storagePath: body.path,     // ✔ optional but consistent with your schema
      fieldNames: [],             // ✔ empty until extracted
      mapping: {},                // ✔ empty until mapped
    },
  });

  return NextResponse.json(template);
}

export async function GET() {
  const templates = await prisma.formTemplate.findMany({
    orderBy: { county: "asc" },
  });

  return NextResponse.json(templates);
}
