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
