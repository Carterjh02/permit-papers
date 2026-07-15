"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface JobData {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
}

export default function PrintJobPageInner() {
  const searchParams = useSearchParams();

  const forms = JSON.parse(searchParams.get("forms") || "[]");
  const jobId = searchParams.get("job") || "";

  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filledPdfs, setFilledPdfs] = useState<
    { name: string; url: string }[]
  >([]);

  useEffect(() => {
    const loadJob = async () => {
      setLoading(true);

      const fakeJob: JobData = {
        id: jobId,
        name: "Sample Job",
        address: "123 Main St",
        city: "Orlando",
        state: "FL",
      };

      setJob(fakeJob);
      setLoading(false);
    };

    loadJob();
  }, [jobId]);

  useEffect(() => {
    const fill = async () => {
      if (!job) return;

      const results: { name: string; url: string }[] = [];

      for (const formPath of forms as string[]) {
        const res = await fetch("/api/forms/fill", {
          method: "POST",
          body: JSON.stringify({
            jobId,
            templatePath: formPath,
          }),
        });

        const data = await res.json();

        if (data?.url) {
          const finalUrl = `${data.url}?t=${Date.now()}`;

          results.push({
            name: formPath.split("/").pop() || "Form",
            url: finalUrl,
          });
        }
      }

      setFilledPdfs(results);
    };

    fill();
  }, [job, forms, jobId]);

  if (loading || !job) {
    return <div className="p-6 text-gray-500">Loading job…</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Print Job</h1>
        <p className="text-gray-600">
          {job.name} — {job.address}, {job.city}, {job.state}
        </p>
      </div>

      <div className="border rounded p-4 bg-gray-50">
        <h2 className="font-semibold mb-2">Selected Forms</h2>
        <ul className="list-disc ml-6">
          {(forms as string[]).map((f: string, i: number) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </div>

      <div className="border rounded p-4 bg-gray-50">
        <h2 className="font-semibold mb-4">Generated PDFs</h2>

        {filledPdfs.length === 0 && (
          <p className="text-gray-500">Generating PDFs…</p>
        )}

        <ul className="space-y-3">
          {filledPdfs.map((pdf, i) => (
            <li key={i} className="flex items-center justify-between">
              <span>{pdf.name}</span>
              <a
                href={pdf.url}
                target="_blank"
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
