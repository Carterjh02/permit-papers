"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import JobFormClient from "../JobFormClient";
import { generatePreviews } from "../actions";
import { formatJobFields } from "@/lib/utils/formatters";
import DeleteJobButton from "./DeleteJobButton";

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
    include: {
      company: true,
      documents: true,
    },
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
  };

  const initialTemplates = job.documents.map((d) => ({
    id: d.id,
    templateName: d.templateName,
    templatePath: d.templatePath,
  }));

  async function updateJob(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const user = session.user;

    const jobId = formData.get("job_id") as string | null;
    const targetId = jobId ?? id;

    const existing = await prisma.job.findUnique({
      where: { id: targetId },
      include: { company: true },
    });

    if (!existing) notFound();

    const allowedInner =
      user.role === "master" ||
      user.companyId === existing.companyId ||
      user.activeCompanyId === existing.companyId;

    if (!allowedInner) redirect("/dashboard");

    const raw = {
      customerName: formData.get("customer_name") as string | null,
      customerPhone: formData.get("customer_phone") as string | null,
      customerEmail: formData.get("customer_email") as string | null,

      customerAddress: formData.get("customer_address_full") as string | null,
      customerCity: formData.get("customer_address_city") as string | null,
      customerState: formData.get("customer_address_state") as string | null,
      customerZip: formData.get("customer_address_zip") as string | null,

      legalDescription: formData.get("legal_description") as string | null,
    };

    const formatted = formatJobFields({
      customerName: raw.customerName ?? undefined,
      customerPhone: raw.customerPhone ?? undefined,
      customerAddress: raw.customerAddress ?? undefined,
      customerCity: raw.customerCity ?? undefined,
      customerState: raw.customerState ?? undefined,
      customerZip: raw.customerZip ?? undefined,
      legalDescription: raw.legalDescription ?? undefined,
    });

    const subdivision = formData.get("subdivision") as string | null;
    const taxFolioNumber = formData.get("customer_tax_folio") as string | null;

    const jobValue = formData.get("job_price")
      ? Number(formData.get("job_price"))
      : null;

    const description =
      (formData.get("desc_of_improvement") as string | null)?.trim() ||
      existing.company?.descOfImprov ||
      existing.description ||
      "";

    await prisma.job.update({
      where: { id: targetId },
      data: {
        customerName: formatted.customerName,
        customerPhone: formatted.customerPhone,
        customerEmail: raw.customerEmail ?? undefined,

        customerAddress: formatted.customerAddress,
        customerCity: formatted.customerCity,
        customerState: formatted.customerState,
        customerZip: formatted.customerZip,

        legalDescription:
          formatted.legalDescription ?? raw.legalDescription ?? undefined,

        subdivision: subdivision ?? undefined,
        taxFolioNumber: taxFolioNumber ?? undefined,
        jobValue,
        description,
      },
    });

    await generatePreviews(targetId);

    redirect(`/dashboard/jobs/${targetId}/preview`);
  }

  async function addTemplate(path: string) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const user = session.user;

    const existing = await prisma.job.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!existing) notFound();

    const allowedInner =
      user.role === "master" ||
      user.companyId === existing.companyId ||
      user.activeCompanyId === existing.companyId;

    if (!allowedInner) redirect("/dashboard");

    const cleanPath = path.replace(/\\/g, "/");

    const template = await prisma.formTemplate.findFirst({
      where: { path: cleanPath },
    });

    await prisma.jobDocument.create({
      data: {
        jobId: existing.id,
        templateId: template?.id,
        templatePath: cleanPath,
        templateName:
          template?.name ?? cleanPath.split("/").slice(-1)[0] ?? cleanPath,
      },
    });
  }

  async function removeTemplate(jobDocumentId: string) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const doc = await prisma.jobDocument.findUnique({
      where: { id: jobDocumentId },
      include: { job: true },
    });

    if (!doc) return;

    const user = session.user;

    const allowedInner =
      user.role === "master" ||
      user.companyId === doc.job.companyId ||
      user.activeCompanyId === doc.job.companyId;

    if (!allowedInner) redirect("/dashboard");

    await prisma.jobDocument.delete({
      where: { id: jobDocumentId },
    });
  }

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

          <DeleteJobButton jobNumber={job.jobNumber} />

          <form
            id="delete-job-form"
            action={async () => {
              "use server";
              await prisma.job.delete({ where: { id } });
              redirect("/dashboard");
            }}
          />
        </div>
      </div>

      <JobFormClient
        mode="edit"
        jobId={job.id}
        initialJob={initialJob}
        initialTemplates={initialTemplates}
        onSave={updateJob}
        onAddTemplate={addTemplate}
        onRemoveTemplate={removeTemplate}
      />
    </div>
  );
}
