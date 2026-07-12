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
  const safeCompany = companyCode?.replace(/[^a-zA-Z0-9-_]/g, "") ?? "";

  // Sanitize job number folder
  const safeJobNumber = String(jobNumber ?? "").replace(/[^0-9]/g, "");

  // Sanitize filename (spaces → underscores, remove unsafe chars)
  let safeDocumentName = (documentName ?? "")
  .replace(/\s+/g, "_")
  .replace(/[^a-zA-Z0-9._-]/g, "");

if (!safeDocumentName.toLowerCase().endsWith(".pdf")) {
  safeDocumentName += ".pdf";
}

const filePath = `${companyCode}/jobs/${jobNumber}/${safeDocumentName}`;

  // DEBUG LOGS — these will tell us EXACTLY what's happening
  console.log("📁 Uploading PDF...");
  console.log("companyCode:", companyCode);
  console.log("safeCompany:", safeCompany);
  console.log("jobNumber:", jobNumber);
  console.log("safeJobNumber:", safeJobNumber);
  console.log("documentName:", documentName);
  console.log("safeDocumentName:", safeDocumentName);
  console.log("filePath:", filePath);
  console.log("pdfBytes length:", pdfBytes?.length);
  console.log("Bucket: companies");

  // Upload (overwrite enabled)
  const { error: uploadError } = await supabaseServer.storage
    .from("companies")
    .upload(filePath, pdfBytes, {
      upsert: true,
      contentType: "application/pdf",
    });

  // MORE DEBUG LOGS
  if (uploadError) {
    console.error("❌ PDF upload error:", uploadError);
    throw new Error("Failed to upload PDF.");
  } else {
    console.log("✅ PDF uploaded successfully:", filePath);
  }

  return {
    filePath,
  };
}
