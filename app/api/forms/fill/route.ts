export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabaseServer";
import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFRadioGroup,
} from "pdf-lib";
import { parseLegalDescription } from "@/lib/utils/parseLegalDescription";

type AnyRecord = Record<string, unknown>;

export async function POST(req: Request) {
  const { jobId, templatePath } = await req.json();

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { company: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const company = job.company;

  const template = await prisma.formTemplate.findFirst({
    where: { path: templatePath },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const mappings = await prisma.formFieldMapping.findMany({
    where: { templateId: template.id },
  });

  const { data: fileData, error: downloadError } = await supabaseServer.storage
    .from("templates")
    .download(template.path);

  if (downloadError || !fileData) {
    return NextResponse.json(
      { error: "Failed to download template PDF" },
      { status: 500 }
    );
  }

  const pdfBytes = await fileData.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  const pdfFields = form.getFields().map((f) => ({
    raw: f,
    name: f.getName().trim().toLowerCase(),
  }));

  /* ---------------------------------------------------------
     EXPLICIT MAPPINGS
  --------------------------------------------------------- */
  for (const mapping of mappings) {
    const normalized = mapping.pdfFieldName.trim().toLowerCase();
    const match = pdfFields.find((f) => f.name === normalized);
    if (!match) continue;

    const field = match.raw;
    const value = resolveMappedValue(mapping.mappedTo, job, company);
    if (value == null || value === "") continue;

    if (field instanceof PDFTextField) {
      field.setText(String(value));
    } else if (field instanceof PDFCheckBox) {
      const truthy =
        value === true ||
        value === "true" ||
        value === "yes" ||
        value === "1";

      if (truthy) {
        field.check();
      } else {
        field.uncheck();
      }
    } else if (field instanceof PDFRadioGroup) {
      try {
        field.select(String(value));
      } catch {
        // ignore invalid radio selections
      }
    }
  }

  /* ---------------------------------------------------------
     AUTO-MAPPING
  --------------------------------------------------------- */
  const companyIndexed = filterIndexable(company ?? {});
  const jobIndexed = filterIndexable(job as unknown as AnyRecord);

  const legalDescriptionRaw = String(jobIndexed["legal_description"] ?? "");
  const parsedLegal = parseLegalDescription(legalDescriptionRaw);

  for (const { raw: field, name } of pdfFields) {
    let value: string | number | null | undefined = null;

    if (name === "company_contact_full") {
      value = formatCompanyContactFull(companyIndexed);
    } else if (name === "customer_name_address") {
      value = formatCustomerNameAddress(jobIndexed);
    } else if (name === "desc_of_improvement") {
      value = formatDescOfImprovement(companyIndexed, jobIndexed);
    } else if (name in parsedLegal) {
      value = parsedLegal[name as keyof typeof parsedLegal];
    } else {
      value = companyIndexed[name] ?? jobIndexed[name] ?? null;
    }

    if (value == null || value === "") continue;

    if (field instanceof PDFTextField) {
      field.setText(String(value));
    }
  }

  try {
    form.flatten();
  } catch {
    // flatten fails on some PDFs — safe to ignore
  }

  const filledPdfBytes = await pdfDoc.save();

  const safeCompany = company.companyCode.replace(/[^a-zA-Z0-9-_ ]/g, "");
  const jobNumber = job.jobNumber;
  const fileName = template.name;
  const outputPath = `${safeCompany}/jobs/${jobNumber}/${fileName}`;

  const { error: uploadError } = await supabaseServer.storage
    .from("companies")
    .upload(outputPath, filledPdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "Failed to upload filled PDF" },
      { status: 500 }
    );
  }

  const { data: publicUrlData } = supabaseServer.storage
    .from("companies")
    .getPublicUrl(outputPath);

  return NextResponse.json({ url: publicUrlData.publicUrl });
}

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function resolveMappedValue(
  key: string,
  job: AnyRecord,
  company: AnyRecord | null
): string | number | boolean | null {
  switch (key) {
    case "company_name":
      return (company?.name as string) ?? null;
    case "company_license":
      return (company?.licenseNumber as string) ?? null;
    case "qualifier_name":
      return (company?.qualifierName as string) ?? null;
    case "phone":
      return (company?.phone as string) ?? null;
    case "email":
      return (company?.email as string) ?? null;
    case "address_full":
      return (company?.address as string) ?? null;

    case "customer_name":
      return (job.customerName as string) ?? null;
    case "customer_phone":
      return (job.customerPhone as string) ?? null;
    case "customer_email":
      return (job.customerEmail as string) ?? null;
    case "customer_address_full":
      return (job.customerAddress as string) ?? null;
    case "customer_address_city":
      return (job.customerCity as string) ?? null;
    case "customer_address_state":
      return (job.customerState as string) ?? null;
    case "customer_adddress_zip":
      return (job.customerZip as string) ?? null;
    case "customer_tax_folio":
      return (job.taxFolioNumber as string) ?? null;
    case "job_price":
      return (job.jobValue as number) ?? null;
    case "legal_description":
      return (job.legalDescription as string) ?? null;

    default:
      return null;
  }
}

function filterIndexable(
  obj: Record<string, unknown>
): Record<string, string | number | null | undefined> {
  const out: Record<string, string | number | null | undefined> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      value === null ||
      value === undefined
    ) {
      out[key.toLowerCase()] = value;
    }
  }

  return out;
}

function formatCompanyContactFull(
  company: Record<string, string | number | null | undefined>
): string {
  const name = String(company["company_name"] ?? company["name"] ?? "").trim();
  const address = String(company["address_full"] ?? company["address"] ?? "").trim();
  const phone = String(company["phone"] ?? "").trim();

  return [name, address, phone].filter(Boolean).join(", ");
}

function formatCustomerNameAddress(
  job: Record<string, string | number | null | undefined>
): string {
  const name = String(job["customer_name"] ?? "").trim();
  const address =
    String(job["customer_address_full"] ?? job["customer_address"] ?? "").trim();

  return [name, address].filter(Boolean).join(", ");
}

function formatDescOfImprovement(
  company: Record<string, string | number | null | undefined>,
  job: Record<string, string | number | null | undefined>
): string {
  const companyDesc = String(company["desc_of_improvement"] ?? "").trim();
  const jobDesc = String(job["desc_of_improvement"] ?? job["description"] ?? "").trim();

  return companyDesc || jobDesc;
}
