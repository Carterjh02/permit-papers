"use server";

import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

export async function updateTemplateAction(formData: FormData) {
  const id = formData.get("template_id") as string;

  const tpl = await prisma.formTemplate.findUnique({
    where: { id },
  });

  if (!tpl) notFound();

  const name = (formData.get("name") as string) ?? tpl.name;
  const description =
    (formData.get("description") as string) ?? tpl.description ?? "";
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

export async function deleteTemplateAction(formData: FormData) {
  const id = formData.get("template_id") as string;

  const tpl = await prisma.formTemplate.findUnique({
    where: { id },
  });

  if (!tpl) notFound();

  const path = tpl.storagePath ?? "";

  if (path.length > 0) {
    await supabaseClient.storage.from("permit-papers").remove([path]);
  }

  await prisma.formTemplate.delete({
    where: { id },
  });

  redirect("/master/templates");
}
