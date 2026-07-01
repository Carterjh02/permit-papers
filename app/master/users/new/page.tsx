"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";
import bcrypt from "bcryptjs";
import { TypeAheadSelect } from "@/app/components/TypeAheadSelect";
import { Prisma } from "@prisma/client";

export default async function MasterNewUserPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "master") redirect("/dashboard");

  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
  });

  async function createUser(formData: FormData) {
    "use server";

    const currentSession = await getServerSession(authOptions);
    if (!currentSession || currentSession.user.role !== "master") {
      redirect("/login");
    }

    const username = (formData.get("username") as string)?.trim();
    const email = (formData.get("email") as string)?.trim() || null;
    const password = formData.get("password") as string;
    const role = formData.get("role") as "master" | "admin" | "user";

    let companyId = formData.get("companyId") as string | null;
    if (!companyId || companyId.trim() === "") {
      companyId = null;
    }

    if (!username || !password) {
      throw new Error("Username and password are required.");
    }

    if (role !== "master" && !companyId) {
      throw new Error("Non-master users must be assigned to a company.");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      await prisma.user.create({
        data: {
          username,
          passwordHash,
          role,
          email,
          companyId,
          activeCompanyId: companyId,
        },
      });
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new Error("Username already exists. Choose another.");
      }
      throw err;
    }

    redirect("/master/users");
  }

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">New User</h1>
        <Link href="/master/users" className="btn btn-secondary">
          Back to Users
        </Link>
      </div>

      <form action={createUser} className="card p-6 space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium">Username</label>
          <input name="username" className="input" required />
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input name="email" type="email" className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            name="password"
            type="password"
            className="input"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Role</label>
          <select name="role" defaultValue="admin" className="input">
            <option value="master">Master</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Company (required for admin/user)
          </label>
          <TypeAheadSelect
            name="companyId"
            className="input"
            options={[
              { value: "", label: "— No company (master only) —" },
              ...companies.map((c) => ({
                value: c.id,
                label: c.name,
              })),
            ]}
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Create User
        </button>
      </form>
    </div>
  );
}
