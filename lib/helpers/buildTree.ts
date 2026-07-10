import { listFolder } from "@/lib/supabase/listFolder";
import { FolderNode, SupabaseFile } from "@/app/components/FolderTree";

/**
 * Recursively builds a FolderNode tree from Supabase storage.
 * Pure logic — no React, no UI.
 */
export async function buildTree(path: string): Promise<FolderNode> {
  const clean = path.replace(/\/+$/, "");

  const { folders, files } = await listFolder(clean);

  // Hide dot-prefixed folders/files
  const visibleFolders = folders.filter((f) => !f.name.startsWith("."));
  const visibleFiles: SupabaseFile[] = files
    .filter((f) => !f.name.startsWith("."))
    .map((f) => ({
      name: f.name,
      path: clean ? `${clean}/${f.name}` : f.name,
    }));

  // Recursively build children
  const children = await Promise.all(
    visibleFolders.map((f) =>
      buildTree(clean ? `${clean}/${f.name}` : f.name)
    )
  );

  return {
    name: clean ? clean.split("/").pop()! : "Templates",
    fullPath: clean,
    folders: children,
    files: visibleFiles,
  };
}
/**
 * Utility: build the root tree from the bucket.
 * Useful for FolderBrowserPanel.
 */
export async function buildRootTree(): Promise<FolderNode> {
  return buildTree("");
}
