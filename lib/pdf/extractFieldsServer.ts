"use server";

import { PDFDocument } from "pdf-lib";
import { supabaseServer } from "@/lib/supabaseServer";

export async function extractPdfFieldsServer(bucket: string, path: string) {
  // ⭐ Always generate a signed URL for private buckets
  const { data: signedUrlData, error: signedUrlError } =
    await supabaseServer.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    console.error("Signed URL generation failed:", signedUrlError);
    return [];
  }

  const signedUrl = signedUrlData.signedUrl;

  // ⭐ Download PDF using signed URL
  let pdfBytes: ArrayBuffer;
  try {
    const res = await fetch(signedUrl);
    if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`);
    pdfBytes = await res.arrayBuffer();
  } catch (err) {
    console.error("PDF download failed:", err);
    return [];
  }

  // ⭐ Parse PDF fields
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    return form.getFields().map((f) => f.getName());
  } catch (err) {
    console.error("PDF parsing failed:", err);
    return [];
  }
}
