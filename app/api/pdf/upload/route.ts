import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { prisma } from "@/lib/prisma";
import { extractPdfFields } from "@/lib/pdf/extractFields";
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

    // Convert File → Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Storage path
    const filePath = `forms/${Date.now()}-${file.name}`;

    // Upload using service role
    const { error: uploadError } = await supabaseServer.storage
      .from("forms")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error(uploadError);
      return NextResponse.json(
        { message: "Upload failed" },
        { status: 500 }
      );
    }

    // Extract fields using NEW extractor
    const fieldNames = await extractPdfFields("forms", filePath);

    // Save template
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
