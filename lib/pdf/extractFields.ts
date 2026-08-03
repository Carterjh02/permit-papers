"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";

/**
 * Extract all AcroForm field names from a PDF stored in Supabase.
 *
 * @param bucket - The Supabase storage bucket ("templates", "companies", etc.)
 * @param storagePath - The full storage path inside the bucket
 *
 * @returns string[] - Sorted list of unique PDF field names
 */
export async function extractPdfFields(
  bucket: string,
  storagePath: string
): Promise<string[]> {
  // 1. Download PDF using service role (works with private buckets)
  const cleanPath =
  storagePath.startsWith(`${bucket}/`)
    ? storagePath.slice(bucket.length + 1)
    : storagePath;

const { data, error } = await supabaseServer.storage
  .from(bucket)
  .download(cleanPath);

  if (error || !data) {
    console.error("Failed to download PDF:", error);
    throw new Error("Could not download PDF from storage.");
  }

  // Convert Blob → ArrayBuffer → Buffer
  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 2. Load PDF with pdf-lib
  const pdfDoc = await PDFDocument.load(buffer);
  const form = pdfDoc.getForm();

  const fields = form.getFields();
  const fieldNames: string[] = [];

  for (const field of fields) {
    const name = field.getName();
    if (name) fieldNames.push(name);
  }

  return Array.from(new Set(fieldNames)).sort();
}

/**
 * Extract fields and save them to the DB for a template record.
 * This function still assumes templates live in the "templates" bucket.
 */
export async function extractAndSaveFields(templateId: string) {
  const template = await prisma.formTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) throw new Error("Template not found.");

  // IMPORTANT:
  // This still uses the templates bucket because DB templates always live there.
  const fieldNames = await extractPdfFields("templates", template.path);

  await prisma.formTemplate.update({
    where: { id: templateId },
    data: { fieldNames },
  });

  return fieldNames;
}
