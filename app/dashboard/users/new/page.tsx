"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import Link from "next/link";
import bcrypt from "bcryptjs";

export default async function AdminNewUserPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const admin = session.user;

  if (admin.role !== "admin") redirect("/dashboard");

  async function createUser(formData: FormData) {
    "use server";

    const current = await getServerSession(authOptions);
    if (!current || current.user.role !== "admin") redirect("/login");

    const username = (formData.get("username") as string)?.trim();
    const email = (formData.get("email") as string)?.trim() || null;
    const password = formData.get("password") as string;

    if (!username || !password) {
      throw new Error("Username and password are required.");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role: "user",
        companyId: current.user.companyId,
        activeCompanyId: current.user.companyId,
      },
    });

    redirect("/dashboard/users");
  }

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">New User</h1>
        <Link href="/dashboard/users" className="btn btn-secondary">
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
          <label className="block text-sm font-medium">Company</label>
          <input
            className="input bg-gray-100"
            value={admin.companyId ?? ""}
            disabled
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Create User
        </button>
      </form>
    </div>
  );
}
