import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type CompanyPreferencesShape = {
  id: string;
  companyId: string;
  defaultAddressFormat: "usps" | "full" | null;
  defaultAddressCase: "upper" | "title" | null;
  defaultNameFormat: "first-last" | "last-first" | null;
  defaultNameCase: "upper" | "title" | null;
  defaultPhoneFormat: "parentheses" | "dashes" | null;
  defaultDocumentFont: "inter" | "roboto" | "times" | "georgia" | null;
};

export type UserPreferencesShape = {
  id: string;
  userId: string;
  theme: "light" | "dark" | null;
  font: "inter" | "roboto" | "system-ui" | "georgia" | "source-sans" | null;
  density: "comfortable" | "compact" | null;
};

export type EffectivePreferences = {
  // Company-level formatting
  addressFormat: "usps" | "full";
  addressCase: "upper" | "title";
  nameFormat: "first-last" | "last-first";
  nameCase: "upper" | "title";
  phoneFormat: "parentheses" | "dashes";
  documentFont: "inter" | "roboto" | "times" | "georgia";

  // User-level UI
  theme: "light" | "dark";
  uiFont: "inter" | "roboto" | "system-ui" | "georgia" | "source-sans";
  density: "comfortable" | "compact";
};

const DEFAULTS: EffectivePreferences = {
  addressFormat: "usps",
  addressCase: "title",
  nameFormat: "first-last",
  nameCase: "title",
  phoneFormat: "parentheses",
  documentFont: "inter",
  theme: "light",
  uiFont: "inter",
  density: "comfortable",
};

export async function loadPreferences(params: {
  userId: string;
  companyId: string;
}): Promise<{
  companyPrefs: CompanyPreferencesShape | null;
  userPrefs: UserPreferencesShape | null;
  effectivePrefs: EffectivePreferences;
}> {
  const { userId, companyId } = params;

  const [companyPrefsRaw, userPrefsRaw] = await Promise.all([
    prisma.companyPreferences.findUnique({
      where: { companyId },
    }),
    prisma.userPreferences.findUnique({
      where: { userId },
    }),
  ]);

  const companyPrefs: CompanyPreferencesShape | null = companyPrefsRaw
    ? {
        id: companyPrefsRaw.id,
        companyId: companyPrefsRaw.companyId,
        defaultAddressFormat: companyPrefsRaw.defaultAddressFormat as
          | "usps"
          | "full"
          | null,
        defaultAddressCase: companyPrefsRaw.defaultAddressCase as
          | "upper"
          | "title"
          | null,
        defaultNameFormat: companyPrefsRaw.defaultNameFormat as
          | "first-last"
          | "last-first"
          | null,
        defaultNameCase: companyPrefsRaw.defaultNameCase as
          | "upper"
          | "title"
          | null,
        defaultPhoneFormat: companyPrefsRaw.defaultPhoneFormat as
          | "parentheses"
          | "dashes"
          | null,
        defaultDocumentFont: companyPrefsRaw.defaultDocumentFont as
          | "inter"
          | "roboto"
          | "times"
          | "georgia"
          | null,
      }
    : null;

  const userPrefs: UserPreferencesShape | null = userPrefsRaw
    ? {
        id: userPrefsRaw.id,
        userId: userPrefsRaw.userId,
        theme: userPrefsRaw.theme as "light" | "dark" | null,
        font: userPrefsRaw.font as
          | "inter"
          | "roboto"
          | "system-ui"
          | "georgia"
          | "source-sans"
          | null,
        density: userPrefsRaw.density as "comfortable" | "compact" | null,
      }
    : null;

  const effectivePrefs: EffectivePreferences = {
    addressFormat:
      companyPrefs?.defaultAddressFormat ?? DEFAULTS.addressFormat,
    addressCase: companyPrefs?.defaultAddressCase ?? DEFAULTS.addressCase,
    nameFormat: companyPrefs?.defaultNameFormat ?? DEFAULTS.nameFormat,
    nameCase: companyPrefs?.defaultNameCase ?? DEFAULTS.nameCase,
    phoneFormat: companyPrefs?.defaultPhoneFormat ?? DEFAULTS.phoneFormat,
    documentFont:
      companyPrefs?.defaultDocumentFont ?? DEFAULTS.documentFont,

    theme: userPrefs?.theme ?? DEFAULTS.theme,
    uiFont: userPrefs?.font ?? DEFAULTS.uiFont,
    density: userPrefs?.density ?? DEFAULTS.density,
  };

  return {
    companyPrefs,
    userPrefs,
    effectivePrefs,
  };
}
