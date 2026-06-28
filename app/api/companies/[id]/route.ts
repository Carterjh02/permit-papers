import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, context: { params: { id: string } }) {
  const id = context.params.id;

  const form = await req.formData();
  const name = form.get("name") as string;
  const address = form.get("address") as string;

  await prisma.company.update({
    where: { id },
    data: { name, address },
  });

  return NextResponse.redirect(`/admin/companies/${id}`);
}
