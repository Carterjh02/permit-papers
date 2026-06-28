export const TEMPLATE_COUNTIES = [
  "Broward",
  "Miami-Dade",
  "Palm Beach",
  "Orange",
  "Hillsborough",
] as const;

export type TemplateCounty = (typeof TEMPLATE_COUNTIES)[number];

export const TEMPLATE_DOCUMENT_TYPES = [
  "NOC",
  "Notice of Commencement",
  "Electrical",
  "Plumbing",
  "Mechanical",
] as const;

export type TemplateDocumentType = (typeof TEMPLATE_DOCUMENT_TYPES)[number];

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
