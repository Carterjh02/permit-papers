"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { redirect } from "next/navigation";
import { loadPreferences } from "@/lib/preferences/loadPreferences";
import EditCompanyClient from "./EditCompanyClient";

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
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      website: true,
  
      address: true,
      addressStreet: true,
      addressCity: true,
      addressState: true,
      addressZip: true,
  
      // Window / Door Contractor
      licenseNumber: true,
      qualifierName: true,
      descOfImprov: true,
      businessTaxReceipt: true,
  
      // Roofing Contractor
      roofingLicenseNumber: true,
      roofingQualifierName: true,
      roofingDescOfImprov: true,
      roofingBusinessTaxReceipt: true,
  
      logoUrl: true,
      companyCode: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!company) {
    return <div className="p-10">Company not found.</div>;
  }

  const prefs = await loadPreferences({
    userId: user.id,
    companyId: company.id,
  });

  // Pass server-loaded data into the client component
  return <EditCompanyClient company={company} prefs={prefs} />;
}