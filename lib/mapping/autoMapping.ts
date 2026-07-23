export type DataSource = "company" | "job";

export interface AutoMappedField {
  fieldName: string;
  source: DataSource;
  key: string;
}

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

export function autoMapField(fieldName: string): AutoMappedField | null {
  const name = normalize(fieldName);

  // COMPANY FIELDS
  if (name.startsWith("company_")) {
    return {
      fieldName,
      source: "company",
      key: name.replace("company_", ""),
    };
  }

  // CUSTOMER / JOB FIELDS
  if (name.startsWith("customer_")) {
    return {
      fieldName,
      source: "job",
      key: name.replace("customer_", ""),
    };
  }

  // JOB_ prefix
  if (name.startsWith("job_")) {
    return {
      fieldName,
      source: "job",
      key: name.replace("job_", ""),
    };
  }

  return null;
}

export function autoMapFields(fieldNames: string[]): AutoMappedField[] {
  return fieldNames
    .map((name) => autoMapField(name))
    .filter((m): m is AutoMappedField => m !== null);
}
