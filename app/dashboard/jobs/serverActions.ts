"use server";

import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabaseServer";
import { autoMapFields } from "@/lib/autoMapping";
import { fillPdf } from "@/lib/pdf/fillPdf";
import { uploadPdf } from "@/lib/uploadPdf";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { redirect, notFound } from "next/navigation";
import { formatJobFields } from "@/lib/utils/formatters";

// OCR imports
import vision from "@google-cloud/vision";

// OCR client
const visionClient = new vision.ImageAnnotatorClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL!,
    private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  },
  projectId: process.env.GOOGLE_PROJECT_ID!,
});

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
        console.log("⚠️ No templateSourcePath for document:", doc.id);
        continue;
      }

      // CLEAN PATH — remove accidental "templates/" prefix
      const cleanSourcePath = doc.templateSourcePath.replace(/^templates\//, "");

      // 1. Download blank template
      const { data, error } = await supabaseServer.storage
        .from("templates")
        .download(cleanSourcePath);

      if (error || !data) {
        console.log("❌ Failed to download template:", cleanSourcePath);
        continue;
      }

      const buffer = Buffer.from(await data.arrayBuffer());

      // 2. Load field names
      const template = await prisma.formTemplate.findFirst({
        where: { path: cleanSourcePath },
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
        job_price: job.jobValue ?? "",
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

      // 5. Build SAFE filename (matches uploadPdf)
      let safeDocumentName = doc.templateName
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "");

      if (!safeDocumentName.toLowerCase().endsWith(".pdf")) {
        safeDocumentName += ".pdf";
      }

      const outputPath = `${companyCode}/jobs/${jobNumber}/${safeDocumentName}`;

      // 6. Upload filled PDF using safe name
      await uploadPdf({
        companyCode,
        jobNumber,
        documentName: safeDocumentName,
        pdfBytes: filled,
      });

      // 7. Update DB with correct path
      await prisma.jobDocument.update({
        where: { id: doc.id },
        data: { templateOutputPath: outputPath },
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

  const safeCompany = company?.companyCode?.replace(/[^a-zA-Z0-9-_]/g, "") ?? "";
  const safeJobNumber = String(nextJobNumber ?? "").replace(/[^0-9]/g, "");

  await supabaseServer.storage
    .from("companies")
    .upload(`${safeCompany}/jobs/${safeJobNumber}/.keep`, new Uint8Array(), {
      upsert: true,
      contentType: "text/plain",
    });

  return job;
}

// OCR name normalizer (ONLY applied to OCR-extracted names)
function normalizeOCRName(name: string | undefined): string | undefined {
  if (!name) return name;

  // If OCR gives "Last, First", flip it
  if (name.includes(",")) {
    const [last, first] = name.split(",").map((s) => s.trim());
    return `${first} ${last}`.trim();
  }

  return name.trim();
}

// Simple OCR text parser
function parseCustomerInfo(text: string) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const result: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    folio?: string;
    subdivision?: string;
  } = {};  

  // Name: first non-empty line (apply OCR name normalization)
  if (lines.length > 0) {
    result.name = normalizeOCRName(lines[0]);
  }

  // Address: second line
  if (lines.length > 1) result.address = lines[1];

  // City, State, Zip
  const csz = lines.find(l => /,\s*[A-Z]{2}\s+\d{5}/.test(l));
  if (csz) {
    const m = csz.match(/^(.+),\s*([A-Z]{2})\s+(\d{5})/);
    if (m) {
      result.city = m[1].trim();
      result.state = m[2].trim();
      result.zip = m[3].trim();
    }
  }

  // Folio
  const folioLine = lines.find(l => /folio|parcel/i.test(l));
  if (folioLine) {
    const m = folioLine.match(/(\d[\d\-]+)/);
    if (m) result.folio = m[1].trim();
  }

  // Subdivision
  const subdivisionLine = lines.find(l => /subdivision/i.test(l));
  if (subdivisionLine) {
    result.subdivision = subdivisionLine.replace(/.*subdivision[:\s]*/i, "").trim();
  }

  return result;
}

/* -----------------------------------------------------------
   UPLOAD SNIPPET
----------------------------------------------------------- */
export async function uploadSnippetImmediately(jobId: string, file: File) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { company: true },
  });
  if (!job) throw new Error("Job not found.");

  // 1. Upload snippet to Supabase
  const buffer = Buffer.from(await file.arrayBuffer());
  const path = `${job.company.companyCode}/jobs/${job.jobNumber}/snippet.png`;

  const { error } = await supabaseServer.storage
    .from("companies")
    .upload(path, buffer, {
      upsert: true,
      contentType: file.type || "image/png",
    });

  if (error) throw new Error("Failed to upload snippet.");

  // 2. Download snippet for OCR
  const { data: downloaded, error: downloadError } = await supabaseServer.storage
    .from("companies")
    .download(path);

  if (downloadError || !downloaded) {
    throw new Error("Failed to download snippet for OCR.");
  }

  const downloadedBuffer = Buffer.from(await downloaded.arrayBuffer());

  // 3. Run OCR
  const [result] = await visionClient.textDetection(downloadedBuffer);
  const fullText = result.fullTextAnnotation?.text ?? "";

  // 4. Parse OCR text
  const parsed = parseCustomerInfo(fullText);

  // 5. Update job with parsed fields
  await prisma.job.update({
    where: { id: jobId },
    data: {
      snippetPath: path,
      customerName: parsed.name ?? job.customerName,
      customerAddress: parsed.address ?? job.customerAddress,
      customerCity: parsed.city ?? job.customerCity,
      customerState: parsed.state ?? job.customerState,
      customerZip: parsed.zip ?? job.customerZip,
      taxFolioNumber: parsed.folio ?? job.taxFolioNumber,
      subdivision: parsed.subdivision ?? job.subdivision,
    },
  });

  // 6. Return OCR text + parsed fields + public URL
  return {
    publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/companies/${path}`,
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
    customerAddress: formData.get("customer_address_full") as string | null,
    customerCity: formData.get("customer_address_city") as string | null,
    customerState: formData.get("customer_address_state") as string | null,
    customerZip: formData.get("customer_address_zip") as string | null,
    legalDescription: formData.get("legal_description") as string | null,
  };

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
  const jobValue = formData.get("job_price")
    ? Number(formData.get("job_price"))
    : null;

  // ALWAYS use user-entered description
  const description =
    (formData.get("desc_of_improvement") as string | null)?.trim() ?? "";

  await prisma.job.update({
    where: { id: targetId },
    data: {
      customerName: formatted.customerName,
      customerPhone: formatted.customerPhone,
      customerEmail: raw.customerEmail ?? undefined,
      customerAddress: formatted.customerAddress,
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

  await generatePreviews(targetId);

  redirect(`/dashboard/jobs/${targetId}/preview`);
}

/* -----------------------------------------------------------
   ADD TEMPLATE TO JOB
----------------------------------------------------------- */
export async function addTemplateAction(jobId: string, path: string) {
  const session = await getServerSession();
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
  const session = await getServerSession();
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
  const session = await getServerSession();
  if (!session) redirect("/login");

  const user = session.user;

  const jobId = formData.get("job_id") as string | null;
  const companyId = formData.get("company_id") as string | null;
  if (!companyId) notFound();

  // If job already exists → UPDATE instead of CREATE
  if (jobId) {
    return await updateJobAction(formData);
  }

  // Otherwise create a new job (first save)
  const raw = {
    customerName: formData.get("customer_name") as string | null,
    customerPhone: formData.get("customer_phone") as string | null,
    customerEmail: formData.get("customer_email") as string | null,
    customerAddress: formData.get("customer_address_full") as string | null,
    customerCity: formData.get("customer_address_city") as string | null,
    customerState: formData.get("customer_address_state") as string | null,
    customerZip: formData.get("customer_address_zip") as string | null,
    legalDescription: formData.get("legal_description") as string | null,
    subdivision: formData.get("subdivision") as string | null,
    taxFolioNumber: formData.get("customer_tax_folio") as string | null,
    jobValue: formData.get("job_price")
      ? Number(formData.get("job_price"))
      : null,
  };

  const formatted = formatJobFields({
    customerName: raw.customerName ?? undefined,
    customerPhone: raw.customerPhone ?? undefined,
    customerAddress: raw.customerAddress ?? undefined,
    customerCity: raw.customerCity ?? undefined,
    customerState: raw.customerState ?? undefined,
    customerZip: raw.customerZip ?? undefined,
    legalDescription: raw.legalDescription ?? undefined,
  });

  const templatePaths = JSON.parse(
    (formData.get("template_paths") as string) ?? "[]"
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
      customerAddress: formatted.customerAddress,
      customerCity: formatted.customerCity,
      customerState: formatted.customerState,
      customerZip: formatted.customerZip,
      legalDescription:
        formatted.legalDescription ?? raw.legalDescription ?? undefined,
      subdivision: raw.subdivision ?? undefined,
      taxFolioNumber: raw.taxFolioNumber ?? undefined,
      jobValue: raw.jobValue ?? undefined,
    },
  });

  // Create JobDocument rows
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

  await generatePreviews(job.id);

  redirect(`/dashboard/jobs/${job.id}/preview`);
}