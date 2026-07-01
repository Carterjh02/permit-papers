"use server";

import { prisma } from "@/lib/prisma";

interface PageProps {
  params: { id: string };
}

export default async function CompanyViewPage({ params }: PageProps) {
  if (!params?.id) {
    return <div className="p-10">No company id in route.</div>;
  }

  const company = await prisma.company.findUnique({
    where: { id: params.id },
  });

  if (!company) {
    return <div className="p-10">Company not found.</div>;
  }

  return (
    <div className="p-10 space-y-4">
      <h1 className="text-2xl font-bold">{company.name}</h1>
      <p>Code: {company.companyCode}</p>

      <p>Email: {company.email || "—"}</p>
      <p>Phone: {company.phone || "—"}</p>

      <p>Street: {company.addressStreet || "—"}</p>
      <p>City: {company.addressCity || "—"}</p>
      <p>State: {company.addressState || "—"}</p>
      <p>Zip: {company.addressZip || "—"}</p>

      <p>License: {company.licenseNumber || "—"}</p>
      <p>Qualifier: {company.qualifierName || "—"}</p>
      <p>Description: {company.descOfImprov || "—"}</p>
      <p>Business Tax Receipt: {company.businessTaxReceipt || "—"}</p>

      <p>Website: {company.website || "—"}</p>
    </div>
  );
}
