import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  const id = context.params.id;

  const template = await prisma.formTemplate.findUnique({
    where: { id },
  });

  if (!template) {
    return NextResponse.json(
      { error: "Template not found" },
      { status: 404 }
    );
  }

  const { data: signed, error } = await supabaseServer.storage
    .from("templates")
    .createSignedUrl(template.path, 3600);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    url: signed?.signedUrl ?? null,
    mapping: template.mapping ?? { fields: [] },
  });
}
