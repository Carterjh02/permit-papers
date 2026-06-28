import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { extractPdfFields } from "@/lib/pdf/extractFields";

export default async function BatchMappingPage(props: {
  searchParams: Promise<{ paths?: string }>;
}) {
  // Next.js 16 requires awaiting searchParams
  const { paths: raw } = await props.searchParams;

  if (!raw) {
    return (
      <div className="p-10">
        <h1 className="text-2xl font-bold">No Templates Provided</h1>
        <p className="mt-4 text-gray-600">
          No template paths were passed to this batch mapping page.
        </p>
      </div>
    );
  }

  // Decode and split paths
  const paths = raw
    .split(",")
    .map((p) => decodeURIComponent(p.trim()))
    .filter(Boolean);

  if (paths.length === 0) {
    return (
      <div className="p-10">
        <h1 className="text-2xl font-bold">Invalid Template List</h1>
      </div>
    );
  }

  /* ---------------------------------------------------------
     LOAD OR CREATE TEMPLATE RECORDS
  --------------------------------------------------------- */
  const templates = [];

  for (const path of paths) {
    let template = await prisma.formTemplate.findFirst({
      where: { path },
    });

    if (!template) {
      template = await prisma.formTemplate.create({
        data: {
          name: path.split("/").pop() || "Untitled",
          path,
          storagePath: path,
          county: "",
          municipality: "",
          formType: "",
          description: "",
          fieldNames: [],
          mapping: {},
        },
      });
    }

    templates.push(template);
  }

  /* ---------------------------------------------------------
     EXTRACT FIELDS + SAVE fieldNames (mirrors old workflow)
  --------------------------------------------------------- */
  const templateData = [];

  for (const template of templates) {
    const fields = await extractPdfFields(template.path);

    // Save extracted fields into DB (old workflow behavior)
    await prisma.formTemplate.update({
      where: { id: template.id },
      data: { fieldNames: fields },
    });

    templateData.push({
      id: template.id,
      path: template.path,
      name: template.name,
      fields,
    });
  }

  /* ---------------------------------------------------------
     RENDER BATCH MAPPING FORM
  --------------------------------------------------------- */
  return (
    <form action={saveBatchMappings} className="p-10 space-y-10">
      <h1 className="text-3xl font-bold">Batch Template Mapping</h1>

      <p className="text-gray-600">
        Map all uploaded templates in one batch. When finished, click{" "}
        <b>Save All Mappings</b>.
      </p>

      <input
        type="hidden"
        name="templateIds"
        value={templates.map((t) => t.id).join(",")}
      />

      {templateData.map((t) => (
        <div
          key={t.id}
          className="border rounded-lg p-6 bg-gray-50 space-y-4"
        >
          <h2 className="text-xl font-semibold">
            {t.name} <span className="text-gray-500 text-sm">({t.path})</span>
          </h2>

          {t.fields.length === 0 ? (
            <p className="text-gray-500">No fields detected in this PDF.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">PDF Field</th>
                  <th className="text-left py-2 pr-4">Map To</th>
                </tr>
              </thead>

              <tbody>
                {t.fields.map((field) => (
                  <tr key={field} className="border-b last:border-0">
                    <td className="py-2 pr-4">{field}</td>
                    <td className="py-2 pr-4">
                      <input
                        className="input w-full"
                        name={`map_${t.id}_${field}`}
                        placeholder="job.customerName, company.phone, etc."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      <button className="btn btn-primary">Save All Mappings</button>
    </form>
  );
}

/* ---------------------------------------------------------
   SERVER ACTION — SAVE ALL MAPPINGS
--------------------------------------------------------- */
async function saveBatchMappings(formData: FormData) {
  "use server";

  const templateIds = (formData.get("templateIds") as string)
    .split(",")
    .map((id) => id.trim());

  for (const templateId of templateIds) {
    const template = await prisma.formTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) continue;

    const fieldNames = template.fieldNames as string[];

    const mappings = fieldNames
      .map((field) => {
        const key = `map_${templateId}_${field}`;
        const mappedTo = formData.get(key) as string | null;
        if (!mappedTo) return null;

        return {
          templateId,
          pdfFieldName: field,
          mappedTo,
        };
      })
      .filter(Boolean) as {
      templateId: string;
      pdfFieldName: string;
      mappedTo: string;
    }[];

    await prisma.formFieldMapping.deleteMany({
      where: { templateId },
    });

    if (mappings.length > 0) {
      await prisma.formFieldMapping.createMany({
        data: mappings,
      });
    }
  }

  redirect("/master/templates");
}
