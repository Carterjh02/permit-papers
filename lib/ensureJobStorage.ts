import { supabaseServer } from "@/lib/supabaseServer";

export async function ensureJobStorage(
  companyCode: string,
  jobNumber: string
) {
  const safeCompany = companyCode?.replace(/[^a-zA-Z0-9-_ ]/g, "") ?? "";
  const safeJobNumber = jobNumber?.replace(/[^a-zA-Z0-9-_ ]/g, "") ?? "";

  const base = `companies/${safeCompany}/jobs/${safeJobNumber}`;

  // 🔹 Only a single base folder marker now
  const folders = [`${base}/.keep`];

  for (const f of folders) {
    await supabaseServer.storage
      .from("companies")
      .upload(f, new Uint8Array(), {
        upsert: true,
        contentType: "text/plain",
      });
  }

  return {
    baseFolder: base,
  };
}
