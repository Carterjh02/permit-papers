import { supabaseClient } from "@/lib/supabaseClient";

export interface CompanyFolderItem {
  name: string;
  type: "folder";
}

export interface CompanyFileItem {
  name: string;
  type: "file";
  path: string;
}

export interface CompanyFolderListing {
  folders: CompanyFolderItem[];
  files: CompanyFileItem[];
}

/**
 * List folders/files inside the companies bucket.
 * Hidden folders: jobs, logos
 */
export async function listCompanyFolder(path: string): Promise<CompanyFolderListing> {
  const normalized = path.replace(/\/$/, "").replace(/\/+/g, "/");
  const prefix = normalized === "" ? "" : normalized + "/";

  const { data, error } = await supabaseClient.storage
    .from("companies")
    .list(prefix, {
      limit: 1000,
      offset: 0,
    });

  if (error) {
    console.error("Supabase list error (companies):", error);
    throw new Error("Failed to list company folder");
  }

  const folders: CompanyFolderItem[] = [];
  const files: CompanyFileItem[] = [];

  for (const item of data || []) {
    if (item.name.startsWith(".")) continue;

    // Hide jobs and logos folders ALWAYS
    if (item.metadata === null) {
      if (item.name === "jobs" || item.name === "logos") continue;
      folders.push({ name: item.name, type: "folder" });
      continue;
    }

    files.push({
      name: item.name,
      type: "file",
      path: prefix + item.name,
    });
  }

  folders.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));

  return { folders, files };
}
