import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  const id = context.params.id;

  const mappings = await prisma.formFieldMapping.findMany({
    where: { templateId: id },
  });

  return NextResponse.json({ mappings });
}

export async function POST(
  req: Request,
  context: { params: { id: string } }
) {
  const id = context.params.id;
  const body = await req.json();

  if (!body?.mappings || !Array.isArray(body.mappings)) {
    return NextResponse.json(
      { error: "Invalid mappings payload" },
      { status: 400 }
    );
  }

  await prisma.formFieldMapping.deleteMany({
    where: { templateId: id },
  });

  await prisma.formFieldMapping.createMany({
    data: body.mappings.map(
      (m: { pdfFieldName: string; mappedTo: string }) => ({
        templateId: id,
        pdfFieldName: m.pdfFieldName,
        mappedTo: m.mappedTo,
      })
    ),
  });

  return NextResponse.json({ success: true });
}
