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
  });

  if (!company) notFound();

  return (
    <div className="page-container space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Company</h1>

        <form action={deleteCompanyAction}>
          <input type="hidden" name="company_id" value={company.id} />
          <button className="btn btn-danger" type="submit">
            Delete Company
          </button>
        </form>
      </div>

      <form action={updateCompanyAction} className="space-y-8 card p-6">
        <input type="hidden" name="company_id" value={company.id} />
        <input
          type="hidden"
          name="existing_company_code"
          value={company.companyCode ?? ""}
        />

        {/* Company Info */}
        <Section title="Company Info">
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

          <InputFile label="Upload New Logo" name="logo" />

          <Input
            label="Company Name"
            name="company_name"
            defaultValue={company.name}
          />
          <Input
            label="Company Code"
            name="company_code"
            defaultValue={company.companyCode ?? ""}
          />
          <Input
            label="Email"
            name="email"
            defaultValue={company.email ?? ""}
          />
          <Input
            label="Phone"
            name="phone"
            defaultValue={company.phone ?? ""}
          />

          <Input
            label="Website"
            name="website"
            defaultValue={company.website ?? ""}
          />
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
            name="qualifier_name"
            defaultValue={company.qualifierName ?? ""}
          />
          <Textarea
            label="Description of Improvements"
            name="desc_of_improv"
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
