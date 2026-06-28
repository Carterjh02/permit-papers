// -----------------------------
// Basic Helpers
// -----------------------------

export function toTitleCase(str?: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

export function toUpper(str?: string): string {
  return str ? str.toUpperCase().trim() : "";
}

export function normalizeZip(str?: string): string {
  if (!str) return "";
  const digits = str.replace(/\D/g, "");
  return digits.slice(0, 5);
}

export function normalizePhone(str?: string): string {
  if (!str) return "";
  const digits = str.replace(/\D/g, "");
  if (digits.length !== 10) return str.trim();
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// -----------------------------
// Company Field Formatting
// -----------------------------

export interface CompanyFields {
  name?: string;
  qualifierName?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  address?: string; // <-- added
  phone?: string;
  email?: string;
  descOfImprov?: string;
  businessTaxReceipt?: string;
  website?: string;
  licenseNumber?: string;
  companyCode?: string;
}

export function formatCompanyFields(company: CompanyFields): CompanyFields {
  return {
    ...company,

    name: toTitleCase(company.name),
    qualifierName: toTitleCase(company.qualifierName),

    addressStreet: toTitleCase(company.addressStreet),
    addressCity: toTitleCase(company.addressCity),
    addressState: toUpper(company.addressState),
    addressZip: normalizeZip(company.addressZip),

    // NEW: normalize full address if present
    address: company.address?.trim() || undefined,

    phone: normalizePhone(company.phone),
    email: company.email?.trim() || "",
    website: company.website?.trim() || "",

    descOfImprov: company.descOfImprov?.trim() || "",
    businessTaxReceipt: company.businessTaxReceipt?.trim() || "",
    licenseNumber: company.licenseNumber?.trim() || "",

    // NEW: enforce uppercase companyCode
    companyCode: company.companyCode?.trim().toUpperCase(),
  };
}

// -----------------------------
// Job Field Formatting
// -----------------------------

export interface JobFields {
  customerName?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerZip?: string;
  customerPhone?: string;
  customerEmail?: string;

  companyName?: string;
  companyQualifierName?: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyPhone?: string;

  legalDescription?: string;
}

export function formatJobFields(job: JobFields): JobFields {
  return {
    ...job,

    customerName: toTitleCase(job.customerName),
    customerAddress: toTitleCase(job.customerAddress),
    customerCity: toTitleCase(job.customerCity),
    customerState: toUpper(job.customerState),
    customerZip: normalizeZip(job.customerZip),
    customerPhone: normalizePhone(job.customerPhone),
    customerEmail: job.customerEmail?.trim() || "",

    companyName: toTitleCase(job.companyName),
    companyQualifierName: toTitleCase(job.companyQualifierName),
    companyAddress: toTitleCase(job.companyAddress),
    companyCity: toTitleCase(job.companyCity),
    companyState: toUpper(job.companyState),
    companyPhone: normalizePhone(job.companyPhone),

    legalDescription: job.legalDescription?.trim() || "",
  };
}
