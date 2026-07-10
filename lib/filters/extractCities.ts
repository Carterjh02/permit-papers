import { normalizeCityName } from "./normalizeCity";
import type { FolderNode } from "@/app/components/FolderTree";

function capitalizeWords(name: string): string {
  return name.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Extract the city name from a filename.
 * Filenames follow the pattern:
 *   CityName + FormType.pdf
 */
function extractCityFromFilename(filename: string): string {
  const noExt = filename.replace(/\.[^/.]+$/, "");
  const words = noExt.split(/\s+/);

  if (words.length <= 2) return "";

  const cityWords = words.slice(0, -2);
  const rawCity = cityWords.join(" ").trim();

  return normalizeCityName(rawCity);
}

/**
 * Extract all cities inside a selected county.
 *
 * IMPORTANT:
 * This function is intentionally PURE.
 * It does NOT:
 * - filter by city
 * - filter out Notice of Commencement
 * - merge folders
 * - reorder folders
 *
 * It ONLY extracts city names from files inside the selected county.
 * All filtering logic will be handled by the new countyFilter + cityFilter pipeline.
 */
export function extractCitiesFromTree(
  tree: FolderNode,
  selectedCounty: string
): string[] {
  if (!selectedCounty) return [];

  const normalizedCounty = normalizeCityName(selectedCounty);
  const cities = new Set<string>();

  function walk(node: FolderNode) {
    const nodeNameNormalized = normalizeCityName(node.name);

    // We are inside the selected county folder
    if (nodeNameNormalized === normalizedCounty) {
      // Files directly under the county folder
      for (const file of node.files) {
        const city = extractCityFromFilename(file.name);

        if (city && !city.includes("notice")) {
          cities.add(city);
        }        
      }

      // Also scan subfolders inside the county folder
      for (const sub of node.folders) {
        for (const file of sub.files) {
          const city = extractCityFromFilename(file.name);
          if (city) cities.add(city);
        }
      }
    }

    // Continue walking children
    for (const child of node.folders) {
      walk(child);
    }
  }

  walk(tree);

  return Array.from(cities)
  .map(capitalizeWords)
  .sort();
}
