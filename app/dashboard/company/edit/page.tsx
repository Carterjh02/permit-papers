"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import Image from "next/image";
import { formatCompanyFields } from "@/lib/utils/formatters";

type Role = "user" | "admin" | "master";

interface AuthUser {
  id: string;
  username: string;
  role: Role;
  companyId: string | null;
  activeCompanyId: string | null;
}

export default async function CompanyAdminEditPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as AuthUser;
  if (user.role === "user") redirect("/dashboard/company");

  const companyId =
    user.role === "master" ? user.activeCompanyId : user.companyId;

  if (!companyId) {
    return <div className="p-10">No company selected.</div>;
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    return <div className="p-10">Company not found.</div>;
  }

  const companyIdForUpdate = company.id;
  const companyCode = company.companyCode;
  const existingLogoUrl = company.logoUrl ?? null;

  async function updateCompany(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    const user = session.user as AuthUser;
    if (user.role === "user") redirect("/dashboard/company");

    const raw = {
      name: formData.get("name") as string | undefined,
      email: (formData.get("email") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,

      addressStreet: (formData.get("addressStreet") as string) || undefined,
      addressCity: (formData.get("addressCity") as string) || undefined,
      addressState: (formData.get("addressState") as string) || undefined,
      addressZip: (formData.get("addressZip") as string) || undefined,

      licenseNumber: (formData.get("licenseNumber") as string) || undefined,
      website: (formData.get("website") as string) || undefined,

      qualifierName: (formData.get("qualifierName") as string) || undefined,
      descOfImprov: (formData.get("descOfImprov") as string) || undefined,
      businessTaxReceipt:
        (formData.get("businessTaxReceipt") as string) || undefined,
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

    const basePrefix = `${companyCode}`;
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
    let logoUrl = existingLogoUrl;

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
      where: { id: companyIdForUpdate },
      data: {
        name: formatted.name,
        email: formatted.email,
        phone: formatted.phone,

        address: formattedAddress,
        addressStreet: formatted.addressStreet,
        addressCity: formatted.addressCity,
        addressState: formatted.addressState,
        addressZip: formatted.addressZip,

        licenseNumber: formatted.licenseNumber,
        website: formatted.website,
        logoUrl,

        qualifierName: formatted.qualifierName,
        descOfImprov: formatted.descOfImprov,
        businessTaxReceipt: formatted.businessTaxReceipt,
      },
    });

    redirect("/dashboard/company");
  }

  return (
    <div className="page-container space-y-8">
      <h1 className="text-2xl font-bold">Edit Company Info</h1>

      <form action={updateCompany} className="space-y-8">
        {/* Company Info */}
        <Section title="Company Info">
          {company.logoUrl && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-800 mb-1">
                Current Logo
              </p>
              <Image
                src={company.logoUrl}
                alt="Company Logo"
                width={200}
                height={200}
                className="h-20 w-auto rounded border object-contain"
              />
            </div>
          )}

          <InputFile label="Upload New Logo" name="logo" />

          <Input label="Company Name" name="name" defaultValue={company.name} />
          <Input label="Email" name="email" defaultValue={company.email ?? ""} />
          <Input label="Phone" name="phone" defaultValue={company.phone ?? ""} />
          <Input label="Website" name="website" defaultValue={company.website ?? ""} />
        </Section>

        {/* Address Info */}
        <Section title="Address Info">
          <Input
            label="Street"
            name="addressStreet"
            defaultValue={company.addressStreet ?? ""}
          />
          <Input
            label="City"
            name="addressCity"
            defaultValue={company.addressCity ?? ""}
          />
          <Input
            label="State"
            name="addressState"
            defaultValue={company.addressState ?? ""}
          />
          <Input
            label="Zip"
            name="addressZip"
            defaultValue={company.addressZip ?? ""}
          />
        </Section>

        {/* Contractor Info */}
        <Section title="Contractor Info">
          <Input
            label="License Number"
            name="licenseNumber"
            defaultValue={company.licenseNumber ?? ""}
          />
          <Input
            label="Qualifier Name"
            name="qualifierName"
            defaultValue={company.qualifierName ?? ""}
          />
          <Textarea
            label="Description of Improvement"
            name="descOfImprov"
            defaultValue={company.descOfImprov ?? ""}
          />
          <Input
            label="Business Tax Receipt Number"
            name="businessTaxReceipt"
            defaultValue={company.businessTaxReceipt ?? ""}
          />
        </Section>

        <button className="btn btn-primary" type="submit">
          Save Changes
        </button>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 space-y-4 border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Input({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-800">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        className="input"
      />
    </div>
  );
}

function InputFile({
  label,
  name,
}: {
  label: string;
  name: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-800">{label}</label>
      <input type="file" name={name} accept="image/*" className="input" />
    </div>
  );
}

function Textarea({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-800">{label}</label>
      <textarea
        name={name}
        defaultValue={defaultValue}
        className="input"
        rows={4}
      />
    </div>
  );
}
