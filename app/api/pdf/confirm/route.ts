// app/api/pdf/confirm/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { base64ToBuffer } from "@/lib/pdf/pdfUtils";

export async function POST(req: Request) {
  try {
    const { jobId, templateName, pdfBase64 } = await req.json();

    const buffer = base64ToBuffer(pdfBase64);

    const filePath = `jobs/${jobId}/${templateName}-${Date.now()}.pdf`;

    const { error } = await supabaseServer.storage
      .from("generated")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
      });

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to save PDF" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "PDF saved",
      filePath,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error saving PDF" },
      { status: 500 }
    );
  }
}
