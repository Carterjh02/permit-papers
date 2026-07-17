"use server";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";

import { updateCompanyAction, deleteCompanyAction } from "./actions";

export default async function CompanyEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
    select: {
      id: true,
      companyCode: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      addressStreet: true,
      addressCity: true,
      addressState: true,
      addressZip: true,
      licenseNumber: true,
      website: true,
      logoUrl: true,
      createdAt: true,
      updatedAt: true,
      descOfImprov: true,
      qualifierName: true,
      businessTaxReceipt: true,
      subscriptionTier: true,
    },
  });

  if (!company) {
    notFound();
  }

  const safeCompany = company;

  return (
    <div className="page-container space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Company</h1>

        <form action={deleteCompanyAction}>
          <input type="hidden" name="company_id" value={safeCompany.id} />
          <button className="btn btn-danger" type="submit">
            Delete Company
          </button>
        </form>
      </div>

      <form action={updateCompanyAction} className="space-y-8 card p-6">
        <input type="hidden" name="company_id" value={safeCompany.id} />
        <input
          type="hidden"
          name="existing_company_code"
          value={safeCompany.companyCode ?? ""}
        />

        {/* Company Info */}
        <Section title="Company Info">
          {safeCompany.logoUrl && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Current Logo</p>
              <Image
                src={safeCompany.logoUrl}
                alt="Company Logo"
                width={200}
                height={200}
                className="h-20 w-auto rounded border object-contain"
              />
            </div>
          )}

          <InputFile label="Upload New Logo" name="logo" />

          <Input
            label="Company Name"
            name="company_name"
            defaultValue={safeCompany.name}
          />
          <Input
            label="Company Code"
            name="company_code"
            defaultValue={safeCompany.companyCode ?? ""}
          />
          <Input
            label="Email"
            name="email"
            defaultValue={safeCompany.email ?? ""}
          />
          <Input
            label="Phone"
            name="phone"
            defaultValue={safeCompany.phone ?? ""}
          />

          {/* Subscription Tier */}
          <div>
            <label className="block text-sm font-medium">Subscription Tier</label>
            <select
              name="subscriptionTier"
              defaultValue={safeCompany.subscriptionTier ?? "free"}
              className="input"
            >
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <Input
            label="Website"
            name="website"
            defaultValue={safeCompany.website ?? ""}
          />
        </Section>

        {/* Address Info */}
        <Section title="Address Info">
          <Input
            label="Street"
            name="addressStreet"
            defaultValue={safeCompany.addressStreet ?? ""}
          />
          <Input
            label="City"
            name="addressCity"
            defaultValue={safeCompany.addressCity ?? ""}
          />
          <Input
            label="State"
            name="addressState"
            defaultValue={safeCompany.addressState ?? ""}
          />
          <Input
            label="Zip"
            name="addressZip"
            defaultValue={safeCompany.addressZip ?? ""}
          />
        </Section>

        {/* Contractor Info */}
        <Section title="Contractor Info">
          <Input
            label="License Number"
            name="licenseNumber"
            defaultValue={safeCompany.licenseNumber ?? ""}
          />
          <Input
            label="Qualifier Name"
            name="qualifier_name"
            defaultValue={safeCompany.qualifierName ?? ""}
          />
          <Textarea
            label="Description of Improvements"
            name="desc_of_improv"
            defaultValue={safeCompany.descOfImprov ?? ""}
          />
          <Input
            label="Business Tax Receipt Number"
            name="businessTaxReceipt"
            defaultValue={safeCompany.businessTaxReceipt ?? ""}
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
    <div className="space-y-4 border border-gray-200 rounded-lg p-6 shadow-sm">
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
      <label className="block text-sm font-medium">{label}</label>
      <input name={name} defaultValue={defaultValue} className="input" />
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
      <label className="block text-sm font-medium">{label}</label>
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
      <label className="block text-sm font-medium">{label}</label>
      <textarea
        name={name}
        defaultValue={defaultValue}
        className="input"
        rows={4}
      />
    </div>
  );
}
