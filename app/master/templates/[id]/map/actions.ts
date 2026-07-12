"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { redirect } from "next/navigation";

export async function saveMappings(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "master") redirect("/login");

  const templateId = formData.get("templateId") as string;
  if (!templateId) throw new Error("Missing templateId");

  const template = await prisma.formTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) throw new Error("Template not found.");

  const fieldNames = Array.isArray(template.fieldNames)
    ? (template.fieldNames as string[])
    : [];

  const mappings = fieldNames
    .map((field) => {
      const mappedTo = formData.get(`map_${field}`) as string | null;
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

  redirect(`/master/templates/${templateId}/map`);
}
