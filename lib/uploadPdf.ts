import { supabaseServer } from "@/lib/supabaseServer";

interface UploadPdfOptions {
  companyCode: string;
  jobNumber: number;
  documentName: string; // includes extension exactly as uploaded
  pdfBytes: Uint8Array;
}

export async function uploadPdf(options: UploadPdfOptions) {
  const { companyCode, jobNumber, documentName, pdfBytes } = options;

  if (!jobNumber && jobNumber !== 0) {
    throw new Error("jobNumber is required for PDF uploads.");
  }

  // Sanitize company code
  const safeCompany = companyCode.replace(/[^a-zA-Z0-9-_]/g, "");

  // Sanitize job number folder
  const safeJobNumber = String(jobNumber).replace(/[^0-9]/g, "");

  // Sanitize filename (spaces → underscores, remove unsafe chars)
  const safeDocumentName = documentName
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9-_.]/g, "");

  // FINAL PATH (inside the companies bucket)
  const filePath = `${safeCompany}/jobs/${safeJobNumber}/${safeDocumentName}.pdf`;

  // Upload (overwrite enabled)
  const { error: uploadError } = await supabaseServer.storage
    .from("companies")
    .upload(filePath, pdfBytes, {
      upsert: true,
      contentType: "application/pdf",
    });

  if (uploadError) {
    console.error("PDF upload error:", uploadError);
    throw new Error("Failed to upload PDF.");
  }

  return {
    filePath,
  };
}
