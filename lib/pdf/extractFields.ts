"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";

/**
 * Normalize a Supabase storage path by removing the bucket prefix if present.
 * Works for both "templates" and "companies" buckets.
 */
function normalizePath(bucket: string, storagePath: string): string {
  // Remove leading bucket prefix (case-insensitive)
  return storagePath.replace(new RegExp(`^${bucket}/`, "i"), "");
}

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
  const cleanPath = normalizePath(bucket, storagePath);

  console.log("[extractPdfFields] Bucket:", bucket);
  console.log("[extractPdfFields] storagePath:", storagePath);
  console.log("[extractPdfFields] cleanPath:", cleanPath);

  // Download PDF from Supabase
  const { data, error } = await supabaseServer.storage
    .from(bucket)
    .download(cleanPath);

  if (error || !data) {
    console.error("[extractPdfFields] Failed to download PDF:", error);
    throw new Error(`Could not download PDF from storage: ${cleanPath}`);
  }

  // Convert Blob → ArrayBuffer → Buffer
  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Load PDF with pdf-lib
  const pdfDoc = await PDFDocument.load(buffer);
  const form = pdfDoc.getForm();

  const fields = form.getFields();
  const fieldNames: string[] = [];

  for (const field of fields) {
    const name = field.getName();
    if (name) fieldNames.push(name);
  }

  console.log("[extractPdfFields] Extracted fields:", fieldNames);

  return Array.from(new Set(fieldNames)).sort();
}

/**
 * Extract fields and save them to the DB for a template record.
 * This now supports BOTH templates and company documents.
 */
export async function extractAndSaveFields(templateId: string) {
  const template = await prisma.formTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) throw new Error("Template not found.");

  // Determine bucket based on stored path
  const bucket = template.path.startsWith("companies/")
    ? "companies"
    : "templates";

  console.log("[extractAndSaveFields] Template bucket:", bucket);
  console.log("[extractAndSaveFields] Template path:", template.path);

  const fieldNames = await extractPdfFields(bucket, template.path);

  await prisma.formTemplate.update({
    where: { id: templateId },
    data: { fieldNames },
  });

  return fieldNames;
}
