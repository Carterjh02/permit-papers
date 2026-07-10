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
 * Persist selection across navigation.
 * (Your rule #7: selection persists across breadcrumbs)
 */
export function persistSelection(
  selected: SupabaseFile[]
): SupabaseFile[] {
  return selected;
}

/**
 * Cross-county selection allowed.
 * (Your rule #8)
 */
export function allowCrossCountySelection(
  selected: SupabaseFile[]
): SupabaseFile[] {
  return selected;
}

/**
 * Sort selected files in tree order.
 * (Your rule #9)
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

  return selected.sort(
    (a, b) => order.indexOf(a.path) - order.indexOf(b.path)
  );
}

/**
 * Build a "Selected Files" section at the top of the tree.
 * (Your rule #11)
 */
export function buildSelectedFilesSection(
  selected: SupabaseFile[]
): FolderNode {
  return {
    name: "Selected Files",
    fullPath: "__selected__",
    folders: [],
    files: selected,
  };
}

/**
 * Uploaded files should NOT auto-select.
 * (Your rule #14)
 */
export function handleUploadSelection(
  selected: SupabaseFile[]
): SupabaseFile[] {
  return selected;
}
