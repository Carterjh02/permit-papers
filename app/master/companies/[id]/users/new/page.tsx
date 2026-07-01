"use server";

import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import bcrypt from "bcryptjs";

/* -----------------------------------------------------------
   SERVER ACTION
----------------------------------------------------------- */

export async function createUserAction(formData: FormData) {
  "use server";

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

/* -----------------------------------------------------------
   PAGE
----------------------------------------------------------- */

interface PageProps {
  params: { id: string };
}

export default async function MasterCreateUserPage({ params }: PageProps) {
  const company = await prisma.company.findUnique({
    where: { id: params.id },
  });

  if (!company) notFound();

  return (
    <div className="page-container space-y-6">
      <h1 className="text-2xl font-bold">Add User to {company.name}</h1>

      <form action={createUserAction} className="space-y-4 card p-6">
        <input type="hidden" name="company_id" value={company.id} />

        <div>
          <label className="block text-sm font-medium text-gray-800">
            Username
          </label>
          <input name="username" className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800">
            Password
          </label>
          <input name="password" type="password" className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800">
            Role
          </label>
          <select name="role" className="input">
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        <button className="btn btn-primary" type="submit">
          Create User
        </button>
      </form>
    </div>
  );
}
