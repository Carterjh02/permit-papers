"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface PdfField {
  name: string;
  type: string;
}

interface MappingRow {
  pdfFieldName: string;
  mappedTo: string;
}

const CHEAT_SHEET_KEYS = [
  "company_name",
  "company_license",
  "phone",
  "email",
  "address_full",
  "customer_name",
  "customer_phone",
  "customer_email",
  "customer_address_full",
  "customer_address_city",
  "customer_address_state",
  "customer_adddress_zip",
  "customer_tax_folio",
  "job_price",
];

function suggestKeyForFieldName(fieldName: string): string | null {
  const raw = fieldName.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (raw.includes("customername") || raw === "name" || raw === "custname")
    return "customer_name";
  if (raw.includes("customerphone") || raw.includes("custphone") || raw.includes("phone"))
    return "customer_phone";
  if (raw.includes("customeremail") || raw.includes("custemail") || raw.includes("email"))
    return "customer_email";
  if (raw.includes("customeraddress") || raw.includes("serviceaddress"))
    return "customer_address_full";
  if (raw.includes("city") && (raw.includes("customer") || raw.includes("service")))
    return "customer_address_city";
  if (raw.includes("state") && (raw.includes("customer") || raw.includes("service")))
    return "customer_address_state";
  if (
    (raw.includes("zip") || raw.includes("zipcode") || raw.includes("postal")) &&
    (raw.includes("customer") || raw.includes("service"))
  )
    return "customer_adddress_zip";
  if (raw.includes("folio") || raw.includes("taxid") || raw.includes("taxfolio"))
    return "customer_tax_folio";
  if (
    raw.includes("jobvalue") ||
    raw.includes("contractamount") ||
    raw.includes("jobprice")
  )
    return "job_price";

  if (raw.includes("companyname") || raw.includes("contractorname"))
    return "company_name";
  if (raw.includes("lic") || raw.includes("license") || raw.includes("licensenumber"))
    return "company_license";
  if (
    raw.includes("contractorphone") ||
    (raw.includes("phone") && raw.includes("contractor"))
  )
    return "phone";
  if (
    raw.includes("contractoremail") ||
    (raw.includes("email") && raw.includes("contractor"))
  )
    return "email";
  if (
    raw.includes("contractoraddress") ||
    raw.includes("companyaddress") ||
    raw.includes("mailingaddress")
  )
    return "address_full";

  for (const key of CHEAT_SHEET_KEYS) {
    const compactKey = key.replace(/[^a-z0-9]/g, "");
    if (raw.includes(compactKey) || compactKey.includes(raw)) return key;
  }

  return null;
}

export default function TemplateMappingPage() {
  const { id: templateId } = useParams();

  const [fields, setFields] = useState<PdfField[]>([]);
  const [mappings, setMappings] = useState<MappingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [fieldsRes, mappingsRes] = await Promise.all([
        fetch(`/api/forms/templates/${templateId}/fields`),
        fetch(`/api/forms/templates/${templateId}/mappings`),
      ]);

      const fieldsData = await fieldsRes.json();
      const mappingsData = await mappingsRes.json();

      const existingMappings: MappingRow[] = mappingsData.mappings || [];

      const initial: MappingRow[] = fieldsData.fields.map((field: PdfField) => {
        const existing = existingMappings.find(
          (m) => m.pdfFieldName === field.name
        );

        if (existing) return existing;

        const suggestion = suggestKeyForFieldName(field.name);

        return {
          pdfFieldName: field.name,
          mappedTo: suggestion ?? "",
        };
      });

      setFields(fieldsData.fields);
      setMappings(initial);
      setLoading(false);
    };

    load();
  }, [templateId]);

  const updateMapping = (pdfFieldName: string, mappedTo: string) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.pdfFieldName === pdfFieldName ? { ...m, mappedTo } : m
      )
    );
  };

  const save = async () => {
    await fetch(`/api/forms/templates/${templateId}/mappings`, {
      method: "POST",
      body: JSON.stringify({ mappings }),
    });

    alert("Mappings saved");
  };

  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Field Mapping</h1>
      <p className="text-sm text-gray-600">
        Fields with suggested mappings are pre-filled. Review and adjust as needed, then click Save.
      </p>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border text-left">PDF Field Name</th>
            <th className="p-2 border text-left">Map To</th>
          </tr>
        </thead>

        <tbody>
          {fields.map((field) => {
            const existing = mappings.find(
              (m) => m.pdfFieldName === field.name
            );

            return (
              <tr key={field.name}>
                <td className="p-2 border font-mono">{field.name}</td>
                <td className="p-2 border">
                  <select
                    className="border p-1 text-sm"
                    value={existing?.mappedTo || ""}
                    onChange={(e) =>
                      updateMapping(field.name, e.target.value)
                    }
                  >
                    <option value="">— Select —</option>
                    {CHEAT_SHEET_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button
        onClick={save}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Save Mappings
      </button>
    </div>
  );
}
