import { FolderNode, SupabaseFile } from "@/app/components/FolderTree";

/**
 * Toggle a file in the selected list.
 */
export function toggleFileSelection(
  selected: SupabaseFile[],
  file: SupabaseFile
): SupabaseFile[] {
  const exists = selected.some((f) => f.path === file.path);
  return exists
    ? selected.filter((f) => f.path !== file.path)
    : [...selected, file];
}

/**
 * Clear all selected files.
 */
export function clearSelection(): SupabaseFile[] {
  return [];
}

/**
 * Sort selected files in tree order.
 */
export function sortSelectedFilesInTreeOrder(
  selected: SupabaseFile[] | undefined,
  tree: FolderNode
): SupabaseFile[] {
  if (!selected || selected.length === 0) return [];

  const order: string[] = [];

  function walk(node: FolderNode) {
    for (const file of node.files) {
      order.push(file.path);
    }
    for (const child of node.folders) {
      walk(child);
    }
  }

  walk(tree);

  return selected
  .filter((f) => order.includes(f.path)) // only sort files belonging to this tree
  .sort((a, b) => order.indexOf(a.path) - order.indexOf(b.path));
}

/**
 * Build a "Selected Files" section at the top of the tree.
 */
export function buildSelectedFilesSection(
  selected: SupabaseFile[]
): FolderNode {
  return {
    name: "Selected Files",
    fullPath: "__selected__",
    folders: [],
    files: [...selected],
  };
}
