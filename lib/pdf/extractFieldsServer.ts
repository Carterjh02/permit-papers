"use server";

import { PDFDocument } from "pdf-lib";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * Extract all AcroForm field names from a PDF stored in Supabase using a signed URL.
 * Works for both "templates" and "companies" buckets.
 */
export async function extractPdfFieldsServer(bucket: string, storagePath: string) {
  // Normalize path: remove bucket prefix if present
  const cleanPath = storagePath.replace(new RegExp(`^${bucket}/`, "i"), "");

  console.log("[extractPdfFieldsServer]", { bucket, storagePath, cleanPath });

  // Generate signed URL for private buckets
  const { data: signedUrlData, error: signedUrlError } = await supabaseServer.storage
    .from(bucket)
    .createSignedUrl(cleanPath, 60 * 60);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    console.error("Signed URL generation failed:", signedUrlError);
    return [];
  }

  const signedUrl = signedUrlData.signedUrl;

  // Download PDF using signed URL
  let pdfBytes: ArrayBuffer;
  try {
    const res = await fetch(signedUrl);
    if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`);
    pdfBytes = await res.arrayBuffer();
  } catch (err) {
    console.error("PDF download failed:", err);
    return [];
  }

  // Parse PDF fields
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields().map((f) => f.getName());
    console.log("[extractPdfFieldsServer] Extracted fields:", fields);
    return fields;
  } catch (err) {
    console.error("PDF parsing failed:", err);
    return [];
  }
}
