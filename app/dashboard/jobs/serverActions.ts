"use server";

import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabaseServer";

import { autoMapFields } from "@/lib/autoMapping";
import { fillPdf } from "@/lib/pdf/fillPdf";
import { uploadPdf } from "@/lib/uploadPdf";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { redirect, notFound } from "next/navigation";
import { formatJobFields } from "@/lib/utils/formatters";


/* -----------------------------------------------------------
   GENERATE PREVIEWS (MOVED HERE)
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
      // Skip if no templateSourcePath (TS fix)
      if (!doc.templateSourcePath) {
        console.log("⚠️ No templateSourcePath for document:", doc.id);
        continue;
      }

      // 1. Download BLANK template from templates bucket
      const { data, error } = await supabaseServer.storage
        .from("templates")
        .download(doc.templateSourcePath);

      if (error || !data) {
        console.log("❌ Failed to download template:", doc.templateSourcePath);
        continue;
      }

      const buffer = Buffer.from(await data.arrayBuffer());

      // 2. Load field names from FormTemplate
      const template = await prisma.formTemplate.findFirst({
        where: { path: doc.templateSourcePath },
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

      // 4. Fill the PDF
      const filled = await fillPdf({
        templateBuffer: buffer,
        autoMapped,
        company: companyData,
        job: jobData,
      });

      // 5. Upload filled PDF
      const outputPath = `${companyCode}/jobs/${jobNumber}/${doc.templateName}.pdf`;

      await uploadPdf({
        companyCode,
        jobNumber,
        documentName: doc.templateName,
        pdfBytes: filled,
      });

      // 6. Update database with output path
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

  const safeCompany = company.companyCode.replace(/[^a-zA-Z0-9-_]/g, "");
  const safeJobNumber = String(nextJobNumber).replace(/[^0-9]/g, "");

  await supabaseServer.storage
    .from("companies")
    .upload(`${safeCompany}/jobs/${safeJobNumber}/.keep`, new Uint8Array(), {
      upsert: true,
      contentType: "text/plain",
    });

  return job;
}

/* -----------------------------------------------------------
   UPLOAD SNIPPET IMMEDIATELY
----------------------------------------------------------- */
export async function uploadSnippetImmediately(jobId: string, file: File) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { company: true },
  });

  if (!job) throw new Error("Job not found.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const path = `${job.company.companyCode}/jobs/${job.jobNumber}/snippet.png`;

  const { error } = await supabaseServer.storage
    .from("companies")
    .upload(path, buffer, {
      upsert: true,
      contentType: file.type || "image/png",
    });

  if (error) throw new Error("Failed to upload snippet.");

  await prisma.job.update({
    where: { id: jobId },
    data: { snippetPath: path },
  });

  return {
    publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/companies/${path}`,
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

  const description =
    (formData.get("desc_of_improvement") as string | null)?.trim() ||
    existing.company?.descOfImprov ||
    existing.description ||
    "";

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
   ADD TEMPLATE
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

  const cleanPath = path.replace(/\\/g, "/");

  const template = await prisma.formTemplate.findFirst({
    where: { path: cleanPath },
  });

  await prisma.jobDocument.create({
    data: {
      jobId: existing.id,
      templateId: template?.id ?? null,
      templateName: template?.name ?? cleanPath.split("/").slice(-1)[0] ?? cleanPath,
  
      templateSourcePath: cleanPath,
  
      templateOutputPath: null,
    },
  });
  
}

/* -----------------------------------------------------------
   REMOVE TEMPLATE
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
  await prisma.job.delete({
    where: { id: jobId },
  });

  redirect("/dashboard");
}
/* -----------------------------------------------------------
   CREATE JOB (FULL SAVE)
----------------------------------------------------------- */
export async function createJobAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user;

  const companyId = formData.get("company_id") as string | null;
  if (!companyId) notFound();

  const description = (formData.get("description") as string | null) ?? "";

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

  const templatePaths = JSON.parse(
    (formData.get("template_paths") as string) ?? "[]"
  ) as string[];

  const job = await prisma.job.create({
    data: {
      companyId,
      createdBy: user.username,
      description,
      jobNumber: 0, // your schema requires this
      customerName: raw.customerName ?? undefined,
      customerPhone: raw.customerPhone ?? undefined,
      customerEmail: raw.customerEmail ?? undefined,
      customerAddress: raw.customerAddress ?? undefined,
      customerCity: raw.customerCity ?? undefined,
      customerState: raw.customerState ?? undefined,
      customerZip: raw.customerZip ?? undefined,
      legalDescription: raw.legalDescription ?? undefined,
      subdivision: raw.subdivision ?? undefined,
      taxFolioNumber: raw.taxFolioNumber ?? undefined,
      jobValue: raw.jobValue ?? undefined,
    },
  });

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
        templateName:
          template?.name ??
          cleanPath.split("/").slice(-1)[0] ??
          cleanPath,
      },
    });
  }

  redirect(`/dashboard/jobs/${job.id}/preview`);
}
