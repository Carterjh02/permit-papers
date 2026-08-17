"use server";

import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import Link from "next/link";
import { updateUserAction, deleteUserAction } from "./actions";

export default async function AdminEditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Get session
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const currentUser = session.user;

  // Fetch user being edited
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) notFound();

  // ROLE LOGIC
  // Admins can edit any user in their company
  if (currentUser.role === "admin") {
    if (user.companyId !== currentUser.companyId) redirect("/dashboard");
  }

  // Users can ONLY edit themselves
  if (currentUser.role === "user") {
    if (user.id !== currentUser.id) redirect("/dashboard");
  }

  const typedUser = user;

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit User</h1>

        <Link href="/dashboard/users" className="btn btn-primary">
          Back to Users
        </Link>
      </div>

      {/* UPDATE USER FORM */}
      <form action={updateUserAction} className="p-6 space-y-4 max-w-xl bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-sm">
        <input type="hidden" name="user_id" value={typedUser.id} />

        <div>
          <label className="block text-sm font-medium text-[var(--text-color)] opacity-80">Username</label>
          <input
            name="username"
            className="input bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
            defaultValue={typedUser.username}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-color)] opacity-80">Email</label>
          <input
            name="email"
            type="email"
            className="input bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
            defaultValue={typedUser.email ?? ""}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-color)] opacity-80">
            New Password (leave blank to keep current)
          </label>
          <input name="password" type="password" className="input bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]" />
        </div>

        {/* Only admins should see company info */}
        {currentUser.role === "admin" && (
          <div>
            <label className="block text-sm font-medium text-[var(--text-color)] opacity-80">Company</label>
            <input
              className="input bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-color)] opacity-50"
              value={typedUser.companyId ?? ""}
              disabled
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <button type="submit" className="btn btn-primary">
            Save Changes
          </button>
        </div>
      </form>

      {/* DELETE USER FORM — only admins can delete */}
      {currentUser.role === "admin" && (
        <form action={deleteUserAction} className="mt-6 max-w-xl">
          <input type="hidden" name="user_id" value={typedUser.id} />
          <button type="submit" className="btn btn-danger">
            Delete User
          </button>
        </form>
      )}
    </div>
  );
}
