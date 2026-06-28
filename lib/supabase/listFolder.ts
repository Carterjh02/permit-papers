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

export async function listFolder(path: string): Promise<FolderListing> {
  const clean = path.replace(/\/$/, "").replace(/\/+/g, "/");
  const prefix = clean === "" ? "" : clean + "/";

  const { data, error } = await supabaseClient.storage
    .from("templates")
    .list(prefix, {
      limit: 1000,
      offset: 0,
    });

  if (error) {
    console.error("Supabase list error:", error);
    throw new Error("Failed to list folder");
  }

  const folders: FolderItem[] = [];
  const files: FileItem[] = [];

  for (const item of data || []) {
    if (item.name === ".keep") continue;

    if (item.metadata === null) {
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
