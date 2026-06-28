import { NextResponse } from "next/server";
import { getToken, type GetTokenParams } from "next-auth/jwt";
import { supabaseServer } from "@/lib/supabaseServer";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const token = await getToken({
    req: req as unknown as GetTokenParams["req"],
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) return new NextResponse("Unauthorized", { status: 401 });
  if (token.role !== "master") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const formData = await req.formData();

  const file = formData.get("file") as File | null;
  const name = formData.get("name") as string | null;
  const county = formData.get("county") as string | null;
  const municipality = formData.get("municipality") as string | null;
  const formType = formData.get("formType") as string | null;
  const description = formData.get("description") as string | null;

  if (!file || !name || !county || !municipality || !formType) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Path: County/Municipality/FormType/filename.pdf
  const safeCounty = county.replace(/\s+/g, "");
  const safeMunicipality = municipality.replace(/\s+/g, "");
  const safeFormType = formType.replace(/\s+/g, "");
  const safeFilename = file.name.replace(/\s+/g, "_");

  const path = `${safeCounty}/${safeMunicipality}/${safeFormType}/${safeFilename}`;

  const { data, error } = await supabaseServer.storage
    .from("forms")
    .upload(path, buffer, {
      contentType: file.type || "application/pdf",
      upsert: true,
    });

  if (error || !data) {
    return new NextResponse("Failed to upload PDF", { status: 500 });
  }

  // We no longer need publicUrl — remove unused variable
  supabaseServer.storage.from("forms").getPublicUrl(path);

  const template = await prisma.formTemplate.create({
    data: {
      name,
      county,
      municipality,
      formType,
      description: description ?? "",
      path,          // Supabase storage path
      storagePath: path,
      fieldNames: [], // empty until extracted
      mapping: {},    // empty until mapped
    },
  });

  return NextResponse.json(template);
}
