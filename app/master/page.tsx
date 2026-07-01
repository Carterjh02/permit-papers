"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function MasterHome() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");

  const user = session.user;

  if (user.role !== "master") {
    redirect("/dashboard");
  }

  const companiesCount = await prisma.company.count();
  const usersCount = await prisma.user.count();
  const jobsCount = await prisma.job.count();

  return (
    <div className="page-container space-y-6">
      <h1 className="text-2xl font-bold">Master Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Companies</p>
          <p className="text-2xl font-bold">{companiesCount}</p>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Users</p>
          <p className="text-2xl font-bold">{usersCount}</p>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Jobs</p>
          <p className="text-2xl font-bold">{jobsCount}</p>
        </div>
      </div>
    </div>
  );
}
