"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { extractPdfFields } from "@/lib/pdf/extractFields"; // stays client-safe

export default function TemplateMappingPage() {
  const params = useSearchParams();

  const templatePath = params.get("path") ?? "";
  const outputType = (params.get("type") ?? "temp") as "temp" | "permanent";

  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fields, setFields] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [templateId, setTemplateId] = useState<string>("");

  useEffect(() => {
    if (!templatePath) return;

    async function load() {
      setLoading(true);

      // 1. Fetch template record by path
      const res = await fetch(
        `/api/forms/templates/byPath?path=${encodeURIComponent(templatePath)}`
      );
      const data = await res.json();

      if (!data?.template) {
        console.error("Template not found");
        setLoading(false);
        return;
      }

      setTemplateId(data.template.id);

      // 2. Signed URL
      const signed = await supabaseClient.storage
        .from("templates")
        .createSignedUrl(templatePath, 3600);

      if (signed.error) {
        console.error("Signed URL error:", signed.error);
        setLoading(false);
        return;
      }

      setPdfUrl(signed.data.signedUrl);

      // 3. Extract fields
      const extracted = await extractPdfFields(templatePath);
      setFields(extracted);

      // 4. Load existing mappings
      const mapRes = await fetch(
        `/api/forms/templates/${data.template.id}/mappings`
      );
      const mapJson = await mapRes.json();

      const existing: Record<string, string> = {};
      for (const m of mapJson.mappings) {
        existing[m.pdfFieldName] = m.mappedTo;
      }

      setMappings(existing);

      setLoading(false);
    }

    load();
  }, [templatePath]);

  const updateMapping = (field: string, value: string) => {
    setMappings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!templateId) return;

    const formData = new FormData();
    formData.set("templateId", templateId);

    fields.forEach((f) => {
      formData.set(`map_${f}`, mappings[f] || "");
    });

    // ⭐ Correct Next.js 16 pattern — POST to API route
    await fetch(`/api/forms/templates/${templateId}/mappings`, {
      method: "POST",
      body: formData,
    });
  };

  if (!templatePath) {
    return (
      <div className="p-10">
        <h1 className="text-2xl font-bold">Missing Template Path</h1>
        <p className="mt-4 text-gray-600">No template path was provided.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-10">
        <h1 className="text-xl font-semibold">Loading Template…</h1>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-8">
      <h1 className="text-2xl font-bold">Template Mapping</h1>

      {/* TEMPLATE INFO */}
      <div className="border rounded p-4 bg-gray-50 space-y-2">
        <p>
          <b>Template Path:</b> {templatePath}
        </p>
        <p>
          <b>Output Type:</b>{" "}
          {outputType === "permanent" ? (
            <span className="text-red-600 font-semibold">Permanent</span>
          ) : (
            <span className="text-green-600 font-semibold">Temporary</span>
          )}
        </p>
      </div>

      {/* PDF PREVIEW */}
      {pdfUrl && (
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">PDF Preview</h2>
          <iframe src={pdfUrl} className="w-full h-[600px] border" />
        </div>
      )}

      {/* FIELD MAPPING */}
      <div className="border rounded p-4">
        <h2 className="text-lg font-semibold mb-4">Map PDF Fields</h2>

        {fields.length === 0 && (
          <p className="text-gray-500">No fields detected in this PDF.</p>
        )}

        {fields.length > 0 && (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4">PDF Field</th>
                <th className="text-left py-2 pr-4">Map To</th>
              </tr>
            </thead>

            <tbody>
              {fields.map((field) => (
                <tr key={field} className="border-b last:border-0">
                  <td className="py-2 pr-4">{field}</td>
                  <td className="py-2 pr-4">
                    <input
                      className="input w-full"
                      value={mappings[field] || ""}
                      onChange={(e) => updateMapping(field, e.target.value)}
                      placeholder="job.customerName, company.phone, etc."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button onClick={handleSave} className="btn btn-primary">
        Save Mappings
      </button>
    </div>
  );
}
