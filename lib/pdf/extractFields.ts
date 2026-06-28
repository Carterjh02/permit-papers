import { supabaseServer } from "@/lib/supabaseServer";
import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";

export async function extractPdfFields(storagePath: string): Promise<string[]> {
  // 1. Download PDF from Supabase private bucket
  const { data, error } = await supabaseServer.storage
    .from("templates")
    .download(storagePath);

  if (error || !data) {
    console.error("Failed to download PDF:", error);
    throw new Error("Could not download PDF from storage.");
  }

  // Convert Blob → ArrayBuffer
  const arrayBuffer = await data.arrayBuffer();

  // 2. Load PDF with pdf-lib
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  const form = pdfDoc.getForm();
  const fields = form.getFields();

  const fieldNames: string[] = [];

  for (const field of fields) {
    const name = field.getName();
    if (name) fieldNames.push(name);
  }

  return fieldNames;
}

export async function extractAndSaveFields(templateId: string) {
  const template = await prisma.formTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) throw new Error("Template not found.");

  const fieldNames = await extractPdfFields(template.path);

  await prisma.formTemplate.update({
    where: { id: templateId },
    data: { fieldNames },
  });

  return fieldNames;
}
