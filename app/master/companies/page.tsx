"use server";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Prisma } from "@prisma/client";
import { SearchBar } from "@/app/components/SearchBar";
import { SortControls } from "@/app/components/SortControls";
import { FilterPanel } from "@/app/components/FilterPanel";
import { DataTable } from "@/app/components/DataTable";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    sort?: "name" | "createdAt";
    dir?: "asc" | "desc";
    page?: string;
  }>;
}

const PAGE_SIZE = 20;

export default async function CompaniesPage({ searchParams: searchParamsPromise }: PageProps) {
  const searchParams = await searchParamsPromise;

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "master") redirect("/dashboard");

  const q = searchParams?.q?.trim() ?? "";
  const sort = searchParams?.sort ?? "name";
  const dir = searchParams?.dir ?? "asc";
  const page = Math.max(1, Number(searchParams?.page ?? "1"));

  let where: Prisma.CompanyWhereInput = {};

  if (q.length > 0) {
    where = {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { companyCode: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  const orderBy =
    sort === "createdAt"
      ? { createdAt: dir }
      : { name: dir };

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.company.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Companies</h1>
        <Link href="/master/companies/new" className="btn btn-primary">
          New Company
        </Link>
      </div>

      <FilterPanel>
        <SearchBar
          defaultValue={q}
          placeholder="Name, code, email..."
          className="input"
        />

        <SortControls
          sortValue={sort}
          dirValue={dir}
          options={[
            { value: "name", label: "Name" },
            { value: "createdAt", label: "Created At" },
          ]}
        />
      </FilterPanel>

      <DataTable
        headers={
          <>
            <th className="text-left py-2 pr-4">Name</th>
            <th className="text-left py-2 pr-4">Code</th>
            <th className="text-left py-2 pr-4">Email</th>
            <th className="text-left py-2 pr-4">Phone</th>
            <th className="text-left py-2 pr-4">Created</th>
            <th className="text-left py-2 pr-4">Actions</th>
          </>
        }
      >
        {companies.map((c) => (
          <tr key={c.id} className="border-b last:border-0">
            <td className="py-2 pr-4">{c.name}</td>
            <td className="py-2 pr-4">{c.companyCode}</td>
            <td className="py-2 pr-4">{c.email ?? "-"}</td>
            <td className="py-2 pr-4">{c.phone ?? "-"}</td>
            <td className="py-2 pr-4">
              {c.createdAt.toLocaleDateString()}
            </td>
            <td className="py-2 pr-4">
              <Link
                href={`/master/companies/${c.id}/edit`}
                className="text-blue-600 hover:underline"
              >
                Edit
              </Link>
            </td>
          </tr>
        ))}

        {companies.length === 0 && (
          <tr>
            <td colSpan={6} className="py-4 text-center text-gray-500">
              No companies found.
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
              }).toString()}`}
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
              }).toString()}`}
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
