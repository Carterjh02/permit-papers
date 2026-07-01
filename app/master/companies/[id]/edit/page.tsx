"use server";

import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import Image from "next/image";
import { formatCompanyFields } from "@/lib/utils/formatters";

/* -----------------------------------------------------------
   SERVER ACTIONS
----------------------------------------------------------- */

export async function updateCompanyAction(formData: FormData) {
  "use server";

  const companyId = formData.get("company_id") as string;
  const existingCompanyCode = formData.get("existing_company_code") as string;

  const raw = {
    name: formData.get("company_name") as string | undefined,
    companyCode: (formData.get("company_code") as string)?.trim() || "",

    email: (formData.get("email") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,

    addressStreet: (formData.get("addressStreet") as string) || undefined,
    addressCity: (formData.get("addressCity") as string) || undefined,
    addressState: (formData.get("addressState") as string) || undefined,
    addressZip: (formData.get("addressZip") as string) || undefined,

    licenseNumber: (formData.get("licenseNumber") as string) || undefined,
    businessTaxReceipt:
      (formData.get("businessTaxReceipt") as string) || undefined,

    website: (formData.get("website") as string) || undefined,
    descOfImprov: (formData.get("desc_of_improv") as string) || undefined,
    qualifierName: (formData.get("qualifier_name") as string) || undefined,
  };

  const formatted = formatCompanyFields(raw);

  const formattedAddress = [
    formatted.addressStreet,
    formatted.addressCity,
    formatted.addressState,
    formatted.addressZip,
  ]
    .filter(Boolean)
    .join(", ");

  async function listAllFiles(prefix: string): Promise<string[]> {
    const files: string[] = [];

    async function walk(path: string) {
      const { data, error } = await supabaseServer.storage
        .from("companies")
        .list(path);

      if (error || !data) return;

      for (const item of data) {
        if (item.name === ".keep") continue;

        if (item.metadata?.size) {
          files.push(`${path}/${item.name}`);
        } else {
          await walk(`${path}/${item.name}`);
        }
      }
    }

    await walk(prefix);
    return files;
  }

  async function migrateCompanyStorage(oldCode: string, newCode: string) {
    if (!oldCode || !newCode || oldCode === newCode) return;

    const oldBase = `companies/${oldCode}`;
    const newBase = `companies/${newCode}`;

    const newFolders = [
      `${newBase}/.keep`,
      `${newBase}/logos/.keep`,
      `${newBase}/jobs/.keep`,
    ];

    for (const path of newFolders) {
      await supabaseServer.storage
        .from("companies")
        .upload(path, new Blob([""]), { upsert: true });
    }

    const allFiles = await listAllFiles(oldBase);

    for (const oldPath of allFiles) {
      const relative = oldPath.replace(`${oldBase}/`, "");
      const newPath = `${newBase}/${relative}`;

      const { data: fileData } = await supabaseServer.storage
        .from("companies")
        .download(oldPath);

      if (!fileData) continue;

      await supabaseServer.storage
        .from("companies")
        .upload(newPath, fileData, { upsert: true });

      await supabaseServer.storage.from("companies").remove([oldPath]);
    }
  }

  const codeChanged =
    existingCompanyCode &&
    formatted.companyCode &&
    existingCompanyCode !== formatted.companyCode;

  if (codeChanged) {
    await migrateCompanyStorage(existingCompanyCode, formatted.companyCode!);
  }

  const basePrefix = `${formatted.companyCode}`;
  const logoPath = `${basePrefix}/logos/logo.png`;

  const folders = [
    `${basePrefix}/.keep`,
    `${basePrefix}/logos/.keep`,
    `${basePrefix}/jobs/.keep`,
    `${basePrefix}/documents/.keep`,
  ];

  for (const path of folders) {
    await supabaseServer.storage
      .from("companies")
      .upload(path, new Blob([""]), { upsert: true });
  }

  const file = formData.get("logo") as File | null;
  let logoUrl: string | null = null;

  if (file && file.size > 0) {
    await supabaseServer.storage
      .from("companies")
      .upload(logoPath, file, { upsert: true });
  }

  const { data: signed } = await supabaseServer.storage
    .from("companies")
    .createSignedUrl(logoPath, 60 * 60 * 24 * 365);

  if (signed?.signedUrl) {
    logoUrl = signed.signedUrl;
  }

  await prisma.company.update({
    where: { id: companyId },
    data: {
      name: formatted.name,
      companyCode: formatted.companyCode,
      email: formatted.email,
      phone: formatted.phone,

      address: formattedAddress,
      addressStreet: formatted.addressStreet,
      addressCity: formatted.addressCity,
      addressState: formatted.addressState,
      addressZip: formatted.addressZip,

      licenseNumber: formatted.licenseNumber,
      businessTaxReceipt: formatted.businessTaxReceipt,
      website: formatted.website,
      descOfImprov: formatted.descOfImprov,
      qualifierName: formatted.qualifierName,
      logoUrl,
    },
  });

  redirect("/master/companies");
}

export async function deleteCompanyAction(formData: FormData) {
  "use server";

  const companyId = formData.get("company_id") as string;

  await prisma.company.delete({
    where: { id: companyId },
  });

  redirect("/master/companies");
}

/* -----------------------------------------------------------
   PAGE COMPONENT
----------------------------------------------------------- */

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyEditPage({ params }: PageProps) {
  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
  });

  if (!company) notFound();

  return (
    <div className="page-container space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Company</h1>

        <form action={deleteCompanyAction}>
          <input type="hidden" name="company_id" value={company.id} />
          <button className="btn btn-danger" type="submit">
            Delete Company
          </button>
        </form>
      </div>

      <form action={updateCompanyAction} className="space-y-4 card p-6">
        <input type="hidden" name="company_id" value={company.id} />
        <input
          type="hidden"
          name="existing_company_code"
          value={company.companyCode ?? ""}
        />

        {company.logoUrl && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-1">Current Logo</p>
            <Image
              src={company.logoUrl}
              alt="Company Logo"
              width={200}
              height={200}
              className="h-20 w-auto rounded border object-contain"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium">Upload New Logo</label>
          <input type="file" name="logo" accept="image/*" className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium">Company Name</label>
          <input
            name="company_name"
            defaultValue={company.name}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Company Code</label>
          <input
            name="company_code"
            defaultValue={company.companyCode ?? ""}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Qualifier Name</label>
          <input
            name="qualifier_name"
            defaultValue={company.qualifierName ?? ""}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            name="email"
            defaultValue={company.email ?? ""}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Phone</label>
          <input
            name="phone"
            defaultValue={company.phone ?? ""}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Address Street</label>
          <input
            name="addressStreet"
            defaultValue={company.addressStreet ?? ""}
            className="input"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">City</label>
            <input
              name="addressCity"
              defaultValue={company.addressCity ?? ""}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">State</label>
            <input
              name="addressState"
              defaultValue={company.addressState ?? ""}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Zip</label>
            <input
              name="addressZip"
              defaultValue={company.addressZip ?? ""}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">License Number</label>
          <input
            name="licenseNumber"
            defaultValue={company.licenseNumber ?? ""}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Website</label>
          <input
            name="website"
            defaultValue={company.website ?? ""}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            Description of Improvements
          </label>
          <textarea
            name="desc_of_improv"
            defaultValue={company.descOfImprov ?? ""}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            Business Tax Receipt Number
          </label>
          <input
            name="businessTaxReceipt"
            defaultValue={company.businessTaxReceipt ?? ""}
            className="input"
          />
        </div>

        <button className="btn btn-primary" type="submit">
          Save Changes
        </button>
      </form>
    </div>
  );
}
