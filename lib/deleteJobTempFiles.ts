import { supabaseServer } from "@/lib/supabaseServer";

/**
 * Deletes ALL temporary preview files for a job.
 *
 * 
 * companies/{companyCode}/jobs/{jobNumber}/temp/
 *
 * Behavior:
 * - Deletes only the temp folder contents
 * - Silent if folder does not exist
 * - Safe for repeated calls
 */
export async function deleteJobTempFiles(companyCode: string, jobNumber: string) {
  const safeCompany = companyCode?.replace(/[^a-zA-Z0-9-_ ]/g, "") ?? "";
  const safeJobNumber = jobNumber?.replace(/[^a-zA-Z0-9-_ ]/g, "") ?? "";

  const folder = `companies/${safeCompany}/jobs/${safeJobNumber}/temp`;

  const { data: items, error: listError } = await supabaseServer.storage
    .from("companies")
    .list(folder, { limit: 1000 });

  if (listError) {
    console.warn("Temp preview folder not found:", folder);
    return;
  }

  if (!items || items.length === 0) return;

  const paths = items.map((i) => `${folder}/${i.name}`);

  const { error: deleteError } = await supabaseServer.storage
    .from("companies")
    .remove(paths);

  if (deleteError) {
    console.error("Failed to delete temp preview files:", deleteError);
  }
}
