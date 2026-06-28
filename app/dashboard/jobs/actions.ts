"use server";

import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabaseServer";
import { autoMapFields } from "@/lib/autoMapping";
import { fillPdf } from "@/lib/pdf/fillPdf";
import { uploadPdf } from "@/lib/uploadPdf";

import { runOCR } from "@/lib/extraction/ocr";
import { parseCustomerInfo } from "@/lib/extraction/parseText";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

import { ExtractedInfo, ExtractedInfoSchema } from "@/lib/types/ocr";
import { formatJobFields } from "@/lib/utils/formatters";

/* ---------------------------------------------------------
   DELETE JOB
--------------------------------------------------------- */
export async function deleteJob(jobId: string) {
  console.log("=== DELETE JOB START ===", jobId);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { company: true, documents: true },
  });

  if (!job) throw new Error("Job not found.");

  const companyCode = job.company.companyCode;
  const jobNumber = job.jobNumber;

  const safeCompany = companyCode.replace(/[^a-zA-Z0-9-_]/g, "");
  const safeJobNumber = String(jobNumber).replace(/[^0-9]/g, "");

  const folderPath = `${safeCompany}/jobs/${safeJobNumber}`;

  await supabaseServer.storage
    .from("companies")
    .remove([`${folderPath}/`]);

  await prisma.jobDocument.deleteMany({ where: { jobId } });

  await prisma.job.delete({ where: { id: jobId } });

  console.log("=== DELETE JOB END ===");
}

/* ---------------------------------------------------------
   GENERATE PREVIEWS
--------------------------------------------------------- */
export async function generatePreviews(jobId: string) {
  console.log("=== GENERATE PREVIEWS START ===", jobId);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { company: true, documents: true },
  });

  if (!job) throw new Error("Job not found.");

  const companyCode = job.company.companyCode;
  const jobNumber = job.jobNumber;

  for (const doc of job.documents) {
    try {
      const { data, error } = await supabaseServer.storage
        .from("templates")
        .download(doc.templatePath);

      if (error || !data) continue;

      const buffer = Buffer.from(await data.arrayBuffer());

      const template = await prisma.formTemplate.findFirst({
        where: { path: doc.templatePath },
      });

      const fieldNames = Array.isArray(template?.fieldNames)
        ? (template.fieldNames as string[])
        : [];

      const autoMapped = autoMapFields(fieldNames);

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

        // 🔥 company-level default description
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

        // 🔥 job-level edited description
        desc_of_improv: job.description ?? "",
      };

      const filled = await fillPdf({
        templateBuffer: buffer,
        autoMapped,
        company: companyData,
        job: jobData,
      });

      await uploadPdf({
        companyCode,
        jobNumber,
        documentName: doc.templateName,
        pdfBytes: filled,
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

  console.log("=== GENERATE PREVIEWS END ===");
}

/* ---------------------------------------------------------
   ENSURE JOB STORAGE
--------------------------------------------------------- */
export async function ensureJobStorage(companyCode: string, jobNumber: number) {
  const safeCompany = companyCode.replace(/[^a-zA-Z0-9-_]/g, "");
  const safeJobNumber = String(jobNumber).replace(/[^0-9]/g, "");

  const base = `${safeCompany}/jobs/${safeJobNumber}`;

  await supabaseServer.storage
    .from("companies")
    .upload(`${base}/.keep`, new Uint8Array(), {
      upsert: true,
      contentType: "text/plain",
    });
}

/* ---------------------------------------------------------
   CREATE MINIMAL JOB
--------------------------------------------------------- */
export async function createMinimalJob(companyId: string, createdBy: string) {
  console.log("=== CREATE MINIMAL JOB START ===", companyId);

  const company = await prisma.company.findUnique({ where: { id: companyId } });
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

  await ensureJobStorage(company.companyCode, nextJobNumber);

  console.log("=== CREATE MINIMAL JOB END ===", job.id);

  return job;
}

/* ---------------------------------------------------------
   CREATE JOB (FULL SAVE)
--------------------------------------------------------- */
export async function createJob(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user;

  const companyId =
    user.role === "master" ? user.activeCompanyId : user.companyId;

  if (!companyId) throw new Error("Company not selected.");

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error("Company not found.");

  const existingJobId = formData.get("job_id") as string | null;

  let job;
  let jobNumber: number;

  if (existingJobId) {
    job = await prisma.job.findUnique({ where: { id: existingJobId } });
    if (!job) throw new Error("Minimal job not found.");

    jobNumber = job.jobNumber;
  } else {
    const lastJob = await prisma.job.findFirst({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });

    jobNumber = lastJob ? lastJob.jobNumber + 1 : 1;

    job = await prisma.job.create({
      data: {
        companyId,
        jobNumber,
        createdBy: user.username,
      },
    });

    await ensureJobStorage(company.companyCode, jobNumber);
  }

  const customerName = formData.get("customer_name") as string | null;
  const customerPhone = formData.get("customer_phone") as string | null;
  const customerEmail = formData.get("customer_email") as string | null;

  const customerAddress = formData.get("customer_address_full") as string | null;
  const customerCity = formData.get("customer_address_city") as string | null;
  const customerState = formData.get("customer_address_state") as string | null;
  const customerZip = formData.get("customer_address_zip") as string | null;

  const legalDescription = formData.get("legal_description") as string | null;
  const subdivision = formData.get("subdivision") as string | null;

  const taxFolioNumber = formData.get("customer_tax_folio") as string | null;
  const jobValue = formData.get("job_price")
    ? Number(formData.get("job_price"))
    : null;

  const description =
    (formData.get("desc_of_improvement") as string | null)?.trim() || "";

  const rawTemplates = formData.get("template_paths") as string | null;
  const selectedPaths: string[] = rawTemplates ? JSON.parse(rawTemplates) : [];

  const formatted = formatJobFields({
    customerName: customerName ?? undefined,
    customerPhone: customerPhone ?? undefined,
    customerAddress: customerAddress ?? undefined,
    customerCity: customerCity ?? undefined,
    customerState: customerState ?? undefined,
    customerZip: customerZip ?? undefined,
    legalDescription: legalDescription ?? undefined,
  });

  await prisma.job.update({
    where: { id: job.id },
    data: {
      customerName: formatted.customerName,
      customerPhone: formatted.customerPhone,
      customerEmail: customerEmail ?? undefined,
      customerAddress: formatted.customerAddress,
      customerCity: formatted.customerCity,
      customerState: formatted.customerState,
      customerZip: formatted.customerZip,

      legalDescription:
        formatted.legalDescription ?? legalDescription ?? undefined,
      subdivision: subdivision ?? undefined,

      taxFolioNumber: taxFolioNumber ?? undefined,
      jobValue,
      description,
    },
  });

  // 🔥 FIX: Always create JobDocument rows for every selected path,
  // even if there is no matching FormTemplate record.
  if (selectedPaths.length > 0) {
    const templates = await prisma.formTemplate.findMany({
      where: { path: { in: selectedPaths } },
    });

    const templateByPath = new Map<string, (typeof templates)[number]>();
    for (const t of templates) {
      templateByPath.set(t.path, t);
    }

    await prisma.jobDocument.deleteMany({ where: { jobId: job.id } });

    await Promise.all(
      selectedPaths.map(async (path) => {
        const cleanPath = path.replace(/\\/g, "/");
        const template = templateByPath.get(cleanPath);

        const templateName =
          template?.name ?? cleanPath.split("/").slice(-1)[0] ?? cleanPath;

        await prisma.jobDocument.create({
          data: {
            jobId: job.id,
            templateId: template?.id ?? null,
            templatePath: cleanPath,
            templateName,
          },
        });
      })
    );
  }

  await generatePreviews(job.id);

  redirect(`/dashboard/jobs/${job.id}/preview`);
}

/* ---------------------------------------------------------
  UPLOAD SNIPPET IMMEDIATELY
--------------------------------------------------------- */
export async function uploadSnippetImmediately(jobId: string, file: File) {
  console.log("=== UPLOAD SNIPPET IMMEDIATELY START ===", jobId);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { company: true },
  });

  if (!job) throw new Error("Job not found.");

  const companyCode = job.company.companyCode;
  const jobNumber = job.jobNumber;

  const buffer = Buffer.from(await file.arrayBuffer());

  const path = `${companyCode}/jobs/${jobNumber}/snippet.png`;

  const { error } = await supabaseServer.storage
    .from("companies")
    .upload(path, buffer, {
      upsert: true,
      contentType: file.type || "image/png",
    });

  if (error) {
    console.error("❌ Failed to upload snippet:", error);
    throw new Error("Failed to upload snippet.");
  }

  await prisma.job.update({
    where: { id: jobId },
    data: { snippetPath: path },
  });

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/companies/${path}`;

  console.log("=== UPLOAD SNIPPET IMMEDIATELY END ===");

  return { publicUrl };
}

/* ---------------------------------------------------------
   EXTRACT CUSTOMER INFO
--------------------------------------------------------- */
export async function extractCustomerInfo(jobId: string): Promise<ExtractedInfo> {
  console.log("=== EXTRACT CUSTOMER INFO START ===", jobId);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { company: true },
  });

  if (!job) throw new Error("Job not found.");
  if (!job.snippetPath) throw new Error("No snippet uploaded for this job.");

  const { data, error } = await supabaseServer.storage
    .from("companies")
    .download(job.snippetPath);

  if (error || !data) {
    console.error("❌ Failed to download snippet:", error);
    throw new Error("Could not download snippet.");
  }

  const buffer = Buffer.from(await data.arrayBuffer());

  let ocrText = "";
  try {
    ocrText = await runOCR(buffer);
  } catch (err) {
    console.error("❌ OCR failed:", err);
    throw new Error("OCR failed.");
  }

  const parsed = parseCustomerInfo(ocrText);

  const validated = ExtractedInfoSchema.parse(parsed);

  console.log("=== OCR PARSED RESULT ===", validated);

  return validated;
}

/* ---------------------------------------------------------
   APPLY EXTRACTED INFO
--------------------------------------------------------- */
export async function applyExtractedInfo(
  jobId: string,
  data: ExtractedInfo
) {
  console.log("=== APPLY EXTRACTED INFO START ===", jobId, data);

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Job not found.");

  const updateData: Partial<{
    customerName: string;
    customerAddress: string;
    customerCity: string;
    customerState: string;
    customerZip: string;
    taxFolioNumber: string;
    subdivision: string;
  }> = {};

  if (data.name) updateData.customerName = data.name;
  if (data.address) updateData.customerAddress = data.address;
  if (data.city) updateData.customerCity = data.city;
  if (data.state) updateData.customerState = data.state;
  if (data.zip) updateData.customerZip = data.zip;
  if (data.folio) updateData.taxFolioNumber = data.folio;
  if (data.subdivision) updateData.subdivision = data.subdivision;

  await prisma.job.update({
    where: { id: jobId },
    data: updateData,
  });

  console.log("=== APPLY EXTRACTED INFO END ===");

  redirect(`/dashboard/jobs/${jobId}/edit`);
}
