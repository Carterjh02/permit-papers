import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { formatCompanyFields } from "@/lib/utils/formatters";

export default function NewCompanyPage() {
  async function createCompany(formData: FormData) {
    "use server";

    // RAW VALUES
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

    // ⭐ FORMAT COMPANY FIELDS
    const formatted = formatCompanyFields(raw);

    // Build formatted full address
    const formattedAddress = [
      formatted.addressStreet,
      formatted.addressCity,
      formatted.addressState,
      formatted.addressZip,
    ]
      .filter(Boolean)
      .join(", ");

    // Unified storage: <companyCode>/...
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

    // Handle logo upload
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

    // ⭐ SAVE FORMATTED COMPANY DATA
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
    <div className="page-container space-y-6">
      <h1 className="text-2xl font-bold">Add New Company</h1>

      <form action={createCompany} className="space-y-4 card p-6">
        <div>
          <label className="block text-sm font-medium">Upload Logo</label>
          <input type="file" name="logo" accept="image/*" className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium">Company Name</label>
          <input name="company_name" className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium">Company Code</label>
          <input name="company_code" className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium">Qualifier Name</label>
          <input name="qualifier_name" className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input name="email" className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium">Phone</label>
          <input name="phone" className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium">Address Street</label>
          <input name="addressStreet" className="input" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">City</label>
            <input name="addressCity" className="input" />
          </div>

          <div>
            <label className="block text-sm font-medium">State</label>
            <input name="addressState" className="input" />
          </div>

          <div>
            <label className="block text-sm font-medium">Zip</label>
            <input name="addressZip" className="input" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">License Number</label>
          <input name="company_license" className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium">Website</label>
          <input name="website" className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium">
            Description of Improvements
          </label>
          <textarea name="desc_of_improv" className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium">
            Business Tax Receipt Number
          </label>
          <input name="business_tax_receipt" className="input" />
        </div>

        <button className="btn btn-primary" type="submit">
          Create Company
        </button>
      </form>
    </div>
  );
}
