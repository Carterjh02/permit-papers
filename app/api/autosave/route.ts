import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      page: string;
      field: string;
      value: string;
    };

    const { page, field, value } = body;

    // Example: autosave for company edit page
    if (page === "/dashboard/company/edit") {
      const user = session.user as {
        id: string;
        role: "user" | "admin" | "master";
        companyId: string | null;
        activeCompanyId: string | null;
      };

      const companyId =
        user.role === "master" ? user.activeCompanyId : user.companyId;

      if (!companyId) {
        return NextResponse.json({ error: "No company selected" }, { status: 400 });
      }

      // Map field names to company columns
      const allowedFields: Record<string, string> = {
        name: "name",
        email: "email",
        phone: "phone",
        website: "website",
        addressStreet: "addressStreet",
        addressCity: "addressCity",
        addressState: "addressState",
        addressZip: "addressZip",
        licenseNumber: "licenseNumber",
        qualifierName: "qualifierName",
        descOfImprov: "descOfImprov",
        businessTaxReceipt: "businessTaxReceipt",
      };

      const column = allowedFields[field];
      if (!column) {
        return NextResponse.json({ error: "Field not autosave‑enabled" }, { status: 400 });
      }

      await prisma.company.update({
        where: { id: companyId },
        data: {
          [column]: value,
        },
      });

      return NextResponse.json({ ok: true });
    }

    // Other pages can be added here later
    return NextResponse.json({ ok: true });
} catch {
    return NextResponse.json({ error: "Autosave failed" }, { status: 500 });
  }
}
