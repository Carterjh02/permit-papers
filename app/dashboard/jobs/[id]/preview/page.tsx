"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JobPreviewPage({ params }: PageProps) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      company: true,
      documents: true,
    },
  });

  if (!job) notFound();

  const updatedAt = job.updatedAt ?? job.createdAt;
  const cacheKey = `v=${updatedAt.getTime()}`;

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // ⭐ Use templateOutputPath (filled PDF)
  const generatedPreviews = job.documents
    .filter((doc) => doc.templateOutputPath) // only show generated PDFs
    .map((doc) => {
      const fileName = `${doc.templateName}.pdf`;
      const url = `${baseUrl}/storage/v1/object/public/companies/${doc.templateOutputPath}?${cacheKey}`;

      return {
        id: doc.id,
        name: fileName,
        url,
      };
    });

  // Permanent files (unchanged)
  const safeCompany = job.company.companyCode.replace(/[^a-zA-Z0-9-_ ]/g, "");
  const jobNumber = job.jobNumber;

  const permanentFiles = await prisma.jobFile.findMany({
    where: { jobId: id },
    orderBy: { createdAt: "asc" },
  });

  const permanentPreviews = permanentFiles.map((file) => {
    const fileName = file.fileName;
    const path = `${safeCompany}/jobs/${jobNumber}/${fileName}`;
    const url = `${baseUrl}/storage/v1/object/public/companies/${path}?${cacheKey}`;

    return {
      id: file.id,
      name: fileName,
      url,
    };
  });

  async function backToJob() {
    "use server";
    redirect(`/dashboard/jobs/${id}`);
  }

  return (
    <div className="page-container space-y-6">
      <h1 className="text-2xl font-bold">
        Preview Documents — Job {job.jobNumber}
      </h1>

      <div className="flex justify-end gap-3">
        <form action={backToJob}>
          <button className="btn btn-secondary" type="submit">
            Back to Job
          </button>
        </form>

        <Link href="/dashboard/jobs/new" className="btn btn-primary">
          Create New Job
        </Link>
      </div>

      <h2 className="text-xl font-semibold mt-6">Generated Previews</h2>

      {generatedPreviews.length === 0 && (
        <p className="text-sm text-gray-500">No preview documents found.</p>
      )}

      {generatedPreviews.length > 0 && (
        <div className="space-y-8">
          {generatedPreviews.map((p) => (
            <div key={p.id} className="card p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <a href={p.url} target="_blank" className="btn btn-primary btn-sm">
                  Open / Download
                </a>
              </div>
              <iframe src={p.url} className="w-full h-[600px]" />
            </div>
          ))}
        </div>
      )}

      <h2 className="text-xl font-semibold mt-10">Permanent Job Files</h2>

      {permanentPreviews.length === 0 && (
        <p className="text-sm text-gray-500">
          No permanent documents uploaded yet.
        </p>
      )}

      {permanentPreviews.length > 0 && (
        <div className="space-y-8">
          {permanentPreviews.map((p) => (
            <div key={p.id} className="card p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <a href={p.url} target="_blank" className="btn btn-primary btn-sm">
                  Open / Download
                </a>
              </div>
              <iframe src={p.url} className="w-full h-[600px]" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
