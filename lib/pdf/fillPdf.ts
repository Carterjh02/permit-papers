import {
  PDFDocument,
  PDFTextField,
  StandardFonts,
} from "pdf-lib";

import { AutoMappedField } from "@/lib/mapping/autoMapping";
import { parseLegalDescription } from "@/lib/utils/parseLegalDescription";

import {
  analyzeFields,
  createShrinker,
} from "@/lib/pdf/dynamicShrink";

import {
  formatCompanyFields,
  formatJobFields,
  FormattingPreferences,
  CompanyFields,
  JobFields,
} from "@/lib/utils/formatters";

interface FillPdfOptions {
  templateBuffer: Buffer;
  autoMapped: AutoMappedField[];
  company: Record<string, unknown>;
  job: Record<string, unknown>;
  formattingPrefs: FormattingPreferences;
}

function normalize(name: string | null | undefined): string {
  if (!name) return "";
  return String(name).replace(/\s+/g, "").trim().toLowerCase();
}

export async function fillPdf({
  templateBuffer,
  autoMapped,
  company,
  job,
  formattingPrefs,
}: FillPdfOptions): Promise<Uint8Array> {

  // ============================================================
  // 1. Load PDF + Base Font
  // ============================================================
  const pdfDoc = await PDFDocument.load(templateBuffer);
  const form = pdfDoc.getForm();

  let baseFont;
  switch (formattingPrefs.documentFont) {
    case "times":
      baseFont = await pdfDoc.embedStandardFont(StandardFonts.TimesRoman);
      break;
    case "georgia":
      baseFont = await pdfDoc.embedStandardFont(StandardFonts.TimesRoman);
      break;
    case "roboto":
      baseFont = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
      break;
    default:
      baseFont = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
  }

  const fieldMetaMap = analyzeFields(form.getFields());
  const shrinker = createShrinker(pdfDoc, baseFont, fieldMetaMap);

  const pdfFields = form.getFields().map((f) => ({
    raw: f,
    name: normalize(f.getName()),
  }));

  // ============================================================
  // 2. Apply Formatting Preferences (simple fields ONLY)
  // ============================================================
  const companyCamel: CompanyFields = {
    name: String(company["company_name"] ?? ""),
    qualifierName: String(company["qualifier_name"] ?? ""),
    addressStreet: String(company["company_address_street"] ?? ""),
    addressCity: String(company["company_address_city"] ?? ""),
    addressState: String(company["company_address_state"] ?? ""),
    addressZip: String(company["company_address_zip"] ?? ""),
    address: String(company["company_address_full"] ?? ""),
    phone: String(company["company_phone"] ?? ""),
    email: String(company["company_email"] ?? ""),
    descOfImprov: String(company["desc_of_improv"] ?? ""),
    businessTaxReceipt: String(company["company_tax_id"] ?? ""),
    licenseNumber: String(company["company_license"] ?? ""),
    companyCode: String(company["company_code"] ?? ""),
  };
  
  const formattedCompany = formatCompanyFields(companyCamel, formattingPrefs);
  
  const formattedJob = formatJobFields(
    job as JobFields,
    formattingPrefs
  );

  const formattedCompanyIndexed = formattedCompany as Record<string, unknown>;
  const formattedJobIndexed = formattedJob as Record<string, unknown>;
  const companyIndexed = company as Record<string, unknown>;
  const jobIndexed = job as Record<string, unknown>;

  // ============================================================
  // 3. Allowed Keys
  // ============================================================
  const allowedKeys = new Set([
    // Company
    "company_contact_full",
    "company_name",
    "company_license",
    "company_tax_id",
    "qualifier_name",
    "company_contact",
    "company_phone",
    "company_email",
    "company_name_address",
    "company_address_full",
    "company_address_city_state_zip",
    "company_suite",
    "company_address_street",
    "company_address_city",
    "company_address_state",
    "company_address_zip",
    "company_address_city_state_zip",
    "desc_of_improvement",
    "desc_of_improv",

    // Customer / Job
    "customer_name",
    "customer_phone",
    "customer_email",
    "customer_name_address",
    "customer_address_full",
    "customer_address_street",
    "customer_address_city",
    "customer_address_state",
    "customer_address_zip",
    "customer_tax_folio",
    "job_price",
    "legal_description",

    // Legal description boxes
    ...Array.from({ length: 20 }, (_, i) => `customer_tax_folio${i + 1}`),

    // Abbreviation dictionary fields
    "lot",
    "block",
    "bldg",
    "unit",
    "tract",
    "parcel",
    "sec",
    "twp",
    "rng",
    "folio",
  ]);

  function getAllFields(name: string) {
    const n = normalize(name);
    return pdfFields.filter((f) => f.name === n).map((f) => f.raw);
  }

  // ============================================================
  // 4. AUTO-MAPPED FIELDS (simple fields use formatted values)
  // ============================================================
  for (const mapping of autoMapped) {
    const normalized = normalize(mapping.fieldName);
    if (!allowedKeys.has(normalized)) continue;

    const fields = getAllFields(normalized);
    if (fields.length === 0) continue;

    let value = "";

    if (mapping.source === "company") {
      value = String(
        formattedCompanyIndexed[mapping.key] ??
        formattedCompanyIndexed[normalize(mapping.key)] ??
        companyIndexed[mapping.key] ??
        companyIndexed[normalize(mapping.key)] ??
        ""
      );
    } else if (mapping.source === "job") {
      // mapping.key = "address_street"
      // fieldName = "customer_address_street"
    
      const camelKey = mapping.key === "address_street"
        ? "customerAddress"
        : mapping.key.startsWith("address_")
          ? "customerAddress"
          : "customer" + mapping.key.charAt(0).toUpperCase() + mapping.key.slice(1);
    
      value = String(
        formattedJobIndexed[camelKey] ??
        jobIndexed[normalized] ??
        ""
      );
    }

    if (!value) continue;

    for (const field of fields) {
      if (field instanceof PDFTextField) {
        await shrinker(field, value);
      }
    }
  }

  // ============================================================
  // 5. PARSE LEGAL DESCRIPTION (unchanged)
  // ============================================================
  const legalDescriptionRaw = String(job["legal_description"] ?? "");
  const parsedLegal = parseLegalDescription(legalDescriptionRaw);

  // ============================================================
  // 6. STRICT AUTO-FILL (compound fields use RAW values)
  // ============================================================
  for (const { raw: field, name } of pdfFields) {
    const normalizedName = normalize(name);
    if (!allowedKeys.has(normalizedName)) continue;

    let value: string | number | null | undefined = null;

    // -------------------------
    // Company Contact Full (RAW)
    // -------------------------
    if (normalizedName === "company_contact_full") {
      value = [
        company["company_name"],
        company["company_address_full"],
        company["company_phone"],
      ]
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
        .join(", ");
    }

    // -------------------------
    // Company Name + Address (RAW)
    // -------------------------
    else if (normalizedName === "company_name_address") {
      value = [
        company["company_name"],
        company["company_address_street"],
        company["company_address_city"],
        company["company_address_state"],
        company["company_address_zip"],
      ]
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
        .join(", ");
    }

    // -------------------------
    // Customer Name + Address (RAW)
    // -------------------------
    else if (normalizedName === "customer_name_address") {
      value = [
        job["customer_name"],
        job["customer_address_full"],
      ]
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
        .join(", ");
    }

    // -------------------------
    // Customer Full Address (RAW)
    // -------------------------
    else if (normalizedName === "customer_address_full") {
      value = [
        job["customer_address_street"],
        job["customer_address_city"],
        job["customer_address_state"],
        job["customer_address_zip"],
      ]
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
        .join(", ");
    }

    // -------------------------
    // Company Full Address (RAW)
    // -------------------------
    else if (normalizedName === "company_address_full") {
      value = [
        company["company_address_street"],
        company["company_address_city"],
        company["company_address_state"],
        company["company_address_zip"],
      ]
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
        .join(", ");
    }

    // -------------------------
    // Company Address City, State, Zip (RAW)
    // -------------------------
    else if (normalizedName === "company_address_city_state_zip") {
      value = [
        company["company_address_city"],
        company["company_address_state"],
        company["company_address_zip"],
      ]
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
        .join(", ");
    }

    // -------------------------
    // Description of Improvement (RAW override logic)
    // -------------------------
    else if (
      normalizedName === "desc_of_improvement" ||
      normalizedName === "desc_of_improv"
    ) {
      const jobVal = String(job["desc_of_improvement"] ?? job["desc_of_improv"] ?? "").trim();
      const companyVal = String(company["desc_of_improvement"] ?? company["desc_of_improv"] ?? "").trim();

      value = jobVal || companyVal || "";
    }

    // -------------------------
    // Legal Description Components (RAW)
    // -------------------------
    else if (normalizedName === "lot") value = parsedLegal.lot;
    else if (normalizedName === "block") value = parsedLegal.block;
    else if (normalizedName === "bldg") value = parsedLegal.building;
    else if (normalizedName === "unit") value = parsedLegal.unit;
    else if (normalizedName === "tract") value = parsedLegal.tract;
    else if (normalizedName === "parcel") value = parsedLegal.parcel;
    else if (normalizedName === "sec") value = parsedLegal.section;
    else if (normalizedName === "twp") value = parsedLegal.township;
    else if (normalizedName === "rng") value = parsedLegal.range;
    else if (normalizedName === "folio") value = parsedLegal.folio;

    // -------------------------
    // Job Price (RAW)
    // -------------------------
    else if (normalizedName === "job_price") {
      value = String(job["job_price"] ?? "");
    }

    // -------------------------
    // Tax Folio Split Boxes (RAW)
    // -------------------------
    else if (normalizedName.startsWith("customer_tax_folio")) {
      const full = String(job["customer_tax_folio"] ?? "").trim();

      const parts = full
        .split(/[-\s/]+/)
        .map((p) => p.trim())
        .filter(Boolean);

      if (normalizedName === "customer_tax_folio") {
        value = full;
      } else {
        const index = parseInt(
          normalizedName.replace("customer_tax_folio", ""),
          10
        );
        value = !isNaN(index) ? parts[index - 1] ?? "" : "";
      }
    }
    // -------------------------
    // Default: simple fields use formatted values
    // -------------------------
    else {
      const raw =
        formattedCompanyIndexed[normalizedName] ??
        formattedJobIndexed[normalizedName] ??
        companyIndexed[normalizedName] ??
        jobIndexed[normalizedName] ??
        null;
    
      // Narrow unknown → string | number | null | undefined
      if (
        typeof raw === "string" ||
        typeof raw === "number" ||
        raw === null ||
        raw === undefined
      ) {
        value = raw;
      } else {
        // Handles {} or any other non‑primitive
        value = String(raw ?? "");
      }
    }
    
    if (value == null || value === "") continue;
    
    if (field instanceof PDFTextField) {
      await shrinker(field, String(value));
    }
  }    

  // ============================================================
  // 7. Save PDF
  // ============================================================
  return await pdfDoc.save();
}
