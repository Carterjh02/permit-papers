import { detectCounty } from "./detectCounty";
import { extractTextFromImage } from "@/lib/ocr";
import { parsePAData } from "./parse";
import type { ParsedPAData } from "./types"; 
import { searchBroward } from "./search/broward";
import { searchPalmBeach } from "./search/palmBeach";
import { searchSaintLucie } from "./search/saintLucie";
import { normalizeAddress } from "./normalizeAddress";
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

  const normalizedAddress = normalizeAddress(input.address);

  const county = detectCounty({
    address: normalizedAddress,
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
  let html: string | undefined;
  let parsed: ParsedPAData = {};   

  switch (county) {

    case "broward": {
      const result = await searchBroward(normalizedAddress);
      screenshot = result.screenshot;
      html = result.html;
    
      // Save sketch if available
      if (result.sketchBuffer) {
        const sketchPath = `${job.company.companyCode}/jobs/${job.jobNumber}/sketch.png`;
    
        const { error: sketchUploadError } = await supabaseServer.storage
          .from("companies")
          .upload(sketchPath, result.sketchBuffer, {
            upsert: true,
            contentType: "image/png",
          });
    
        if (sketchUploadError) {
          console.error("❌ [PA] Sketch upload error:", sketchUploadError);
        } else {
          console.log("🟩 [PA] Sketch image saved:", sketchPath);
          parsed.sketchPath = sketchPath;
        }
      }
    
      parsed = parsePAData(html!, "broward");
      break;
    }
    case "palmBeach": {
      const result = await searchPalmBeach(normalizedAddress);
      screenshot = result.screenshot;
      html = result.html;
    
      // Save sketch if available
      if (result.sketchBuffer) {
        const sketchPath = `${job.company.companyCode}/jobs/${job.jobNumber}/sketch.png`;
    
        const { error: sketchUploadError } = await supabaseServer.storage
          .from("companies")
          .upload(sketchPath, result.sketchBuffer, {
            upsert: true,
            contentType: "image/png",
          });
    
        if (sketchUploadError) {
          console.error("❌ [PA] Sketch upload error:", sketchUploadError);
        } else {
          console.log("🟩 [PA] Sketch image saved:", sketchPath);
          parsed.sketchPath = sketchPath;
        }
      }
    
      parsed = parsePAData(html!, "palmBeach");
      break;
    }

    case "saintLucie": {
      screenshot = await searchSaintLucie(normalizedAddress);

      // Saint Lucie still uses OCR
      const downloadedBuffer = screenshot;
      const ocrText = await extractTextFromImage(downloadedBuffer);
      parsed = parsePAData(ocrText, "saintLucie");
      break;
    }

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

  let ocrText: string | undefined = undefined;

  if (county === "saintLucie") {
    const downloadedBuffer = Buffer.from(await downloaded.arrayBuffer());
    ocrText = await extractTextFromImage(downloadedBuffer);
  }
  
  return {
    county: county as "broward" | "palmBeach" | "saintLucie",
    paPath,
    parsed,
    html,
    ocrText,
  };  
}
