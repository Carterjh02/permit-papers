"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CompanyInfoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user;

  const companyId =
    user.role === "master" ? user.activeCompanyId : user.companyId;

  if (!companyId) {
    return <div className="p-10">No active company selected.</div>;
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    return <div className="p-10">Company not found.</div>;
  }

  return (
    <div className="page-container space-y-6">
      <h1 className="text-2xl font-bold">Company Information</h1>

      <div className="card p-6 space-y-4">
        <Info label="Company Name" value={company.name} />
        <Info label="Company Code" value={company.companyCode} />

        <Info label="Email" value={company.email} />
        <Info label="Phone" value={company.phone} />

        <Info label="Address Street" value={company.addressStreet} />
        <Info label="City" value={company.addressCity} />
        <Info label="State" value={company.addressState} />
        <Info label="Zip" value={company.addressZip} />

        <Info label="License Number" value={company.licenseNumber} />
        <Info label="Qualifier Name" value={company.qualifierName} />
        <Info label="Description of Improvement" value={company.descOfImprov} />
        <Info
          label="Business Tax Receipt Number"
          value={company.businessTaxReceipt}
        />

        <Info label="Website" value={company.website} />

        <Info
          label="Created At"
          value={company.createdAt.toLocaleDateString()}
        />
        <Info
          label="Updated At"
          value={company.updatedAt.toLocaleDateString()}
        />
      </div>

      {(user.role === "admin" || user.role === "master") && (
        <div>
          <Link href="/dashboard/company/edit" className="btn btn-primary">
            Edit Company Info
          </Link>
        </div>
      )}
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600">
        {label}
      </label>
      <p className="text-lg">{value || "—"}</p>
    </div>
  );
}
