import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  const template = await prisma.formTemplate.findFirst({
    where: { path },
  });

  if (!template) {
    return NextResponse.json({ template: null });
  }

  return NextResponse.json({ template });
}
