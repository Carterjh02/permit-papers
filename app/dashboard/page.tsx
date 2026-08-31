"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SearchBar } from "@/app/components/SearchBar";
import { SortControls } from "@/app/components/SortControls";
import { FilterPanel } from "@/app/components/FilterPanel";
import { AddJobRowContent } from "@/app/components/AddJobRow";

import JobActions from "./JobActions";

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

const PAGE_SIZE = 40;

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
    return <div className="p-[var(--section-gap)]">No active company selected.</div>;
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
    <div id="welcome-1" className="page-container space-y-[var(--section-gap)]">
  
      <h1 className="text-2xl font-bold">{company?.name} — Dashboard</h1>

      <FilterPanel>
        <SearchBar
          defaultValue={q}
          placeholder="Search by name or address..."
          className="input"
        />

        <div>
          <label className="block text-[length:var(--base-font-size)] font-medium text-[var(--text-color)]">Status</label>
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

        <div className="relative overflow-y-auto max-h-[calc(var(--row-height)*25)]">
        <table className="dashboard-table w-full">

          {/* Sticky Add Job Row */}
          <thead className="add-job-head">
            <tr>
              <th colSpan={6}>
                <AddJobRowContent />
              </th>
            </tr>
          </thead>

          {/* Sticky Table Header */}
          <thead>
            <tr>
              <th className="text-left py-[var(--row-padding-y)] pr-[var(--row-padding-x)] text-[var(--text-color)] bg-[rgba(255,255,255,0.03)]">Job #</th>
              <th className="text-left py-[var(--row-padding-y)] pr-[var(--row-padding-x)] text-[var(--text-color)] bg-[rgba(255,255,255,0.03)]">Customer</th>
              <th className="text-left py-[var(--row-padding-y)] pr-[var(--row-padding-x)] text-[var(--text-color)] bg-[rgba(255,255,255,0.03)]">Address</th>
              <th className="text-left py-[var(--row-padding-y)] pr-[var(--row-padding-x)] text-[var(--text-color)] bg-[rgba(255,255,255,0.03)]">Created</th>
              <th className="text-left py-[var(--row-padding-y)] pr-[var(--row-padding-x)] text-[var(--text-color)] bg-[rgba(255,255,255,0.03)]">Actions</th>
            </tr>
          </thead>

          <tbody>
            {jobs.map((j) => {
              const fullAddress = [
                j.customerAddress,
                j.customerCity,
                j.customerState,
                j.customerZip,
              ].filter(Boolean).join(", ");

              return (
                <tr key={j.id} className="border-b border-[var(--border-color)] last:border-0">
                  <td className="py-[var(--row-padding-y)] pr-[var(--row-padding-x)] text-[var(--text-color)]">{j.jobNumber}</td>
                  <td className="py-[var(--row-padding-y)] pr-[var(--row-padding-x)] text-[var(--text-color)]">{j.customerName ?? "-"}</td>
                  <td className="py-[var(--row-padding-y)] pr-[var(--row-padding-x)] text-[var(--text-color)]">{fullAddress || "-"}</td>
                  <td className="py-[var(--row-padding-y)] pr-[var(--row-padding-x)] text-[var(--text-color)]">
                    {j.createdAt.toLocaleDateString()}
                  </td>
                  <td className="py-[var(--row-padding-y)] pr-[var(--row-padding-x)] text-[var(--text-color)]">
                    <JobActions jobId={j.id} jobNumber={j.jobNumber} />
                  </td>
                </tr>
              );
            })}

            {jobs.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-[var(--text-color)] opacity-60">
                  No jobs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[length:var(--base-font-size)] text-[var(--text-color)]">
        <span>
          Page {page} of {totalPages} ({total} total)
        </span>

        <div className="flex gap-[var(--block-gap)]">

        {/* First Page */}
        {page > 1 && (
          <Link
            href={`?${new URLSearchParams({ q, status, sort, dir, page: "1" })}`}
            className="px-[var(--btn-padding-x)] py-[var(--btn-padding-y)] rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-color)] hover:bg-[var(--selected-bg)] transition"
          >
            First
          </Link>
        )}

        {/* Previous */}
        {page > 1 && (
          <Link
            href={`?${new URLSearchParams({ q, status, sort, dir, page: String(page - 1) })}`}
            className="px-[var(--btn-padding-x)] py-[var(--btn-padding-y)] rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-color)] hover:bg-[var(--selected-bg)] transition"
          >
            Previous
          </Link>
        )}

        {/* Jump Back 3 */}
        {page > 3 && (
          <Link
            href={`?${new URLSearchParams({ q, status, sort, dir, page: String(page - 3) })}`}
            className="px-[var(--btn-padding-x)] py-[var(--btn-padding-y)] rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-color)] hover:bg-[var(--selected-bg)] transition"
          >
            -3
          </Link>
        )}

        {/* Jump Forward 3 */}
        {page < totalPages - 3 && (
          <Link
            href={`?${new URLSearchParams({ q, status, sort, dir, page: String(page + 3) })}`}
            className="px-[var(--btn-padding-x)] py-[var(--btn-padding-y)] rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-color)] hover:bg-[var(--selected-bg)] transition"
          >
            +3
          </Link>
        )}

        {/* Next */}
        {page < totalPages && (
          <Link
            href={`?${new URLSearchParams({ q, status, sort, dir, page: String(page + 1) })}`}
            className="px-[var(--btn-padding-x)] py-[var(--btn-padding-y)] rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition"
          >
            Next
          </Link>
        )}

        {/* Last Page */}
        {page < totalPages && (
          <Link
            href={`?${new URLSearchParams({ q, status, sort, dir, page: String(totalPages) })}`}
            className="px-[var(--btn-padding-x)] py-[var(--btn-padding-y)] rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition"          
          >
            Last
          </Link>
        )}
        </div>
      </div>
    </div>
  );
}
