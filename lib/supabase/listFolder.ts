import { supabaseClient } from "@/lib/supabaseClient";

export interface FolderItem {
  name: string;
  type: "folder";
}

export interface FileItem {
  name: string;
  type: "file";
  path: string;
}

export interface FolderListing {
  folders: FolderItem[];
  files: FileItem[];
}

/**
 * Unified folder listing for both templates and companies buckets.
 * - Templates bucket: behaves exactly as before.
 * - Companies bucket: folders may have metadata objects, so detection differs.
 */
export async function listFolder(
  bucket: "templates" | "companies",
  path: string
): Promise<FolderListing> {
  const clean = path.replace(/\/$/, "").replace(/\/+/g, "/");
  const prefix = clean === "" ? "" : clean + "/";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any[] = [];
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let error: any = null;
  
  if (bucket === "companies") {
    // SERVER-SIDE LISTING VIA API ROUTE
    const res = await fetch("/api/storage/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucket, path: clean }),
    });
  
    const json = await res.json();
  
    if (!res.ok) {
      console.error("Companies list API error:", json.error);
      throw new Error(`Failed to list companies folder: ${json.error}`);
    }
  
    data = json.items;
  } else {
    // CLIENT-SIDE LISTING FOR TEMPLATES
    const result = await supabaseClient.storage
      .from(bucket)
      .list(prefix, {
        limit: 1000,
        offset: 0,
      });
  
      data = result.data ?? [];
      error = result.error;
  
    if (error) {
      console.error(`Supabase list error (${bucket}):`, error);
      throw new Error(`Failed to list folder in ${bucket}`);
    }
  }
  
  // DEBUG
  console.log("LIST FOLDER DEBUG:", {
    bucket,
    path: clean,
    prefix,
    error,
    dataLength: data?.length ?? 0,
    rawData: data,
  });
  

  const folders: FolderItem[] = [];
  const files: FileItem[] = [];

  for (const item of data || []) {
    // Skip hidden dotfiles
    if (item.name.startsWith(".")) continue;

    // Companies-specific hidden folders
    if (bucket === "companies" && item.metadata === null) {
      if (item.name === "jobs" || item.name === "logos") continue;
    }

    // Companies bucket: folders may have metadata objects
    const isFolder =
      bucket === "companies"
        ? !item.name.includes(".") // no dot = folder
        : item.metadata === null;  // templates bucket logic

    if (isFolder) {
      folders.push({ name: item.name, type: "folder" });
      continue;
    }

    files.push({
      name: item.name,
      type: "file",
      path: prefix + item.name,
    });
  } // ← THIS was the missing brace

  folders.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));

  return { folders, files };
}
