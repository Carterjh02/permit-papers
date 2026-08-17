// -------------------------------------------------------------
// Formatting Preferences Interface
// -------------------------------------------------------------
export interface FormattingPreferences {
  addressFormat: "usps" | "full";
  addressCase: "upper" | "title";
  nameFormat: "first-last" | "last-first";
  nameCase: "upper" | "title";
  phoneFormat: "parentheses" | "dashes";
  documentFont: "inter" | "roboto" | "times" | "georgia";
}

// -------------------------------------------------------------
// Basic Helpers
// -------------------------------------------------------------
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

export function formatPhone(str: string | undefined, mode: "parentheses" | "dashes"): string {
  if (!str) return "";
  const digits = str.replace(/\D/g, "");
  if (digits.length !== 10) return str.trim();

  if (mode === "parentheses") {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// -------------------------------------------------------------
// Company Field Formatting
// -------------------------------------------------------------
export interface CompanyFields {
  name?: string;
  qualifierName?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  address?: string;
  phone?: string;
  email?: string;
  descOfImprov?: string;
  businessTaxReceipt?: string;
  website?: string;
  licenseNumber?: string;
  companyCode?: string;
}

export function formatCompanyFields(
  company: CompanyFields,
  prefs: FormattingPreferences
): CompanyFields {
  const applyCase = (value?: string) =>
    prefs.addressCase === "upper" ? toUpper(value) : toTitleCase(value);

  const applyNameCase = (value?: string) =>
    prefs.nameCase === "upper" ? toUpper(value) : toTitleCase(value);

  return {
    ...company,

    // Name formatting
    name: applyNameCase(company.name),
    qualifierName: applyNameCase(company.qualifierName),

    // Address formatting
    addressStreet: applyCase(company.addressStreet),
    addressCity: applyCase(company.addressCity),
    addressState: toUpper(company.addressState),
    addressZip: normalizeZip(company.addressZip),
    address: company.address?.trim(),

    // Phone formatting
    phone: formatPhone(company.phone, prefs.phoneFormat),

    // Misc
    email: company.email?.trim() || "",
    website: company.website?.trim() || "",
    descOfImprov: company.descOfImprov?.trim() || "",
    businessTaxReceipt: company.businessTaxReceipt?.trim() || "",
    licenseNumber: company.licenseNumber?.trim() || "",
    companyCode: company.companyCode?.trim().toUpperCase(),
  };
}

// -------------------------------------------------------------
// Job Field Formatting
// -------------------------------------------------------------
export interface JobFields {
  customerName?: string;
  customerAddress?: string;
  customerAddressStreet?: string;
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

  jobValue?: number;
  legalDescription?: string;

  description?: string;
  taxFolioNumber?: string;
}

export function formatJobFields(
  job: JobFields,
  prefs: FormattingPreferences
): JobFields {
  const applyCase = (value?: string) =>
    prefs.addressCase === "upper" ? toUpper(value) : toTitleCase(value);

  const applyNameCase = (value?: string) =>
    prefs.nameCase === "upper" ? toUpper(value) : toTitleCase(value);

  return {
    ...job,

    // Customer
    customerName: applyNameCase(job.customerName),
    customerAddress: applyCase(job.customerAddress),
    customerAddressStreet: applyCase(job.customerAddress),
    customerCity: applyCase(job.customerCity),
    customerState: toUpper(job.customerState),
    customerZip: normalizeZip(job.customerZip),
    customerPhone: formatPhone(job.customerPhone, prefs.phoneFormat),
    customerEmail: job.customerEmail?.trim() || "",

    // Company
    companyName: applyNameCase(job.companyName),
    companyQualifierName: applyNameCase(job.companyQualifierName),
    companyAddress: applyCase(job.companyAddress),
    companyCity: applyCase(job.companyCity),
    companyState: toUpper(job.companyState),
    companyPhone: formatPhone(job.companyPhone, prefs.phoneFormat),

    // Misc
    jobValue: job.jobValue != null ? Number(job.jobValue) : 0,
    legalDescription: job.legalDescription?.trim() || "",

    description: job.description?.trim() || "",
    taxFolioNumber: job.taxFolioNumber?.trim() || "",
  };
}
