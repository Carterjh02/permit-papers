import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

import JobFormClient from "../JobFormClient";
import { createJob } from "../actions";

export default async function NewJobPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user;

  const companyId =
    user.role === "master" ? user.activeCompanyId : user.companyId;

  if (!companyId) {
    return <div className="p-10">No active company selected.</div>;
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  const defaultDescription = company?.descOfImprov ?? "";

  return (
    <div className="page-container space-y-6">
      <h1 className="text-2xl font-bold">Create New Job</h1>

      <div className="flex justify-end">
        <a href="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </a>
      </div>

      <JobFormClient
        mode="create"
        initialJob={{
          description: defaultDescription,
          companyId,        // ⭐ REQUIRED for minimal job creation
          createdBy: user.username, // ⭐ REQUIRED for minimal job creation
        }}
        initialTemplates={[]}
        onSave={createJob}
      />
    </div>
  );
}
