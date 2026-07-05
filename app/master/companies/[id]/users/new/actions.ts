"use server";

import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import bcrypt from "bcryptjs";

export async function createUserAction(formData: FormData) {
  const companyId = formData.get("company_id") as string;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) notFound();

  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      username,
      passwordHash,
      role,
      companyId: company.id,
    },
  });

  redirect(`/master/companies/${company.id}`);
}
