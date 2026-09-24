import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { prisma } from "@/lib/prisma";
import { parsePAData } from "@/lib/propertyAppraiser/parse";
import type { ParsedPAData } from "@/lib/propertyAppraiser/types";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export async function POST(req: Request) {
  try {
    const { county, jobId, companyCode, jobNumber, html } = await req.json();

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
    // Parse PA HTML into structured data
    // ---------------------------------------------------------
    const parsed: ParsedPAData = parsePAData(html, county);

    console.log("🟩 [PA_UPLOAD] Parsed data:", parsed);

    return NextResponse.json({
      status: "success",
      county,
      jobId,
      companyCode,
      jobNumber,
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
