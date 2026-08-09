"use server";

import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabaseServer";
import { autoMapFields } from "@/lib/mapping/autoMapping";
import { fillPdf } from "@/lib/pdf/fillPdf";
import { uploadPdf } from "@/lib/uploadPdf";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { redirect, notFound } from "next/navigation";
import { formatJobFields } from "@/lib/utils/formatters";
import { normalizeAddress } from "@/lib/propertyAppraiser/normalizeAddress";

/* -----------------------------------------------------------
   GENERATE PREVIEWS
----------------------------------------------------------- */
export async function generatePreviews(jobId: string) {

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { company: true, documents: true },
  });

  if (!job) throw new Error("Job not found.");

  const companyCode = job.company.companyCode;
  const jobNumber = job.jobNumber;

  for (const doc of job.documents) {
    try {
      if (!doc.templateSourcePath) {
        continue;
      }
  
      // Determine bucket + clean path
      const rawSourcePath = doc.templateSourcePath.replace(/\\/g, "/");
  
      const pathWithoutBucket = rawSourcePath
        .replace(/^templates\//, "")
        .replace(/^companies\//, "");

        const templateRecord = await prisma.formTemplate.findFirst({
          where: { path: pathWithoutBucket },
        });
        
        const bucket = templateRecord ? "templates" : "companies";
  
      // 1. Download template or company doc
      const { data, error } = await supabaseServer.storage
        .from(bucket)
        .download(pathWithoutBucket);
  
      if (error || !data) {
        console.error("❌ Download failed:", error);
        continue;
      }
  
      const buffer = Buffer.from(await data.arrayBuffer());
  
      // 2. Load field names (only templates have mappings)
      const template = await prisma.formTemplate.findFirst({
        where: { path: pathWithoutBucket },
      });

      console.log("📄 generatePreviews() — template lookup", {
        docId: doc.id,
        pathWithoutBucket,
        templateFound: !!template,
      });
  
      const fieldNames = Array.isArray(template?.fieldNames)
        ? (template.fieldNames as string[])
        : [];
  
      const autoMapped = autoMapFields(fieldNames);
  
      // 3. Build company + job data
      const companyData = {
        company_name: job.company.name ?? "",
        company_license: job.company.licenseNumber ?? "",
        company_tax_id: job.company.businessTaxReceipt ?? "",
        qualifier_name: job.company.qualifierName ?? "",
        company_phone: job.company.phone ?? "",
        company_email: job.company.email ?? "",
        company_address_street: job.company.addressStreet ?? "",
        company_address_city: job.company.addressCity ?? "",
        company_address_state: job.company.addressState ?? "",
        company_address_zip: job.company.addressZip ?? "",
        company_address_full:
          job.company.address ??
          [
            job.company.addressStreet,
            job.company.addressCity,
            job.company.addressState,
            job.company.addressZip,
          ]
            .filter(Boolean)
            .join(", "),
        desc_of_improv: job.company.descOfImprov ?? "",
      };
  
      const jobData = {
        customer_name: job.customerName ?? "",
        customer_phone: job.customerPhone ?? "",
        customer_email: job.customerEmail ?? "",
        customer_address_street: job.customerAddress ?? "",
        customer_address_city: job.customerCity ?? "",
        customer_address_state: job.customerState ?? "",
        customer_address_zip: job.customerZip ?? "",
        customer_address_full: [
          job.customerAddress,
          job.customerCity,
          job.customerState,
          job.customerZip,
        ]
          .filter(Boolean)
          .join(", "),
        customer_tax_folio: job.taxFolioNumber ?? "",
        legal_description: job.legalDescription ?? "",
        subdivision: job.subdivision ?? "",
        job_price:
          typeof job.jobValue === "number"
            ? `$ ${job.jobValue.toLocaleString("en-US")}`
            : "",
        job_number: job.jobNumber ?? "",
        desc_of_improv: job.description ?? "",
      };

      // 4. Fill PDF
      const filled = await fillPdf({
        templateBuffer: buffer,
        autoMapped,
        company: companyData,
        job: jobData,
      });
  
      // 5. Build SAFE filename
      let safeDocumentName = doc.templateName
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "");
  
      if (!safeDocumentName.toLowerCase().endsWith(".pdf")) {
        safeDocumentName += ".pdf";
      }
  
      const outputPath = `${companyCode}/jobs/${jobNumber}/${safeDocumentName}`;
  
      // 6. Upload filled PDF
      await uploadPdf({
        companyCode,
        jobNumber,
        documentName: safeDocumentName,
        pdfBytes: filled,
      });
  
      // 7. Signed URL
      const { data: signedUrlData, error: signedUrlError } =
        await supabaseServer.storage
          .from("companies")
          .createSignedUrl(outputPath, 60 * 60);
  
      if (signedUrlError) {
        console.error("❌ Signed URL error:", signedUrlError);
      }
  
      const signedUrl = signedUrlData?.signedUrl ?? null;
  
      // 8. Update DB
      await prisma.jobDocument.update({
        where: { id: doc.id },
        data: {
          templateOutputPath: outputPath,
          templateSignedUrl: signedUrl,
        },
      });
    } catch (err) {
      console.log("❌ ERROR IN PREVIEW GENERATION:", err);
      continue;
    }
  }

  await prisma.job.update({
    where: { id: jobId },
    data: { updatedAt: new Date() },
  });
}

/* -----------------------------------------------------------
   CREATE MINIMAL JOB
----------------------------------------------------------- */
export async function createMinimalJob(companyId: string, createdBy: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });
  if (!company) throw new Error("Company not found.");

  const lastJob = await prisma.job.findFirst({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });

  const nextJobNumber = lastJob ? lastJob.jobNumber + 1 : 1;

  const job = await prisma.job.create({
    data: {
      companyId,
      jobNumber: nextJobNumber,
      createdBy,
      description: "",
    },
  });

  const safeCompany = company.companyCode?.replace(/[^a-zA-Z0-9-_]/g, "") ?? "";
  const safeJobNumber = String(nextJobNumber).replace(/[^0-9]/g, "");

  await supabaseServer.storage
    .from("companies")
    .upload(`${safeCompany}/jobs/${safeJobNumber}/.keep`, new Uint8Array(), {
      upsert: true,
      contentType: "text/plain",
    });

  return job;
}

// ------------------------------------------------------------
// FIELD CLEANERS
// ------------------------------------------------------------
function cleanField(value: string | undefined): string | undefined {
  if (!value) return value;

  // Remove stray punctuation except allowed characters
  return value
    .replace(/[;:]+/g, " ")                // remove semicolons/colons
    .replace(/[^\w\s@.,/#-]/g, "")         // strip stray symbols except allowed ones
    .replace(/\s{2,}/g, " ")               // collapse multiple spaces
    .trim();
}

function normalizePhone(phone: string | undefined): string | undefined {
  if (!phone) return phone;

  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return phone.trim();
}

// ------------------------------------------------------------
// OCR NAME NORMALIZER
// ------------------------------------------------------------
function normalizeOCRName(name: string | undefined): string | undefined {
  if (!name) return name;

  if (name.includes(",")) {
    const [last, first] = name.split(",").map((s) => s.trim());
    return `${first} ${last}`.trim();
  }

  return name.trim();
}

// ------------------------------------------------------------
// FULL OCR PARSER (UPDATED)
// ------------------------------------------------------------
export async function parseCustomerInfo(text: string) {
  // Pre-clean text
  const cleaned = text
    .replace(/[;:]+/g, " ")                // remove semicolons/colons
    .replace(/[^\w\s@.,/#-]/g, "")         // strip stray symbols except allowed ones
    .replace(/\s{2,}/g, " ")               // collapse multiple spaces
    .trim();

  // 2️⃣ Split and filter lines
  const blacklist = ["customer", "address", "info", "email", "phone", "section"];
  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(
      (l) =>
        l &&
        !blacklist.some((word) => l.toLowerCase().includes(word))
    );

  const result: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    folio?: string;
    subdivision?: string;
    phone?: string;
  } = {};

  // 3️⃣ Regex patterns
  const nameRegex = /^[A-Z][a-z]+[, ]+[A-Z][a-z]+/i;
  const phoneRegex = /\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/;
  const addressRegex = /^\d{3,5}\s+[A-Z0-9 .'-]+$/i;
  const cityStateZipRegex = /([A-Z\s]+),?\s*([A-Z]{2})\s*(\d{5})/;
  const folioRegex = /\b\d{4,}[-]?\d*\b/;
  const subdivisionRegex = /(SU|Subdivision|Quinnstreet)/i;

  // 4️⃣ Detect fields
  for (const line of lines) {
    if (!result.name && nameRegex.test(line)) {
      result.name = cleanField(normalizeOCRName(line));
    } else if (!result.phone && phoneRegex.test(line)) {
      const m = line.match(phoneRegex);
      if (m) result.phone = normalizePhone(m[0]);
    } else if (!result.address && addressRegex.test(line)) {
      result.address = cleanField(line);
    } else if (!result.city && cityStateZipRegex.test(line)) {
      const m = line.match(cityStateZipRegex);
      if (m) {
        result.city = cleanField(m[1]);
        result.state = cleanField(m[2]);
        result.zip = cleanField(m[3]);
      }
    } else if (!result.folio && folioRegex.test(line)) {
      const m = line.match(folioRegex);
      if (m) result.folio = cleanField(m[0]);
    } else if (!result.subdivision && subdivisionRegex.test(line)) {
      result.subdivision = cleanField(line);
    }
  }

  return result;
}

/* -----------------------------------------------------------
   UPLOAD SNIPPET (supports drag-drop, paste, file upload)
----------------------------------------------------------- */
export async function uploadSnippetImmediately(jobId: string, file: File) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { company: true },
  });
  if (!job) throw new Error("Job not found.");

  const mime =
    file.type && file.type.startsWith("image/") ? file.type : "image/png";

  const buffer = Buffer.from(await file.arrayBuffer());

  const path = `${job.company.companyCode}/jobs/${job.jobNumber}/snippet.png`;

  // Upload snippet
  const { error } = await supabaseServer.storage
    .from("companies")
    .upload(path, buffer, {
      upsert: true,
      contentType: mime,
    });

  if (error) {
    console.error("❌ Supabase upload error:", error);
    throw new Error("Failed to upload snippet.");
  }

  // Generate signed URL for snippet
  const { data: signedUrlData, error: signedUrlError } =
    await supabaseServer.storage
      .from("companies")
      .createSignedUrl(path, 60 * 60);

  if (signedUrlError) {
    console.error("❌ Signed URL error:", signedUrlError);
  }

  const snippetSignedUrl = signedUrlData?.signedUrl ?? null;

  // Download for OCR
  const { data: downloaded, error: downloadError } =
    await supabaseServer.storage.from("companies").download(path);

  if (downloadError || !downloaded) {
    console.error("❌ Supabase download error:", downloadError);
    throw new Error("Failed to download snippet for OCR.");
  }

  const downloadedBuffer = Buffer.from(await downloaded.arrayBuffer());

  // OCR
  const vision = await import("@google-cloud/vision");
  const visionClient = new vision.ImageAnnotatorClient({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL!,
      private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    },
    projectId: process.env.GOOGLE_PROJECT_ID!,
  });

  const [result] = await visionClient.textDetection(downloadedBuffer);
  const fullText = result.fullTextAnnotation?.text ?? "";

  const parsed = await parseCustomerInfo(fullText);

  // Update job with parsed fields + signed URL
  await prisma.job.update({
    where: { id: jobId },
    data: {
      snippetPath: path,
      snippetSignedUrl,

      customerName: parsed.name ?? job.customerName,
      customerPhone: parsed.phone ?? job.customerPhone,
      customerAddress: parsed.address
      ? normalizeAddress(parsed.address)
      : job.customerAddress,
      customerCity: parsed.city ?? job.customerCity,
      customerState: parsed.state ?? job.customerState,
      customerZip: parsed.zip ?? job.customerZip,

      taxFolioNumber: parsed.folio ?? job.taxFolioNumber,
      subdivision: parsed.subdivision ?? job.subdivision,
    },
  });

  return {
    signedUrl: snippetSignedUrl,
    ocrText: fullText,
    parsed,
  };
}

/* -----------------------------------------------------------
   UPDATE JOB
----------------------------------------------------------- */
export async function updateJobAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user;

  const jobId = formData.get("job_id") as string | null;
  const targetId = jobId ?? (formData.get("route_job_id") as string);

  const existing = await prisma.job.findUnique({
    where: { id: targetId },
    include: { company: true },
  });

  if (!existing) notFound();

  const allowed =
    user.role === "master" ||
    user.companyId === existing.companyId ||
    user.activeCompanyId === existing.companyId;

  if (!allowed) redirect("/dashboard");

  const raw = {
    customerName: formData.get("customer_name") as string | null,
    customerPhone: formData.get("customer_phone") as string | null,
    customerEmail: formData.get("customer_email") as string | null,
    customerAddress: formData.get("customer_address_street") as string | null,
    customerCity: formData.get("customer_address_city") as string | null,
    customerState: formData.get("customer_address_state") as string | null,
    customerZip: formData.get("customer_address_zip") as string | null,
    legalDescription: formData.get("legal_description") as string | null,
  };

  const templatePaths = JSON.parse(
    (formData.get("template_paths") as string) ?? "[]"
  );

  const companyDocumentPaths = JSON.parse(
    (formData.get("company_document_paths") as string) ?? "[]"
  );

  const formatted = formatJobFields({
    customerName: raw.customerName ?? undefined,
    customerPhone: raw.customerPhone ?? undefined,
    customerAddress: raw.customerAddress ?? undefined,
    customerCity: raw.customerCity ?? undefined,
    customerState: raw.customerState ?? undefined,
    customerZip: raw.customerZip ?? undefined,
    legalDescription: raw.legalDescription ?? undefined,
  });

  const subdivision = formData.get("subdivision") as string | null;
  const taxFolioNumber = formData.get("customer_tax_folio") as string | null;
  const rawPrice = formData.get("job_price") as string | null;

  const jobValue = rawPrice
    ? Number(
      rawPrice
        .replace(/\$/g, "")
        .replace(/\s/g, "")
        .replace(/,/g, "")
    )
  : 0;

  // ALWAYS use user-entered description
  const description =
    (formData.get("desc_of_improvement") as string | null)?.trim() ?? "";

  await prisma.job.update({
    where: { id: targetId },
    data: {
      customerName: formatted.customerName,
      customerPhone: formatted.customerPhone,
      customerEmail: raw.customerEmail ?? undefined,
      customerAddress: raw.customerAddress ?? undefined,
      customerCity: formatted.customerCity,
      customerState: formatted.customerState,
      customerZip: formatted.customerZip,
      legalDescription:
        formatted.legalDescription ?? raw.legalDescription ?? undefined,
      subdivision: subdivision ?? undefined,
      taxFolioNumber: taxFolioNumber ?? undefined,
      jobValue,
      description,
    },
  });

  await prisma.jobDocument.deleteMany({
    where: { jobId: targetId },
  });
  
  // TEMPLATES
  for (const path of templatePaths) {
    const cleanPath = path.replace(/\\/g, "/");
  
    const template = await prisma.formTemplate.findFirst({
      where: { path: cleanPath },
    });
  
    await prisma.jobDocument.create({
      data: {
        jobId: targetId,
        templateId: template?.id ?? null,
        templatePath: cleanPath,
        templateSourcePath: cleanPath,
        templateName:
          template?.name ??
          cleanPath.split("/").slice(-1)[0] ??
          cleanPath,
        templateOutputPath: null,
      },
    });
  }
  
  // COMPANY DOCS 
  for (const path of companyDocumentPaths) {
    const cleanPath = path.replace(/\\/g, "/");
  
    await prisma.jobDocument.create({
      data: {
        jobId: targetId,
        templateId: null,
        templatePath: cleanPath,
        templateSourcePath: cleanPath,
        templateName: cleanPath.split("/").slice(-1)[0] ?? cleanPath,
        templateOutputPath: null,
      },
    });
  }

  await generatePreviews(targetId);

  redirect(`/dashboard/jobs/${targetId}/preview`);
}

/* -----------------------------------------------------------
   ADD TEMPLATE TO JOB
----------------------------------------------------------- */
export async function addTemplateAction(jobId: string, path: string) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user;

  const existing = await prisma.job.findUnique({
    where: { id: jobId },
    include: { company: true },
  });

  if (!existing) notFound();

  const allowed =
    user.role === "master" ||
    user.companyId === existing.companyId ||
    user.activeCompanyId === existing.companyId;

  if (!allowed) redirect("/dashboard");

  // CLEAN PATH — remove any accidental leading "templates/"
  const cleanPath = path.replace(/\\/g, "/").replace(/^templates\//, "");

  const template = await prisma.formTemplate.findFirst({
    where: { path: cleanPath },
  });

  await prisma.jobDocument.create({
    data: {
      jobId: existing.id,
      templateId: template?.id ?? null,
      templateName:
        template?.name ??
        cleanPath.split("/").slice(-1)[0] ??
        cleanPath,
      templateSourcePath: cleanPath, // now always clean
      templateOutputPath: null,
    },
  });
}

/* -----------------------------------------------------------
   REMOVE TEMPLATE FROM JOB
----------------------------------------------------------- */
export async function removeTemplateAction(jobDocumentId: string) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const doc = await prisma.jobDocument.findUnique({
    where: { id: jobDocumentId },
    include: { job: true },
  });

  if (!doc) return;

  const user = session.user;

  const allowed =
    user.role === "master" ||
    user.companyId === doc.job.companyId ||
    user.activeCompanyId === doc.job.companyId;

  if (!allowed) redirect("/dashboard");

  await prisma.jobDocument.delete({
    where: { id: jobDocumentId },
  });
}

/* -----------------------------------------------------------
   DELETE JOB
----------------------------------------------------------- */
export async function deleteJobAction(jobId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Not authenticated");

  const supabase = supabaseServer;

  try {
    // 1. Fetch job + company
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { company: true },
    });

    if (!job) throw new Error("Job not found");

    const companyCode = job.company.companyCode;
    const jobNumber = job.jobNumber;

    // 2. Correct Supabase folder path (NO 'companies' folder — bucket root)
    const folderPath = `${companyCode}/jobs/${jobNumber}`;

    // 3. List files inside the folder
    const { data: list, error: listError } = await supabase.storage
      .from("companies")
      .list(folderPath);

    if (listError) {
      console.error("❌ Supabase list error:", listError);
    }

    // 4. Delete files if any exist
    if (list && list.length > 0) {
      const filesToDelete = list.map((f: { name: string }) => `${folderPath}/${f.name}`);

      const { error: deleteFilesError } = await supabase.storage
        .from("companies")
        .remove(filesToDelete);

      if (deleteFilesError) {
        console.error("❌ Supabase delete files error:", deleteFilesError);
      }
    }

    // 5. Attempt to delete the folder itself
    const { error: deleteFolderError } = await supabase.storage
      .from("companies")
      .remove([`${folderPath}/`]);

    if (deleteFolderError) {
      console.error("❌ Supabase delete folder error:", deleteFolderError);
    }

    // 6. Delete job documents
    await prisma.jobDocument.deleteMany({
      where: { jobId },
    });

    // 7. Delete job row
    await prisma.job.delete({
      where: { id: jobId },
    });

    // 8. Refresh dashboard
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err) {
    console.error("❌ deleteJobAction error:", err);
    throw err;
  }
}

/* -----------------------------------------------------------
   CREATE JOB (FULL SAVE)
----------------------------------------------------------- */
export async function createJobAction(formData: FormData) {

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user;

  const jobId = formData.get("job_id") as string | null;
  const companyId = formData.get("company_id") as string | null;
  if (!companyId) notFound();

  // If job already exists → UPDATE instead of CREATE
  if (jobId) {
    return await updateJobAction(formData);
  }

  const rawPrice = formData.get("job_price") as string | null;

  const jobValue = rawPrice
    ? Number(
      rawPrice
        .replace(/\$/g, "")
        .replace(/\s/g, "")
        .replace(/,/g, "")
    )
  : 0;

  // Otherwise create a new job (first save)
  const raw = {
    customerName: formData.get("customer_name") as string | null,
    customerPhone: formData.get("customer_phone") as string | null,
    customerEmail: formData.get("customer_email") as string | null,
    customerAddress: formData.get("customer_address_street") as string | null,
    customerCity: formData.get("customer_address_city") as string | null,
    customerState: formData.get("customer_address_state") as string | null,
    customerZip: formData.get("customer_address_zip") as string | null,
    legalDescription: formData.get("legal_description") as string | null,
    subdivision: formData.get("subdivision") as string | null,
    taxFolioNumber: formData.get("customer_tax_folio") as string | null,
    jobValue: jobValue,
  };

  const formatted = formatJobFields({
    customerName: raw.customerName ?? undefined,
    customerPhone: raw.customerPhone ?? undefined,
    customerAddress: raw.customerAddress ?? undefined,
    customerCity: raw.customerCity ?? undefined,
    customerState: raw.customerState ?? undefined,
    customerZip: raw.customerZip ?? undefined,
    legalDescription: raw.legalDescription ?? undefined,
    jobValue,
  });

  const templatePaths = JSON.parse(
    (formData.get("template_paths") as string) ?? "[]"
  ) as string[];

  const companyDocumentPaths = JSON.parse(
    (formData.get("company_document_paths") as string) ?? "[]"
  ) as string[];

  // Compute next jobNumber
  const lastJob = await prisma.job.findFirst({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });

  const nextJobNumber = lastJob ? lastJob.jobNumber + 1 : 1;

  // Create new job
  const job = await prisma.job.create({
    data: {
      companyId,
      createdBy: user.username,
      description:
        (formData.get("desc_of_improvement") as string | null)?.trim() ?? "",
      jobNumber: nextJobNumber,
      customerName: formatted.customerName,
      customerPhone: formatted.customerPhone,
      customerEmail: raw.customerEmail ?? undefined,
      customerAddress: raw.customerAddress ?? undefined,
      customerCity: formatted.customerCity,
      customerState: formatted.customerState,
      customerZip: formatted.customerZip,
      legalDescription:
        formatted.legalDescription ?? raw.legalDescription ?? undefined,
      subdivision: raw.subdivision ?? undefined,
      taxFolioNumber: raw.taxFolioNumber ?? undefined,
      jobValue: jobValue,
    },
  });

  // TEMPLATES
  for (const path of templatePaths) {
    const cleanPath = path.replace(/\\/g, "/");
  
    const template = await prisma.formTemplate.findFirst({
      where: { path: cleanPath },
    });
  
    await prisma.jobDocument.create({
      data: {
        jobId: job.id,
        templateId: template?.id ?? null,
        templatePath: cleanPath,
        templateSourcePath: cleanPath,
        templateName:
          template?.name ??
          cleanPath.split("/").slice(-1)[0] ??
          cleanPath,
        templateOutputPath: null,
      },
    });
  }
  
  // COMPANY DOCS
  for (const path of companyDocumentPaths) {
    const cleanPath = path.replace(/\\/g, "/");
  
    await prisma.jobDocument.create({
      data: {
        jobId: job.id,
        templateId: null,
        templatePath: cleanPath,
        templateSourcePath: cleanPath,
        templateName: cleanPath.split("/").slice(-1)[0] ?? cleanPath,
        templateOutputPath: null,
      },
    });
  }

  await generatePreviews(job.id);

  redirect(`/dashboard/jobs/${job.id}/preview`);  
} 
