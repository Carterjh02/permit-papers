"use server";

import { prisma } from "@/lib/prisma";

export async function deleteTemplateRecord(path: string) {
  await prisma.formTemplate.deleteMany({
    where: { path },
  });
}
