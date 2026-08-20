import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { prisma } from "@/lib/prisma";
import { parsePAData } from "@/lib/propertyAppraiser/parse";
import type { ParsedPAData } from "@/lib/propertyAppraiser/types";

export async function POST(req: Request) {
  try {
    const {
      county,
      jobId,
      companyCode,
      jobNumber,
      html,
      screenshot,
      sketchBuffer,
    } = await req.json();

    if (!county || !jobId || !companyCode || !jobNumber || !html) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Validate job exists
    // ---------------------------------------------------------
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { company: true },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // Convert base64 screenshot → Uint8Array
    // ---------------------------------------------------------
    let screenshotBytes: Uint8Array | undefined;
    if (screenshot) {
      screenshotBytes = Uint8Array.from(Buffer.from(screenshot, "base64"));
    }

    let sketchBytes: Uint8Array | undefined;
    if (sketchBuffer) {
      sketchBytes = Uint8Array.from(Buffer.from(sketchBuffer, "base64"));
    }

    // ---------------------------------------------------------
    // Upload screenshot to Supabase
    // ---------------------------------------------------------
    let paPath: string | undefined;

    if (screenshotBytes) {
      paPath = `${companyCode}/jobs/${jobNumber}/pa.png`;

      const { error: uploadError } = await supabaseServer.storage
        .from("companies")
        .upload(paPath, screenshotBytes, {
          upsert: true,
          contentType: "image/png",
        });

      if (uploadError) {
        console.error("❌ [PA_UPLOAD] Screenshot upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload screenshot" },
          { status: 500 }
        );
      }
    }

    // ---------------------------------------------------------
    // Upload sketch image if present
    // ---------------------------------------------------------
    let sketchPath: string | undefined;

    if (sketchBytes) {
      sketchPath = `${companyCode}/jobs/${jobNumber}/sketch.png`;

      const { error: sketchUploadError } = await supabaseServer.storage
        .from("companies")
        .upload(sketchPath, sketchBytes, {
          upsert: true,
          contentType: "image/png",
        });

      if (sketchUploadError) {
        console.error("❌ [PA_UPLOAD] Sketch upload error:", sketchUploadError);
      }
    }

    // ---------------------------------------------------------
    // Parse PA HTML into structured data
    // ---------------------------------------------------------
    const parsed: ParsedPAData = parsePAData(html, county);

    // Attach sketch path if available
    if (sketchPath) {
      parsed.sketchPath = sketchPath;
    }

    console.log("🟩 [PA_UPLOAD] Parsed data:", parsed);

    return NextResponse.json({
      status: "success",
      county,
      paPath,
      sketchPath,
      parsed,
    });
  } catch (err) {
    console.error("❌ [PA_UPLOAD] Error:", err);
    return NextResponse.json(
      { error: "Upload failed", details: String(err) },
      { status: 500 }
    );
  }
}
