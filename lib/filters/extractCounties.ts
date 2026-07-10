import { normalizeCityName } from "./normalizeCity";
import type { FolderNode } from "@/app/components/FolderTree";

/**
 * Extract county folder names.
 *
 * Structure:
 * ROOT /
 *   <formType> /
 *     <county> /
 *       <files>
 *
 * This function is used by FolderBrowserPanel to populate the
 * county dropdown. It intentionally does NOT apply any filtering
 * logic — it simply enumerates all county folders.
 */
export function extractCountiesFromTree(tree: FolderNode): string[] {
  const counties = new Set<string>();

  // formType level
  for (const formTypeFolder of tree.folders) {
    // county level
    for (const countyFolder of formTypeFolder.folders) {
      const normalized = normalizeCityName(countyFolder.name);
      counties.add(normalized);
    }
  }

  // Capitalize each county name (Title Case)
  return Array.from(counties)
    .map((c) => c.replace(/\b\w/g, (ch) => ch.toUpperCase()))
    .sort();
}
