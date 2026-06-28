"use client";

import { useEffect, useState } from "react";

interface Template {
  id: string;
  name: string;
}

export default function JobFormsPage({ params }: { params: { id: string } }) {
  const jobId = params.id;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/forms/templates");
      const data = await res.json();
      setTemplates(data.templates || []);
      setLoading(false);
    };

    load();
  }, []);

  const generate = async (templateId: string) => {
    setGenerating(templateId);

    const res = await fetch("/api/forms/fill", {
      method: "POST",
      body: JSON.stringify({ jobId, templateId }),
    });

    const data = await res.json();
    setGenerating(null);

    if (data.url) {
      window.open(data.url, "_blank");
    } else {
      alert("Failed to generate PDF");
    }
  };

  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Generate Forms</h1>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border text-left">Template</th>
            <th className="p-2 border text-left">Action</th>
          </tr>
        </thead>

        <tbody>
          {templates.map((t) => (
            <tr key={t.id}>
              <td className="p-2 border">{t.name}</td>
              <td className="p-2 border">
                <button
                  onClick={() => generate(t.id)}
                  disabled={generating === t.id}
                  className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
                >
                  {generating === t.id ? "Generating…" : "Fill PDF"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
