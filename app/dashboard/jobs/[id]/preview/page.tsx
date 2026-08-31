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
      documents: {
        select: {
          id: true,
          createdAt: true,
          jobId: true,
          templateId: true,
          templateName: true,
          templatePath: true,
          templateSourcePath: true,
          templateOutputPath: true,
          templateSignedUrl: true,  
        },
      },
    }
  });

  if (!job) notFound();

  const updatedAt = job.updatedAt ?? job.createdAt;
  const cacheKey = `v=${updatedAt.getTime()}`;

  // Generated previews (signed URLs)
  const allPreviews = job.documents
  .filter((doc) => doc.templateSignedUrl)
  .map((doc) => {
    const fileName = doc.templateName.endsWith(".pdf")
      ? doc.templateName
      : `${doc.templateName}.pdf`;

    const url = `${doc.templateSignedUrl}&${cacheKey}`;

    return {
      id: doc.id,
      name: fileName,
      url,
    };
  });

  async function backToJob() {
    "use server";
    redirect(`/dashboard/jobs/${id}`);
  }

  return (
    <div className="page-container space-y-[var(--section-gap)]">
      <h1 className="text-2xl font-bold text-[var(--text-color)]">
        Preview Documents — Job {job.jobNumber}
      </h1>  
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--card-bg)] border-t border-[var(--border-color)] shadow-lg p-2 flex justify-end gap-[var(--block-gap)] z-50">
        <form action={backToJob}>
          <button className="btn btn-secondary" type="submit">
            Back to Job
          </button>
        </form>
  
        <Link href="/dashboard/jobs/new" className="btn btn-primary">
          Create New Job
        </Link>
      </div>
  
      <h2 className="text-xl-d font-semibold mt-[var(--section-gap)] text-[var(--text-color)]">
        Documents
      </h2>
  
      {allPreviews.length === 0 && (
        <p className="text-[length:var(--base-font-size)] text-[var(--text-color)] opacity-80">
          No documents found.
        </p>
      )}
  
      {allPreviews.length > 0 && (
        <div className="space-y-[calc(var(--section-gap)*1.5)]">
          {allPreviews.map((p) => (
            <div
              key={p.id}
              className="dashboard-card space-y-[var(--block-gap)]"
            >
              <div className="flex justify-between items-center">
              <h3 className="text-lg-d font-semibold text-[var(--text-color)]">
                {p.name}
              </h3>
                <a
                  href={p.url}
                  target="_blank"
                  className="btn btn-primary py-[var(--btn-padding-y)] px-[var(--btn-padding-x)]"
                >
                  Open / Download
                </a>
              </div>

              <div className="mt-[var(--block-gap)] bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md p-[var(--block-gap)]">
                <iframe
                  src={p.url}
                  className="w-full h-[calc(var(--row-height)*20)] rounded-md"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
}
