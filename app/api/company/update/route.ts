import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken, type GetTokenParams } from "next-auth/jwt";
import { supabaseServer } from "@/lib/supabaseServer";
import { formatCompanyFields } from "@/lib/utils/formatters";
import { loadPreferences } from "@/lib/preferences/loadPreferences";

export async function POST(req: Request) {
  // -----------------------------
  // 1. Auth
  // -----------------------------
  const token = await getToken({
    req: req as unknown as GetTokenParams["req"],
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const role = token.role as string;
  const companyId = token.role === "master"
    ? token.activeCompanyId
    : token.companyId;

  if (!companyId) {
    return new NextResponse("No company selected", { status: 400 });
  }

  if (role === "user") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // -----------------------------
  // 2. Parse JSON body
  // -----------------------------
  const body = await req.json();

  // -----------------------------
  // 3. Load formatting preferences
  // -----------------------------
  const prefs = await loadPreferences({
    userId: token.id as string,
    companyId,
  });

  const formatted = formatCompanyFields(body, {
    addressFormat: (prefs.companyPrefs?.defaultAddressFormat as "usps" | "full") ?? "usps",
    addressCase: (prefs.companyPrefs?.defaultAddressCase as "title" | "upper") ?? "title",
    nameFormat: (prefs.companyPrefs?.defaultNameFormat as "first-last" | "last-first") ?? "first-last",
    nameCase: (prefs.companyPrefs?.defaultNameCase as "title" | "upper") ?? "title",
    phoneFormat: (prefs.companyPrefs?.defaultPhoneFormat as "parentheses" | "dashes") ?? "parentheses",
    documentFont: (prefs.companyPrefs?.defaultDocumentFont as "inter" | "roboto" | "times" | "georgia") ?? "inter",
  });

  // -----------------------------
  // 4. Handle logo upload (if provided)
  // -----------------------------
  let logoUrl = undefined;

  if (body.logo) {
    // Convert base64 → File-like Blob
    const buffer = Buffer.from(body.logo.data, "base64");
    const blob = new Blob([buffer], { type: body.logo.type });

    const companyCode = body.companyCode ?? "company";

    const logoPath = `${companyCode}/logos/logo.png`;

    await supabaseServer.storage
      .from("companies")
      .upload(logoPath, blob, { upsert: true });

    const { data: signed } = await supabaseServer.storage
      .from("companies")
      .createSignedUrl(logoPath, 60 * 60 * 24 * 365);

    if (signed?.signedUrl) {
      logoUrl = signed.signedUrl;
    }
  }

  // -----------------------------
  // 5. Update company
  // -----------------------------
  await prisma.company.update({
    where: { id: companyId },
    data: {
      name: formatted.name,
      email: formatted.email,
      phone: formatted.phone,
      website: formatted.website,

      address: [
        formatted.addressStreet,
        formatted.addressCity,
        formatted.addressState,
        formatted.addressZip,
      ]
        .filter(Boolean)
        .join(", "),

      addressStreet: formatted.addressStreet,
      addressCity: formatted.addressCity,
      addressState: formatted.addressState,
      addressZip: formatted.addressZip,

      // Window / Door Contractor
      licenseNumber: formatted.licenseNumber,
      qualifierName: formatted.qualifierName,
      descOfImprov: formatted.descOfImprov,
      businessTaxReceipt: formatted.businessTaxReceipt,

      // Roofing Contractor
      roofingLicenseNumber: formatted.roofingLicenseNumber,
      roofingQualifierName: formatted.roofingQualifierName,
      roofingDescOfImprov: formatted.roofingDescOfImprov,
      roofingBusinessTaxReceipt: formatted.roofingBusinessTaxReceipt,

      ...(logoUrl && { logoUrl }),
    },
  });

  // -----------------------------
  // 6. Return success (client handles redirect)
  // -----------------------------
  return NextResponse.json({ success: true });
}
