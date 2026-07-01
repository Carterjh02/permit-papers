"use server";

import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";

/* -----------------------------------------------------------
   SERVER ACTIONS
----------------------------------------------------------- */

export async function updateUserAction(formData: FormData) {
  "use server";

  const id = formData.get("user_id") as string;

  const current = await getServerSession(authOptions);
  if (!current || current.user.role !== "admin") redirect("/login");

  const username = (formData.get("username") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const password = (formData.get("password") as string) || "";

  if (!username) throw new Error("Username is required.");

  const updateData: Partial<User> = {
    username,
    email,
  };

  if (password.trim().length > 0) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({
    where: { id },
    data: updateData,
  });

  redirect("/dashboard/users");
}

export async function deleteUserAction(formData: FormData) {
  "use server";

  const id = formData.get("user_id") as string;

  const current = await getServerSession(authOptions);
  if (!current || current.user.role !== "admin") redirect("/login");

  await prisma.user.delete({
    where: { id },
  });

  redirect("/dashboard/users");
}

/* -----------------------------------------------------------
   PAGE COMPONENT
----------------------------------------------------------- */

export default async function AdminEditUserPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const admin = session.user;

  if (admin.role !== "admin") redirect("/dashboard");

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) notFound();
  if (user.companyId !== admin.companyId) redirect("/dashboard");

  const typedUser: User = user;

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit User</h1>
        <Link href="/dashboard/users" className="btn btn-secondary">
          Back to Users
        </Link>
      </div>

      <form action={updateUserAction} className="card p-6 space-y-4 max-w-xl">
        <input type="hidden" name="user_id" value={typedUser.id} />

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
            className="input bg-gray-100"
            value={admin.companyId ?? ""}
            disabled
          />
        </div>

        <div className="flex items-center justify-between pt-4">
          <button type="submit" className="btn btn-primary">
            Save Changes
          </button>

          <form action={deleteUserAction}>
            <input type="hidden" name="user_id" value={typedUser.id} />
            <button type="submit" className="btn btn-danger">
              Delete User
            </button>
          </form>
        </div>
      </form>
    </div>
  );
}
