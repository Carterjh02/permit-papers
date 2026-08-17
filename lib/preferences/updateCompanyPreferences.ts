import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALLOWED_FIELDS = {
  defaultAddressFormat: ["usps", "full"],
  defaultAddressCase: ["upper", "title"],
  defaultNameFormat: ["first-last", "last-first"],
  defaultNameCase: ["upper", "title"],
  defaultPhoneFormat: ["parentheses", "dashes"],
  defaultDocumentFont: ["inter", "roboto", "times", "georgia"],
} as const;

type AllowedCompanyPreferenceKey = keyof typeof ALLOWED_FIELDS;

export type UpdateCompanyPreferencesInput = Partial<
  Record<AllowedCompanyPreferenceKey, string>
>;

export async function updateCompanyPreferences(params: {
  companyId: string;
  data: UpdateCompanyPreferencesInput;
}) {
  const { companyId, data } = params;

  const validatedData: Partial<Record<AllowedCompanyPreferenceKey, string>> = {};

  (Object.keys(data) as AllowedCompanyPreferenceKey[]).forEach((key) => {
    const incomingValue = data[key];
  
    if (incomingValue === undefined) {
      return;
    }
  
    const allowedValues = ALLOWED_FIELDS[key] as readonly string[];
  
    if (!allowedValues.includes(incomingValue)) {
      throw new Error(
        `Invalid value for ${key}. Allowed: ${allowedValues.join(", ")}`
      );
    }
  
    validatedData[key] = incomingValue;
  });

  const existing = await prisma.companyPreferences.findUnique({
    where: { companyId },
  });

  if (!existing) {
    return prisma.companyPreferences.create({
      data: {
        companyId,
        ...validatedData,
      },
    });
  }

  return prisma.companyPreferences.update({
    where: { companyId },
    data: validatedData,
  });
}

export async function getCompanyPreferences(companyId: string) {
  return prisma.companyPreferences.findUnique({ where: { companyId } });
}
