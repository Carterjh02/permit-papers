"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { formatCompanyFields } from "@/lib/utils/formatters";
import { loadPreferences } from "@/lib/preferences/loadPreferences";
import type { FormattingPreferences } from "@/lib/utils/formatters";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

export default async function NewCompanyPage() {
  async function createCompany(formData: FormData) {
    "use server";

    const raw = {
      name: formData.get("company_name") as string | undefined,
      companyCode: (formData.get("company_code") as string)?.trim(),

      email: (formData.get("email") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,

      addressStreet: (formData.get("addressStreet") as string) || undefined,
      addressCity: (formData.get("addressCity") as string) || undefined,
      addressState: (formData.get("addressState") as string) || undefined,
      addressZip: (formData.get("addressZip") as string) || undefined,

      licenseNumber: (formData.get("company_license") as string) || undefined,
      website: (formData.get("website") as string) || undefined,

      descOfImprov: (formData.get("desc_of_improv") as string) || undefined,
      qualifierName: (formData.get("qualifier_name") as string) || undefined,
      businessTaxReceipt:
        (formData.get("business_tax_receipt") as string) || undefined,
    };

    if (!raw.companyCode) {
      throw new Error("Company code is required.");
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Not authenticated.");

    const prefs = await loadPreferences({
      userId: session.user.id,
      companyId: null,
    });
    
    const formattingPrefs: FormattingPreferences = {
      addressFormat: prefs.companyPrefs?.defaultAddressFormat ?? "usps",
      addressCase: prefs.companyPrefs?.defaultAddressCase ?? "title",
      nameFormat: prefs.companyPrefs?.defaultNameFormat ?? "first-last",
      nameCase: prefs.companyPrefs?.defaultNameCase ?? "title",
      phoneFormat: prefs.companyPrefs?.defaultPhoneFormat ?? "parentheses",
      documentFont: prefs.companyPrefs?.defaultDocumentFont ?? "inter",
    };
    
    const formatted = formatCompanyFields(raw, formattingPrefs);

    const formattedAddress = [
      formatted.addressStreet,
      formatted.addressCity,
      formatted.addressState,
      formatted.addressZip,
    ]
      .filter(Boolean)
      .join(", ");

    const basePrefix = `${formatted.companyCode}`;

    const folderPaths = [
      `${basePrefix}/.keep`,
      `${basePrefix}/logos/.keep`,
      `${basePrefix}/jobs/.keep`,
      `${basePrefix}/documents/.keep`,
    ];

    for (const path of folderPaths) {
      await supabaseServer.storage
        .from("companies")
        .upload(path, new Blob([""]), { upsert: true });
    }

    const file = formData.get("logo") as File | null;
    let logoUrl: string | null = null;

    if (file && file.size > 0) {
      const filePath = `${basePrefix}/logos/logo.png`;

      await supabaseServer.storage
        .from("companies")
        .upload(filePath, file, { upsert: true });

      const { data: signed } = await supabaseServer.storage
        .from("companies")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      if (signed?.signedUrl) {
        logoUrl = signed.signedUrl;
      }
    }

    await prisma.company.create({
      data: {
        name: formatted.name!,
        companyCode: formatted.companyCode!,
        email: formatted.email,
        phone: formatted.phone,

        address: formattedAddress,
        addressStreet: formatted.addressStreet,
        addressCity: formatted.addressCity,
        addressState: formatted.addressState,
        addressZip: formatted.addressZip,

        licenseNumber: formatted.licenseNumber,
        website: formatted.website,
        descOfImprov: formatted.descOfImprov,
        qualifierName: formatted.qualifierName,
        businessTaxReceipt: formatted.businessTaxReceipt,
        logoUrl,
      },
    });

    redirect("/master/companies");
  }

  return (
    <div className="page-container space-y-6 text-[var(--text-color)]">
      <h1 className="text-2xl font-bold text-[var(--text-color)]">Add New Company</h1>

      <form action={createCompany} className="space-y-4 card p-6 bg-[var(--card-bg)] border border-[var(--border-color)]">
        <div>
          <label className="block text-sm font-medium text-[var(--text-color)]">Upload Logo</label>
          <input type="file" name="logo" accept="image/*" className="input bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-color)]">Company Name</label>
          <input name="company_name" className="input bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-color)]">Company Code</label>
          <input name="company_code" className="input bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-color)]">Qualifier Name</label>
          <input name="qualifier_name" className="input bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-color)]">Email</label>
          <input name="email" className="input bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-color)]">Phone</label>
          <input name="phone" className="input bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-color)]">Address Street</label>
          <input name="addressStreet" className="input bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-color)]">City</label>
            <input name="addressCity" className="input bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-color)]">State</label>
            <input name="addressState" className="input bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-color)]">Zip</label>
            <input name="addressZip" className="input bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-color)]">License Number</label>
          <input name="company_license" className="input bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-color)]">Website</label>
          <input name="website" className="input bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-color)]">
            Description of Improvements
          </label>
          <textarea name="desc_of_improv" className="input bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-color)]">
            Business Tax Receipt Number
          </label>
          <input name="business_tax_receipt" className="input bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]" />
        </div>

        <button className="btn btn-primary bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]" type="submit">
          Create Company
        </button>
      </form>
    </div>
  );
}
