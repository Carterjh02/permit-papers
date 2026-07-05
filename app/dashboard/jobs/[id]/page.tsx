"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { redirect, notFound } from "next/navigation";
import JobFormClient from "../JobFormClient";
import DeleteJobButton from "./DeleteJobButton";
import {
  updateJobAction,
  addTemplateAction,
  removeTemplateAction,
  deleteJobAction,
  createMinimalJob,
  uploadSnippetImmediately,
} from "../serverActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JobEditPage({ params }: PageProps) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user;

  const job = await prisma.job.findUnique({
    where: { id },
    include: { company: true, documents: true },
  });

  if (!job) notFound();

  const allowed =
    user.role === "master" ||
    user.companyId === job.companyId ||
    user.activeCompanyId === job.companyId;

  if (!allowed) redirect("/dashboard");

  const initialJob = {
    customerName: job.customerName,
    customerPhone: job.customerPhone,
    customerEmail: job.customerEmail,
    customerAddress: job.customerAddress,
    customerCity: job.customerCity,
    customerState: job.customerState,
    customerZip: job.customerZip,
    legalDescription: job.legalDescription,
    subdivision: job.subdivision,
    taxFolioNumber: job.taxFolioNumber,
    jobValue: job.jobValue,
    description: job.description ?? "",
    snippetPath: job.snippetPath ?? null,
    companyId: job.companyId,
    createdBy: user.username,
  };

  const initialTemplates = job.documents.map((d) => ({
    id: d.id,
    templateName: d.templateName ?? "",
    templatePath: d.templatePath,
  }));

  return (
    <div className="page-container space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Edit Job — {job.jobNumber}
        </h1>

        <div className="flex gap-3">
          <a href="/dashboard" className="btn btn-secondary">
            Back to Dashboard
          </a>

          <DeleteJobButton
            jobNumber={job.jobNumber}
            action={async () => {
              "use server";
              await deleteJobAction(id);
            }}
          />
        </div>
      </div>

      <JobFormClient
        mode="edit"
        jobId={job.id}
        initialJob={initialJob}
        initialTemplates={initialTemplates}
        onSave={async (formData) => {
          "use server";
          formData.set("route_job_id", id);
          await updateJobAction(formData);
        }}
        onAddTemplate={async (path) => {
          "use server";
          await addTemplateAction(id, path);
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
          return await uploadSnippetImmediately(jobId, file);
        }}
      />
    </div>
  );
}
