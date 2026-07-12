"use server";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import type { User, Company } from "@prisma/client";
import ClientDebug from "@/app/debug/ClientDebug";

interface PageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

const PAGE_SIZE = 20;

export default async function MasterUsersPage({ searchParams: searchParamsPromise }: PageProps) {
  const searchParams = await searchParamsPromise;

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "master") redirect("/dashboard");

  const page = Math.max(1, Number(searchParams?.page ?? "1"));

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      include: { company: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count(),
  ]);

  const typedUsers: (User & { company: Company | null })[] = users;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="page-container space-y-6">
      <ClientDebug serverSession={session} />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <Link href="/master/users/new" className="btn btn-primary">
          New User
        </Link>
      </div>

      <div className="card p-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-4">Username</th>
              <th className="text-left py-2 pr-4">Role</th>
              <th className="text-left py-2 pr-4">Company</th>
              <th className="text-left py-2 pr-4">Email</th>
              <th className="text-left py-2 pr-4">Created</th>
              <th className="text-left py-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {typedUsers.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="py-2 pr-4">{u.username}</td>
                <td className="py-2 pr-4 capitalize">{u.role}</td>
                <td className="py-2 pr-4">{u.company?.name ?? "-"}</td>
                <td className="py-2 pr-4">{u.email ?? "-"}</td>
                <td className="py-2 pr-4">
                  {u.createdAt?.toLocaleDateString?.() ?? "-"}
                </td>
                <td className="py-2 pr-4">
                  <Link
                    href={`/master/users/${u.id}/edit`}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}

            {typedUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span>
          Page {page} of {totalPages} ({total} total)
        </span>

        <div className="flex gap-2">
          {page > 1 && (
            <Link href={`?page=${page - 1}`} className="btn btn-secondary btn-sm">
              Previous
            </Link>
          )}

          {page < totalPages && (
            <Link href={`?page=${page + 1}`} className="btn btn-secondary btn-sm">
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
