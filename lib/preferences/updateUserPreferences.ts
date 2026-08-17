import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALLOWED_FIELDS = {
  theme: ["light", "dark"],
  font: ["inter", "roboto", "system-ui", "georgia", "source-sans"],
  density: ["comfortable", "compact"],
} as const;

type AllowedUserPreferenceKey = keyof typeof ALLOWED_FIELDS;

export type UpdateUserPreferencesInput = Partial<
  Record<AllowedUserPreferenceKey, string>
>;

export async function updateUserPreferences(params: {
  userId: string;
  data: UpdateUserPreferencesInput;
}) {
  const { userId, data } = params;

  const validatedData: Partial<Record<AllowedUserPreferenceKey, string>> = {};

  (Object.keys(data) as AllowedUserPreferenceKey[]).forEach((key) => {
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

  const existing = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  if (!existing) {
    return prisma.userPreferences.create({
      data: {
        userId,
        ...validatedData,
      },
    });
  }

  return prisma.userPreferences.update({
    where: { userId },
    data: validatedData,
  });
}

export async function getUserPreferences(userId: string) {
  return prisma.userPreferences.findUnique({ where: { userId } });
}
