import { supabaseClient } from "@/lib/supabaseClient";
import { listCompanyFolder } from "@/lib/supabase/listCompanyFolder";
import { FolderNode, SupabaseFile } from "@/app/components/FolderTree";

/**
 * Build a FolderNode tree for the companies bucket.
 *
 * MASTER MODE:
 *   - Lists all companies under /companies
 *   - Each company folder contains its /documents folder
 *
 * ADMIN/USER MODE:
 *   - Shows only activeCompanyCode
 *   - Rooted at: companies/<code>/documents
 */
export async function buildCompanyTree(
  path: string,
  role: "master" | "admin" | "user",
  activeCompanyCode: string | null
): Promise<FolderNode> {

  /** ---------------------------------------------------------
   * MASTER MODE — load ALL companies
   * --------------------------------------------------------- */
  if (role === "master") {
    const { data: folders, error } = await supabaseClient.storage
      .from("companies")
      .list("", { limit: 200 });

    if (error) {
      console.error("Supabase list companies error:", error);
      return {
        name: "Companies",
        fullPath: "companies",
        folders: [],
        files: [],
      };
    }

    const companyFolders = folders.filter((f) => !f.name.startsWith("."));

    const children = await Promise.all(
      companyFolders.map(async (folder) => {
        const docsStoragePath = `${folder.name}/documents`;          // storage
        const docsUiPath = `companies/${folder.name}/documents`;     // UI
        
        const { folders: docFolders, files: docFiles } =
          await listCompanyFolder(docsStoragePath);
        
        const visibleFiles: SupabaseFile[] = docFiles
          .filter((f) => !f.name.startsWith("."))
          .map((f) => ({
            name: f.name,
            path: `${docsUiPath}/${f.name}`,                         // UI path
          }));
        
        const visibleFolders = docFolders.filter(
          (f) => !f.name.startsWith(".")
        );
        
        const nestedChildren = await Promise.all(
          visibleFolders.map(async (f) =>
            buildCompanyTree(`${docsStoragePath}/${f.name}`, role, activeCompanyCode)
          )
        );
        
        return {
          name: folder.name,
          fullPath: docsUiPath,                                      // UI path
          folders: nestedChildren,
          files: visibleFiles,
        };
      })
    );

    return {
      name: "Companies",
      fullPath: "companies",  
      folders: children,
      files: [],
    };
  }

  /** ---------------------------------------------------------
   * ADMIN / USER MODE — require activeCompanyCode
   * --------------------------------------------------------- */
  if (!activeCompanyCode) {
    throw new Error("Active company code required for admin/user.");
  }

  const effectiveStoragePath = `${activeCompanyCode}/documents`;          // storage
  const effectiveUiPath = `companies/${activeCompanyCode}/documents`;     // UI
  
  const { folders, files } = await listCompanyFolder(effectiveStoragePath);
  
  const visibleFiles: SupabaseFile[] = files
    .filter((f) => !f.name.startsWith("."))
    .map((f) => ({
      name: f.name,
      path: `${effectiveUiPath}/${f.name}`,                               // UI path
    }));
  
  const visibleFolders = folders.filter((f) => !f.name.startsWith("."));
  
  const children = await Promise.all(
    visibleFolders.map((f) =>
      buildCompanyTree(`${effectiveStoragePath}/${f.name}`, role, activeCompanyCode)
    )
  );
  
  return {
    name: "Company Documents",
    fullPath: effectiveUiPath,                                            // UI path
    folders: children,
    files: visibleFiles,
  };
}

/**
 * Convenience wrapper for building the root company tree.
 */
export async function buildCompanyRootTree(
  role: "master" | "admin" | "user",
  activeCompanyCode: string | null
): Promise<FolderNode> {
  if (role === "master") {
    return buildCompanyTree("companies", role, activeCompanyCode);   // UI root
  }

  if (!activeCompanyCode) {
    throw new Error("Active company code required for admin/user.");
  }

  return buildCompanyTree(
    `companies/${activeCompanyCode}/documents`,                      // UI path
    role,
    activeCompanyCode
  );
}
