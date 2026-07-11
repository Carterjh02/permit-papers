"use server";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
// import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { SearchBar } from "@/app/components/SearchBar";
import { SortControls } from "@/app/components/SortControls";
import { FilterPanel } from "@/app/components/FilterPanel";
import { DataTable } from "@/app/components/DataTable";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    sort?: "username" | "createdAt";
    dir?: "asc" | "desc";
    page?: string;
  }>;
}

const PAGE_SIZE = 20;

export default async function AdminUsersPage({
  searchParams: searchParamsPromise,
}: PageProps) {
  const searchParams = await searchParamsPromise;

  const session = await getServerSession();
  if (!session) redirect("/login");

  const admin = session.user;
  if (admin.role !== "admin") redirect("/dashboard");

  const q = searchParams?.q?.trim() ?? "";
  const sort = searchParams?.sort ?? "username";
  const dir = searchParams?.dir ?? "asc";
  const page = Math.max(1, Number(searchParams?.page ?? "1"));

  // Explicit type instead of "any"
  const where: {
    companyId?: string | null;
    OR?: Array<{
      username?: { contains: string; mode: "insensitive" };
      email?: { contains: string; mode: "insensitive" };
    }>;
  } = {
    companyId: admin.companyId ?? undefined,
  };

  if (q.length > 0) {
    where.OR = [
      { username: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy =
    sort === "createdAt"
      ? { createdAt: dir }
      : { username: dir };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);

  // Explicit type for map callback
  const typedUsers: Array<{
    id: string;
    username: string;
    email: string | null;
    createdAt: Date | null;
  }> = users;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <Link href="/dashboard/users/new" className="btn btn-primary">
          New User
        </Link>
      </div>

      <FilterPanel>
        <SearchBar
          defaultValue={q}
          placeholder="Search username or email..."
        />

        <SortControls
          sortValue={sort}
          dirValue={dir}
          options={[
            { value: "username", label: "Username" },
            { value: "createdAt", label: "Created At" },
          ]}
        />
      </FilterPanel>

      <DataTable
        headers={
          <>
            <th className="text-left py-2 pr-4">Username</th>
            <th className="text-left py-2 pr-4">Email</th>
            <th className="text-left py-2 pr-4">Created</th>
            <th className="text-left py-2 pr-4">Actions</th>
          </>
        }
      >
        {typedUsers.map((u) => (
          <tr key={u.id} className="border-b last:border-0">
            <td className="py-2 pr-4">{u.username}</td>
            <td className="py-2 pr-4">{u.email ?? "-"}</td>
            <td className="py-2 pr-4">
              {u.createdAt?.toLocaleDateString?.() ?? "-"}
            </td>
            <td className="py-2 pr-4">
              <Link
                href={`/dashboard/users/${u.id}/edit`}
                className="text-blue-600 hover:underline"
              >
                Edit
              </Link>
            </td>
          </tr>
        ))}

        {typedUsers.length === 0 && (
          <tr>
            <td colSpan={4} className="py-4 text-center text-gray-500">
              No users found.
            </td>
          </tr>
        )}
      </DataTable>

      <div className="flex items-center justify-between text-sm">
        <span>
          Page {page} of {totalPages} ({total} total)
        </span>

        <div className="flex gap-2">
          {page > 1 && (
            <Link
              href={`?${new URLSearchParams({
                q,
                sort,
                dir,
                page: String(page - 1),
              })}`}
              className="btn btn-secondary btn-sm"
            >
              Previous
            </Link>
          )}

          {page < totalPages && (
            <Link
              href={`?${new URLSearchParams({
                q,
                sort,
                dir,
                page: String(page + 1),
              })}`}
              className="btn btn-secondary btn-sm"
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
