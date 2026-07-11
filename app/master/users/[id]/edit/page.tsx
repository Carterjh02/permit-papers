"use server";

import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
// import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import Link from "next/link";
import bcrypt from "bcryptjs";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MasterEditUserPage({
  params: paramsPromise,
}: PageProps) {
  const params = await paramsPromise;

  const session = await getServerSession();
  if (!session) redirect("/login");
  if (session.user.role !== "master") redirect("/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: { company: true },
  });

  if (!user) notFound();

  // Explicit local type instead of Prisma model types
  const typedUser: {
    id: string;
    username: string;
    email: string | null;
    passwordHash?: string;
    company: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      companyCode: string;
      createdAt: Date;
    } | null;
  } = user;

  async function updateUser(formData: FormData) {
    "use server";

    const currentSession = await getServerSession();
    if (!currentSession || currentSession.user.role !== "master") {
      redirect("/login");
    }

    const username = (formData.get("username") as string)?.trim();
    const email = (formData.get("email") as string)?.trim() || null;
    const password = (formData.get("password") as string) || "";

    if (!username) throw new Error("Username is required.");

    const updateData: {
      username: string;
      email: string | null;
      passwordHash?: string;
    } = {
      username,
      email,
    };

    if (password.trim().length > 0) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    await prisma.user.update({
      where: { id: typedUser.id },
      data: updateData,
    });

    redirect("/master/users");
  }

  async function deleteUser() {
    "use server";

    const currentSession = await getServerSession();
    if (!currentSession || currentSession.user.role !== "master") {
      redirect("/login");
    }

    await prisma.user.delete({
      where: { id: typedUser.id },
    });

    redirect("/master/users");
  }

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Edit User</h1>
        <Link href="/master/users" className="btn btn-secondary">
          Back to Users
        </Link>
      </div>

      <form action={updateUser} className="card p-6 space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium">Username</label>
          <input
            name="username"
            className="input"
            defaultValue={typedUser.username}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            className="input"
            defaultValue={typedUser.email ?? ""}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            New Password (leave blank to keep current)
          </label>
          <input name="password" type="password" className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium">Company</label>
          <input
            className="input bg-gray-100 cursor-not-allowed"
            value={typedUser.company?.name ?? "— No company —"}
            disabled
          />
        </div>

        <div className="flex items-center justify-between pt-4">
          <button type="submit" className="btn btn-primary">
            Save Changes
          </button>
        </div>
      </form>

      <form action={deleteUser} className="max-w-xl mt-2">
        <button type="submit" className="btn btn-danger">
          Delete User
        </button>
      </form>
    </div>
  );
}
