"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SearchBar } from "@/app/components/SearchBar";
import { SortControls } from "@/app/components/SortControls";
import { FilterPanel } from "@/app/components/FilterPanel";
import { DataTable } from "@/app/components/DataTable";
import { AddJobRow } from "@/app/components/AddJobRow";

import JobActions from "./JobActions";
import ClientDebug from "../debug/ClientDebug";

type Role = "user" | "admin" | "master";

interface SessionUser {
  id: string;
  username: string;
  role: Role;
  companyId: string | null;
  activeCompanyId: string | null;
}

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    sort?: "createdAt" | "customerName" | "customerCity";
    dir?: "asc" | "desc";
    page?: string;
  }>;
}

const PAGE_SIZE = 20;

export default async function DashboardPage({
  searchParams: searchParamsPromise,
}: PageProps) {
  const searchParams = await searchParamsPromise;

  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;

  if (!user) redirect("/login");

  const companyId =
    user.role === "master" ? user.activeCompanyId : user.companyId;

  if (!companyId) {
    return <div className="p-10">No active company selected.</div>;
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  const q = searchParams?.q?.trim() ?? "";
  const status = searchParams?.status?.trim() ?? "";
  const sort = searchParams?.sort ?? "createdAt";
  const dir = searchParams?.dir ?? "desc";
  const page = Math.max(1, Number(searchParams?.page ?? "1"));

  const where: {
    companyId: string;
    status?: string;
    OR?: Array<Record<string, unknown>>;
  } = { companyId };

  if (status) where.status = status;

  if (q.length > 0) {
    where.OR = [
      { customerName: { contains: q, mode: "insensitive" } },
      { customerAddress: { contains: q, mode: "insensitive" } },
      { customerCity: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy =
    sort === "customerName"
      ? { customerName: dir }
      : sort === "customerCity"
      ? { customerCity: dir }
      : { createdAt: dir };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.job.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="page-container space-y-6">
      <ClientDebug serverSession={session} />
      <h1 className="text-2xl font-bold">{company?.name} — Dashboard</h1>

      <FilterPanel>
        <SearchBar
          defaultValue={q}
          placeholder="Search by name or address..."
          className="input"
        />

        <div>
          <label className="block text-sm font-medium">Status</label>
          <select name="status" defaultValue={status} className="input">
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <SortControls
          sortValue={sort}
          dirValue={dir}
          options={[
            { value: "createdAt", label: "Date Added" },
            { value: "customerName", label: "Customer Name" },
            { value: "customerCity", label: "City" },
          ]}
        />
      </FilterPanel>

      <DataTable
        headers={
          <>
            <th className="text-left py-2 pr-4">Job #</th>
            <th className="text-left py-2 pr-4">Customer</th>
            <th className="text-left py-2 pr-4">Address</th>
            <th className="text-left py-2 pr-4">Created</th>
            <th className="text-left py-2 pr-4">Actions</th>
          </>
        }
      >
        <AddJobRow />

        {jobs.map(
          (j: {
            id: string;
            jobNumber: number; // FIXED
            customerName: string | null;
            customerAddress: string | null;
            customerCity: string | null;
            customerState: string | null;
            customerZip: string | null;
            createdAt: Date;
          }) => {
          const fullAddress = [
            j.customerAddress,
            j.customerCity,
            j.customerState,
            j.customerZip,
          ]
          .filter(Boolean)
          .join(", ");

        return (
          <tr key={j.id} className="border-b last:border-0">
          <td className="py-2 pr-4">{j.jobNumber}</td>
          <td className="py-2 pr-4">{j.customerName ?? "-"}</td>
          <td className="py-2 pr-4">{fullAddress || "-"}</td>
          <td className="py-2 pr-4">
            {j.createdAt.toLocaleDateString()}
          </td>

          <td className="py-2 pr-4">
            <JobActions jobId={j.id} jobNumber={j.jobNumber} />
          </td>
        </tr>
      );
    }
  )}


        {jobs.length === 0 && (
          <tr>
            <td colSpan={5} className="py-4 text-center text-gray-500">
              No jobs found.
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
                status,
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
                status,
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
