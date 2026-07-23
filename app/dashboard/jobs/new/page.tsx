import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { redirect } from "next/navigation";
import JobFormClient from "../JobFormClient";

import {
  createJobAction,
  createMinimalJob,
  uploadSnippetImmediately,
  addTemplateAction,
  removeTemplateAction,
} from "../serverActions";

import { supabaseServer } from "@/lib/supabaseServer";

/* -----------------------------------------------------------
   IMPURE CODE MUST LIVE OUTSIDE THE COMPONENT
----------------------------------------------------------- */
async function cleanupOldTempJobs(companyId: string) {
  // ⭐ Allowed here — module-level async function
  const cutoff = new Date(Date.now() - 20 * 60 * 1000);

  const oldTempJobs = await prisma.job.findMany({
    where: {
      companyId,
      createdAt: { lt: cutoff },
    },
  });

  for (const job of oldTempJobs) {
    await prisma.job.delete({
      where: { id: job.id },
    });

    await supabaseServer.storage
      .from("jobs")
      .remove([`${job.companyId}/${job.jobNumber}`]);
  }
}

export default async function NewJobPage() {
  const session = await getServerSession(authOptions);
  console.log("🔵 [NewJobPage] session from server:", session);
  if (!session) redirect("/login");

  const user = session.user;
  const companyId =
    user.role === "master" ? user.activeCompanyId : user.companyId;

  if (!companyId) {
    return <div className="p-10">No active company selected.</div>;
  }

  /* -----------------------------------------------------------
     CLEANUP — now safe, no ESLint errors
----------------------------------------------------------- */
  await cleanupOldTempJobs(companyId);

  /* -----------------------------------------------------------
     Continue normal New Job page load
----------------------------------------------------------- */
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
          companyId,
          createdBy: user.username,
        }}
        initialTemplates={[]}
        onSave={async (formData: FormData) => {
          "use server";
          await createJobAction(formData);
        }}
        onAddTemplate={async (paths) => {
          "use server";
          const job = await prisma.job.findFirst({
            where: { companyId, createdBy: user.username },
            orderBy: { createdAt: "desc" },
          });
          if (!job) return;
          for (const p of paths) {
            await addTemplateAction(job.id, p);
          }
        }}
        onRemoveTemplate={async (jobDocumentId) => {
          "use server";
          await removeTemplateAction(jobDocumentId);
        }}
        onCreateMinimalJob={async (companyId, createdBy) => {
          "use server";
          return await createMinimalJob(companyId, createdBy);
        }}
        onUploadSnippet={async (jobId, file) => {
          "use server";
          const result = await uploadSnippetImmediately(jobId, file);
          return {
            publicUrl: result.publicUrl,
            ocrText: result.ocrText,
            parsed: result.parsed,
          };
        }}
      />
    </div>
  );
}
