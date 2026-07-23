import { normalizeCityName } from "./normalizeCity";
import type { FolderNode } from "@/app/components/FolderTree";

const NOC_NORMALIZED = "notice of commencement";

/**
 * City match helper
 */
function fileMatchesCity(fileName: string, selectedCity: string): boolean {
  if (!selectedCity) return true;

  const normalizedCity = normalizeCityName(selectedCity);
  const normalizedFile = normalizeCityName(fileName);

  return normalizedFile.includes(normalizedCity);
}

/**
 * COUNTY FILTER
 * - Locks in selected county
 * - Always includes Notice Of Commencement
 * - Pins NOC to the top
 * - No city filtering here
 */
function countyFilter(
  root: FolderNode,
  selectedCounty: string
): { tree: FolderNode | null; expandedPaths: Set<string> } {
  const expandedPaths = new Set<string>();

  if (!selectedCounty) {
    if (root.fullPath) expandedPaths.add(root.fullPath);
    return { tree: root, expandedPaths };
  }

  const normalizedCounty = normalizeCityName(selectedCounty);

  const formTypeFolders: FolderNode[] = [];
  let nocFolder: FolderNode | null = null;

  for (const formTypeFolder of root.folders) {
    const countyChildren: FolderNode[] = [];

    for (const countyFolder of formTypeFolder.folders) {
      const countyNameNormalized = normalizeCityName(countyFolder.name);

      const isSelectedCounty = countyNameNormalized === normalizedCounty;
      const isNOC = normalizeCityName(countyFolder.name) === NOC_NORMALIZED;

      if (!isSelectedCounty && !isNOC) continue;

      if (isNOC) {
        nocFolder = countyFolder;
        if (countyFolder.fullPath) expandedPaths.add(countyFolder.fullPath);
      }

      countyChildren.push(countyFolder);

      if (countyFolder.fullPath) expandedPaths.add(countyFolder.fullPath);
    }

    if (countyChildren.length > 0) {
      formTypeFolders.push({
        ...formTypeFolder,
        folders: countyChildren,
      });

      if (formTypeFolder.fullPath) expandedPaths.add(formTypeFolder.fullPath);
    }
  }

  if (formTypeFolders.length === 0 && !nocFolder) {
    return { tree: null, expandedPaths };
  }

  const countyTree: FolderNode = {
    ...root,
    folders: formTypeFolders,
  };

  if (root.fullPath) expandedPaths.add(root.fullPath);

  return { tree: countyTree, expandedPaths };
}

/**
 * CITY FILTER
 * - Applies city filtering ONLY to non-NOC folders
 * - Does not touch NOC
 */
function cityFilter(
  root: FolderNode,
  selectedCounty: string,
  selectedCity: string
): { tree: FolderNode | null; expandedPaths: Set<string> } {
  const expandedPaths = new Set<string>();

  if (!selectedCity || !selectedCounty) {
    if (root.fullPath) expandedPaths.add(root.fullPath);
    return { tree: null, expandedPaths };
  }

  function walk(node: FolderNode, depth: number): FolderNode | null {
    const matchingFiles = [];
    const matchingFolders = [];

    const nodeNameNormalized = normalizeCityName(node.name);

    console.log("CITY FILTER NODE:", {
      name: node.name,
      normalized: nodeNameNormalized,
      depth,
      fullPath: node.fullPath
    });

    const isNOC = nodeNameNormalized === NOC_NORMALIZED;

    const countyMatches = true;

    for (const file of node.files) {
      if (isNOC) continue;

      const matchesCity = fileMatchesCity(file.name, selectedCity);

      if (countyMatches && matchesCity) {
        matchingFiles.push(file);
      }
    }

    for (const folder of node.folders) {
      const child = walk(folder, depth + 1);
      if (child) matchingFolders.push(child);
    }

    if (selectedCity) {
      const hasCityMatches = 
        matchingFiles.length > 0 ||
        matchingFolders.length > 0;

        if (!hasCityMatches) return null;
    }

    const hasMatches =
      matchingFiles.length > 0 || matchingFolders.length > 0;

    if (!hasMatches) return null;

    if (node.fullPath) expandedPaths.add(node.fullPath);

    return {
      ...node,
      files: matchingFiles,
      folders: matchingFolders,
    };
  }

  const filtered = walk(root, 0);

  return { tree: filtered, expandedPaths };
}

/**
 * MERGE TREES
 * - Combines countyTree + cityTree
 * - Pins NOC to the top inside each county
 * - Merges expandedPaths
 */
function mergeTrees(
  countyResult: { tree: FolderNode | null; expandedPaths: Set<string> },
  cityResult: { tree: FolderNode | null; expandedPaths: Set<string> },
): { mergedTree: FolderNode | null; expandedPaths: Set<string> } {
  const { tree: countyTree, expandedPaths: countyPaths } = countyResult;
  const { tree: cityTree, expandedPaths: cityPaths } = cityResult;

  const mergedPaths = new Set<string>([
    ...countyPaths,
    ...cityPaths,
  ]);

  if (!countyTree && !cityTree) {
    return { mergedTree: null, expandedPaths: mergedPaths };
  }

  if (countyTree && !cityTree) {
    // Detect whether city filtering is active:
    // - If expandedPaths is empty → no city filter (initial load)
    // - If expandedPaths has entries → city filter active but no matches
    const cityFilterActive = cityPaths.size > 0;
  
    if (!cityFilterActive) {
      // Initial load → show ALL form types (NOC, Roofing, Window-Door)
      return { mergedTree: countyTree, expandedPaths: mergedPaths };
    }
  
    // City filter active but no matches → keep ONLY NOC
    const nocOnly = countyTree.folders.filter(
      (f) => normalizeCityName(f.name) === NOC_NORMALIZED
    );
  
    return {
      mergedTree: { ...countyTree, folders: nocOnly },
      expandedPaths: mergedPaths,
    };
  }

  if (!countyTree && cityTree) {
    return { mergedTree: cityTree, expandedPaths: mergedPaths };
  }

  const mergedRoot: FolderNode = {
    ...countyTree!,
    folders: mergeFormTypes(countyTree!, cityTree!),
  };

  return { mergedTree: mergedRoot, expandedPaths: mergedPaths };
}

/**
 * Merge formType level folders from countyTree + cityTree
 */
function mergeFormTypes(
  countyTree: FolderNode,
  cityTree: FolderNode,
): FolderNode[] {
  const result: FolderNode[] = [];

  const byName = new Map<string, { county?: FolderNode; city?: FolderNode }>();

  for (const f of countyTree.folders) {
    byName.set(f.name, { county: f, city: undefined });
  }

  for (const f of cityTree.folders) {
    const existing = byName.get(f.name);
    if (existing) {
      existing.city = f;
    } else {
      byName.set(f.name, { city: f });
    }
  }

  for (const pair of byName.values() as Iterable<{
    county?: FolderNode;
    city?: FolderNode;
  }>) {
    const countyFormType = pair.county;
    const cityFormType = pair.city;
  
    if (countyFormType && cityFormType) {
      result.push({
        ...countyFormType,
        folders: mergeCounties(countyFormType, cityFormType),
      });
    } else if (countyFormType) {
      // Keep NOC even if it has no city matches; drop other form types
      const isNOCFormType =
        normalizeCityName(countyFormType.name) === NOC_NORMALIZED;
  
      if (isNOCFormType) {
        result.push(countyFormType);
      } else {
        continue;
      }
    } else if (cityFormType) {
      result.push(cityFormType);
    }
  }

  // ALWAYS pin NOC globally
  result.sort((a, b) => {
    const aIsNOC = normalizeCityName(a.name) === NOC_NORMALIZED;
    const bIsNOC = normalizeCityName(b.name) === NOC_NORMALIZED;

    if (aIsNOC && !bIsNOC) return -1;
    if (!aIsNOC && bIsNOC) return 1;

    return a.name.localeCompare(b.name);
  });

  return result;
}

/**
 * Merge county-level folders inside a formType
 * - Pins NOC to the top
 * - Merges children when both sides exist
 */
function mergeCounties(
  countyFormType: FolderNode,
  cityFormType: FolderNode,
): FolderNode[] {
  const byName = new Map<string, { county?: FolderNode; city?: FolderNode }>();

  for (const c of countyFormType.folders) {
    byName.set(c.name, { county: c, city: undefined });
  }

  for (const c of cityFormType.folders) {
    const existing = byName.get(c.name);
    if (existing) {
      existing.city = c;
    } else {
      byName.set(c.name, { city: c });
    }
  }

  const nocFolders: FolderNode[] = [];
  const otherFolders: FolderNode[] = [];

  for (const pair of byName.values() as Iterable<{
    county?: FolderNode;
    city?: FolderNode;
  }>) {
    const countyFolder = pair.county;
    const cityFolder = pair.city;
    let merged: FolderNode;

    console.log("MERGE COUNTIES PAIR:", {
      county: countyFolder?.name,
      city: cityFolder?.name,
    });

    if (countyFolder && cityFolder) {
      merged = {
        ...countyFolder,
        // City filter controls files; no fallback to county files
        files: cityFolder.files,
        folders: cityFolder.folders.length
          ? cityFolder.folders
          : countyFolder.folders,
      };
    } else if (cityFolder) {
      merged = cityFolder;
    } else if (countyFolder) {
        continue;
    } else {
      continue;
    }

    const isNOC = normalizeCityName(merged.name) === NOC_NORMALIZED;
    if (isNOC) {
      nocFolders.push(merged);
    } else {
      otherFolders.push(merged);
    }
  }

  otherFolders.sort((a, b) => a.name.localeCompare(b.name));
  return [...nocFolders, ...otherFolders];
}

/**
 * Orchestrator: public API
 * - Returns mergedTree + expandedPaths
 */
export function filterTree(
  root: FolderNode,
  selectedCounty: string,
  selectedCity: string
): { mergedTree: FolderNode | null; expandedPaths: Set<string> } {
  const countyResult = countyFilter(root, selectedCounty);
  const cityResult = cityFilter(root, selectedCounty, selectedCity);

  return mergeTrees(countyResult, cityResult);
}
