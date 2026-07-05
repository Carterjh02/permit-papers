import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabaseServer";
import { PDFDocument } from "pdf-lib";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const template = await prisma.formTemplate.findUnique({
    where: { id },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const { data: fileData, error } = await supabaseServer.storage
    .from("templates")
    .download(template.path);

  if (error || !fileData) {
    return NextResponse.json(
      { error: "Failed to download PDF" },
      { status: 500 }
    );
  }

  const pdfBytes = await fileData.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  const fields = form.getFields().map((f) => ({
    name: f.getName(),
    type: f.constructor.name,
  }));

  return NextResponse.json({ fields });
}
