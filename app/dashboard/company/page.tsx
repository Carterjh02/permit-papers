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
    <div className="page-container space-y-8">
      <h1 className="text-2xl font-bold">Company Information</h1>

      {/* Company Info */}
      <Section title="Company Info">
        <Info label="Company Name" value={company.name} />
        <Info label="Company Code" value={company.companyCode} />
        <Info label="Email" value={company.email} />
        <Info label="Phone" value={company.phone} />
        <Info label="Website" value={company.website} />
      </Section>

      {/* Address Info */}
      <Section title="Address Info">
        <Info label="Street" value={company.addressStreet} />
        <Info label="City" value={company.addressCity} />
        <Info label="State" value={company.addressState} />
        <Info label="Zip" value={company.addressZip} />
        <Info label="Zip" value={company.addressZip} />
      </Section>

      {/* Contractor Info */}
      <Section title="Contractor Info">
        <Info label="License Number" value={company.licenseNumber} />
        <Info label="Qualifier Name" value={company.qualifierName} />
        <Info label="Description of Improvement" value={company.descOfImprov} />
        <Info
          label="Business Tax Receipt Number"
          value={company.businessTaxReceipt}
        />
      </Section>

      {/* Metadata */}
      <Section title="Record Details">
        <div className="grid grid-cols-2 gap-4">
          <Info
            label="Created At"
            value={company.createdAt.toLocaleDateString()}
          />
          <Info
            label="Updated At"
            value={company.updatedAt.toLocaleDateString()}
          />
        </div>
      </Section>

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
      <p className="text-gray-900">{value || "—"}</p>
    </div>
  );
}
