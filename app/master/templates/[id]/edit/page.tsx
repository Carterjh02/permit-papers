"use server";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import {
  updateTemplateAction,
  deleteTemplateAction,
} from "./actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TemplateEditPage({ params }: PageProps) {
  const { id } = await params;

  const template = await prisma.formTemplate.findUnique({
    where: { id },
  });

  if (!template) notFound();

  const tpl = template;

  const existingFolderPath = (tpl.storagePath ?? "")
    .replace(/^templates\//, "")
    .split("/")
    .slice(0, -1)
    .join("/");

  return (
    <div className="page-container space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Template</h1>

        <form action={deleteTemplateAction}>
          <input type="hidden" name="template_id" value={tpl.id} />
          <button className="btn btn-danger" type="submit">
            Delete Template
          </button>
        </form>
      </div>

      <form action={updateTemplateAction} className="space-y-4 card p-6">
        <input type="hidden" name="template_id" value={tpl.id} />

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
          <textarea name="description" defaultValue={tpl.description ?? ""} />
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
          <input name="file" type="file" accept="application/pdf" />
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
