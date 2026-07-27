import { detectCounty } from "./detectCounty";
import { extractTextFromImage } from "@/lib/ocr";
import { parsePAData } from "./parse";
import { searchBroward } from "./search/broward";
import { searchPalmBeach } from "./search/palmBeach";
import { searchSaintLucie } from "./search/saintLucie";
import { supabaseServer } from "@/lib/supabaseServer";
import { prisma } from "@/lib/prisma";

export interface SearchInput {
  jobId: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  folio?: string;
  subdivision?: string;
  county?: string;
}

export async function runPropertyAppraiserSearch(input: SearchInput) {

  const { jobId } = input;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { company: true },
  });

  if (!job) {
    console.error("❌ [PA] Job not found:", jobId);
    throw new Error("Job not found.");
  }

  const county = detectCounty({
    address: input.address,
    city: input.city,
    state: input.state,
    zip: input.zip,
    folio: input.folio,
    subdivision: input.subdivision,
    county: input.county,
  });

  if (!county) {
    console.error("❌ [PA] Unable to determine county");
    throw new Error("Unable to determine county.");
  }

  let screenshot: Buffer;

  switch (county) {
    case "broward":
      screenshot = await searchBroward(input.address);
      break;
    case "palmBeach":
      screenshot = await searchPalmBeach(input.address);
      break;
    case "saintLucie":
      screenshot = await searchSaintLucie(input.address);
      break;
    default:
      console.error("❌ [PA] County not supported:", county);
      throw new Error(`County not supported: ${county}`);
  }

  if (!screenshot || screenshot.length === 0) {
    console.error("❌ [PA] Screenshot is empty or undefined");
  } else {
    console.log("🔵 [PA] Screenshot captured. Size:", screenshot.length);
  }

  const paPath = `${job.company.companyCode}/jobs/${job.jobNumber}/pa.png`;

  const { error: uploadError } = await supabaseServer.storage
    .from("companies")
    .upload(paPath, screenshot, {
      upsert: true,
      contentType: "image/png",
    });

  if (uploadError) {
    console.error("❌ [PA] Supabase upload error:", uploadError);
    throw new Error("Failed to upload PA screenshot.");
  }

  const { data: downloaded, error: downloadError } = await supabaseServer.storage
    .from("companies")
    .download(paPath);

  if (downloadError || !downloaded) {
    console.error("❌ [PA] Supabase download error:", downloadError);
    throw new Error("Failed to download PA screenshot for OCR.");
  }

  const downloadedBuffer = Buffer.from(await downloaded.arrayBuffer());

  const ocrText = await extractTextFromImage(downloadedBuffer);

  console.log("🔵 [PA] INPUT:", input);
  console.log("🔵 [PA] DETECTED COUNTY:", county);
  console.log("🔵 [PA] SCREENSHOT SIZE:", screenshot?.length);

  if (!ocrText) {
    console.error("❌ [PA] OCR returned empty text");
  }

  const parsed = parsePAData(ocrText, county);

  console.log("🔵 [PA] PARSED DATA:", parsed);

  return {
    county: county as "broward" | "palmBeach" | "saintLucie",
    paPath,
    ocrText,
    parsed,
  };
}
