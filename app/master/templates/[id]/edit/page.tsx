"use server";

import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

interface PageProps {
  params: { id: string };
}

export default async function TemplateEditPage({ params }: PageProps) {
  const template = await prisma.formTemplate.findUnique({
    where: { id: params.id },
  });

  if (!template) {
    notFound();
  }

  // TS-safe non-null alias
  const tpl = template!;

  /* -----------------------------------------------------------
     SERVER ACTIONS
  ----------------------------------------------------------- */

  async function updateTemplate(formData: FormData) {
    "use server";

    const name = (formData.get("name") as string) ?? tpl.name;
    const description = (formData.get("description") as string) ?? tpl.description ?? "";
    const folderPath = (formData.get("folderPath") as string) ?? "";
    const file = formData.get("file") as File | null;

    let storagePath: string = tpl.storagePath ?? "";

    if (file && file.size > 0) {
      storagePath = `templates/${folderPath}/${file.name}`;

      const { error } = await supabaseClient.storage
        .from("permit-papers")
        .upload(storagePath, file, { upsert: true });

      if (error) throw new Error(error.message);
    }

    await prisma.formTemplate.update({
      where: { id: tpl.id },
      data: {
        name,
        description,
        storagePath,
      },
    });

    redirect("/master/templates");
  }

  async function deleteTemplate() {
    "use server";

    const path = tpl.storagePath ?? "";

    if (path.length > 0) {
      await supabaseClient.storage
        .from("permit-papers")
        .remove([path]);
    }

    await prisma.formTemplate.delete({
      where: { id: tpl.id },
    });

    redirect("/master/templates");
  }

  /* -----------------------------------------------------------
     UI
  ----------------------------------------------------------- */

  const existingFolderPath = (tpl.storagePath ?? "")
    .replace(/^templates\//, "")
    .split("/")
    .slice(0, -1)
    .join("/");

  return (
    <div className="page-container space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Template</h1>
        <form action={deleteTemplate}>
          <button className="btn btn-danger" type="submit">
            Delete Template
          </button>
        </form>
      </div>

      <form action={updateTemplate} className="space-y-4 card p-6">
        <div>
          <label className="block text-sm font-medium text-gray-800">
            Template Name
          </label>
          <input name="name" defaultValue={tpl.name} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800">
            Description
          </label>
          <textarea
            name="description"
            defaultValue={tpl.description ?? ""}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800">
            Folder Path
          </label>
          <input
            name="folderPath"
            defaultValue={existingFolderPath}
            placeholder="e.g. Broward/NOC"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800">
            Replace File (optional)
          </label>
          <input
            name="file"
            type="file"
            accept="application/pdf"
          />
          <p className="text-xs text-gray-500 mt-1">
            Current file: {tpl.storagePath}
          </p>
        </div>

        <button className="btn btn-primary" type="submit">
          Save Changes
        </button>
      </form>
    </div>
  );
}
