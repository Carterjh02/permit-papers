import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { prisma } from "@/lib/prisma";
import { extractPdfFieldNames } from "@/lib/pdf/fieldExtractor";
import { autoMapFields } from "@/lib/mapping/autoMapping";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;
    const name = (formData.get("name") as string) || "Untitled Form";

    if (!file) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const filePath = `forms/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabaseServer.storage
      .from("forms")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
      });

    if (uploadError) {
      console.error(uploadError);
      return NextResponse.json(
        { message: "Upload failed" },
        { status: 500 }
      );
    }

    const fieldNames = await extractPdfFieldNames(buffer);

    // Add required fields
    const template = await prisma.formTemplate.create({
      data: {
        name,
        storagePath: filePath,
        fieldNames,
        county: "Unknown",
        path: filePath,
        formType: "generic",
      },
    });

    const autoMapped = autoMapFields(fieldNames);

    return NextResponse.json({
      message: "Template uploaded and processed",
      templateId: template.id,
      storagePath: filePath,
      fieldNames,
      autoMapped,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Server error processing PDF" },
      { status: 500 }
    );
  }
}
