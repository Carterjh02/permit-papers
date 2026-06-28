import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabaseServer";
import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFRadioGroup,
} from "pdf-lib";
import type { Job, Company } from "@prisma/client";
import { parseLegalDescription } from "@/lib/utils/parseLegalDescription";

export async function POST(req: Request) {
  const { jobId, templatePath } = await req.json();

  // Load job + company
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { company: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const company = job.company;

  // Load template record
  const template = await prisma.formTemplate.findFirst({
    where: { path: templatePath },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // Load mappings
  const mappings = await prisma.formFieldMapping.findMany({
    where: { templateId: template.id },
  });

  // Download template PDF
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
      } catch {}
    }
  }

  /* ---------------------------------------------------------
     AUTO-MAPPING
  --------------------------------------------------------- */
  const companyIndexed = filterIndexable(company ?? {});
  const jobIndexed = filterIndexable(job as unknown as Record<string, unknown>);

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
    } else if (name === "lot") {
      value = parsedLegal.lot;
    } else if (name === "block") {
      value = parsedLegal.block;
    } else if (name === "bldg") {
      value = parsedLegal.building;
    } else if (name === "unit") {
      value = parsedLegal.unit;
    } else if (name === "tract") {
      value = parsedLegal.tract;
    } else if (name === "parcel") {
      value = parsedLegal.parcel;
    } else if (name === "sec") {
      value = parsedLegal.section;
    } else if (name === "twp") {
      value = parsedLegal.township;
    } else if (name === "rng") {
      value = parsedLegal.range;
    } else if (name === "folio") {
      value = parsedLegal.folio;
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
  } catch {}

  const filledPdfBytes = await pdfDoc.save();

  /* ---------------------------------------------------------
     SAVE TO FLAT STORAGE
     Bucket: companies
     Path inside bucket: <companyCode>/jobs/<jobNumber>/<fileName>
  --------------------------------------------------------- */
  const safeCompany = company.companyCode.replace(/[^a-zA-Z0-9-_ ]/g, "");
  const jobNumber = job.jobNumber;

  // FIX: use template.name EXACTLY as stored (no .pdf added)
  const fileName = template.name;

  // FIX: correct flat path
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

  // Public URL
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
  job: Job & { company: Company | null },
  company: Company | null
): string | number | boolean | null {
  switch (key) {
    case "company_name":
      return company?.name ?? null;
    case "company_license":
      return company?.licenseNumber ?? null;
    case "qualifier_name":
      return company?.qualifierName ?? null;
    case "phone":
      return company?.phone ?? null;
    case "email":
      return company?.email ?? null;
    case "address_full":
      return company?.address ?? null;

    case "customer_name":
      return job.customerName ?? null;
    case "customer_phone":
      return job.customerPhone ?? null;
    case "customer_email":
      return job.customerEmail ?? null;
    case "customer_address_full":
      return job.customerAddress ?? null;
    case "customer_address_city":
      return job.customerCity ?? null;
    case "customer_address_state":
      return job.customerState ?? null;
    case "customer_adddress_zip":
      return job.customerZip ?? null;
    case "customer_tax_folio":
      return job.taxFolioNumber ?? null;
    case "job_price":
      return job.jobValue ?? null;
    case "legal_description":
      return job.legalDescription ?? null;

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

  const parts = [name, address, phone].filter((p) => p.length > 0);
  return parts.join(", ");
}

function formatCustomerNameAddress(
  job: Record<string, string | number | null | undefined>
): string {
  const name = String(job["customer_name"] ?? "").trim();
  const address =
    String(job["customer_address_full"] ?? job["customer_address"] ?? "").trim();

  const parts = [name, address].filter((p) => p.length > 0);
  return parts.join(", ");
}

function formatDescOfImprovement(
  company: Record<string, string | number | null | undefined>,
  job: Record<string, string | number | null | undefined>
): string {
  const companyDesc = String(company["desc_of_improvement"] ?? "").trim();
  const jobDesc = String(job["desc_of_improvement"] ?? job["description"] ?? "").trim();

  return companyDesc || jobDesc;
}
