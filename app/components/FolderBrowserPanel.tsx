"use client";

import { useEffect, useState, useCallback } from "react";
import { listFolder } from "@/lib/supabase/listFolder";
import { supabaseClient } from "@/lib/supabaseClient";

import FolderTree, { FolderNode, SupabaseFile } from "@/app/components/FolderTree";

import { extractCountiesFromTree } from "@/lib/filters/extractCounties";
import { extractCitiesFromTree } from "@/lib/filters/extractCities";
import { filterTree } from "@/lib/filters/filterTree";

interface FolderBrowserPanelProps {
  mode: "job" | "master";
  initialPath?: string;
  companyCode?: string;
  onClose: () => void;
  onUploadComplete?: (path: string) => void;

  // MULTI-FILE SELECTION
  onSelectFile: (paths: string[]) => void;

  defaultTree?: "templates" | "companies";
}

/* -----------------------------------------------------------
     BuildTree (bucket-aware)
----------------------------------------------------------- */
async function buildTree(bucket: "templates" | "companies", path: string): Promise<FolderNode> {
  const clean = path.replace(/\/+$/, "");

  const { folders, files } = await listFolder(bucket, clean);

  const visibleFolders = folders.filter((f) => !f.name.startsWith("."));
  const visibleFiles = files.filter((f) => !f.name.startsWith("."));

  const children = await Promise.all(
    visibleFolders.map((f) =>
      buildTree(bucket, clean ? `${clean}/${f.name}` : f.name)
    )
  );

  return {
    name: clean ? clean.split("/").pop()! : bucket === "templates" ? "Templates" : "Companies",
    fullPath: clean,
    folders: children,
    files: visibleFiles,
  };
}

export default function FolderBrowserPanel({
  mode,
  initialPath = "",
  companyCode,
  onClose,
  onSelectFile,
  onUploadComplete,
  defaultTree,
}: FolderBrowserPanelProps) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [activeTree, setActiveTree] = useState<"root" | "templates" | "companies">("root");
  const [loading, setLoading] = useState(true);

  const [tree, setTree] = useState<{ templates: FolderNode; companies: FolderNode } | null>(null);

  /* -----------------------------------------------------------
     FILTER STATE 
  ----------------------------------------------------------- */
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");

  const [counties, setCounties] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [filteredTree, setFilteredTree] = useState<{ templates: FolderNode; companies: FolderNode } | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  /* -----------------------------------------------------------
     MULTI-FILE SELECTION STATE 
  ----------------------------------------------------------- */
  const [selectedFiles, setSelectedFiles] = useState<SupabaseFile[]>([]);

  const toggleFileSelection = (file: SupabaseFile) => {
    setSelectedFiles((prev) => {
      const exists = prev.some((f) => f.path === file.path);
      if (exists) {
        return prev.filter((f) => f.path !== file.path);
      }
      return [...prev, file];
    });
  };

  /* -----------------------------------------------------------
     LOAD TREE
  ----------------------------------------------------------- */
  const load = useCallback(async () => {
    setLoading(true);

    try {
      // Build Templates root (bucket: templates)
      const templatesRoot = await buildTree("templates", "");
      
      // Build Companies root (bucket: companies)
      const companiesRoot = await buildTree("companies", companyCode ? `${companyCode}/documents` : "");
      
      // Store separately — NOT merged
      setTree({
        templates: templatesRoot,
        companies: companiesRoot,
      });
      
      // Counties + cities ONLY from Templates
      const detectedCounties = extractCountiesFromTree(templatesRoot);
      setCounties(detectedCounties);
      
      if (selectedCounty) {
        const detectedCities = extractCitiesFromTree(templatesRoot, selectedCounty);
        setCities(detectedCities);
      }
      
      // FILTERS APPLY ONLY TO TEMPLATES
      if (!selectedCounty && !selectedCity) {
        setFilteredTree({
          templates: templatesRoot,
          companies: companiesRoot,
        });

        const initial = new Set<string>();
        initial.add(templatesRoot.fullPath);   // usually ""
        initial.add(companiesRoot.fullPath);   // now "" for master, or "<companyCode>/documents" for user/admin
        setExpandedPaths(initial);
        setExpandedPaths(initial);
      } else {
        const { mergedTree: filteredTemplates, expandedPaths } = filterTree(
          templatesRoot,
          selectedCounty,
          selectedCity
        );
      
        setFilteredTree({
          templates: filteredTemplates ?? templatesRoot,
          companies: companiesRoot,
        });
      
        expandedPaths.add("templates");
        expandedPaths.add("companies");
        setExpandedPaths(expandedPaths);
      }      
    } catch (err) {
      console.error("Folder load error:", err);
    }

    setLoading(false);
  }, [selectedCounty, selectedCity, companyCode]);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);
  
  // Force initial tree selection (templates or companies)
  useEffect(() => {
    if (defaultTree) {
      setTimeout(() => {
        setActiveTree(defaultTree);
      }, 0);
    }
  }, [defaultTree]);

  /* -----------------------------------------------------------
     ESC CLOSE 
  ----------------------------------------------------------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  /* -----------------------------------------------------------
     MASTER MODE 
  ----------------------------------------------------------- */
  const createFolder = async (name: string) => {
    if (mode !== "master") return;

    const base = currentPath.replace(/\/+$/, "");
    const fullPath = (base ? `${base}/${name}` : name) + "/.keep";

    const { error } = await supabaseClient.storage
      .from("templates")
      .upload(fullPath, new Blob([""]));

    if (error) {
      console.error("Create folder error:", error);
      return;
    }

    await load();
  };

  /* -----------------------------------------------------------
  MASTER MODE — UPLOAD FILE
----------------------------------------------------------- */
const handleUpload = async (file: File) => {
 // Only masters can upload files
 if (mode !== "master") {
   console.warn("Upload blocked: only master users may upload files.");
   return;
 }

 const base = currentPath.replace(/\/+$/, "");
 const cleanName = file.name.replace(/\\/g, "/");

 /* -----------------------------------------
    TEMPLATES UPLOAD (master only)
 ----------------------------------------- */
 if (activeTree === "templates") {
   const fullPath = base ? `${base}/${cleanName}` : cleanName;

   // Use server upload route
   const formData = new FormData();
   formData.append("file", file);
   formData.append("bucket", "templates");
   formData.append("path", fullPath);

   const res = await fetch("/api/storage/upload", {
     method: "POST",
     body: formData,
   });

   const json = await res.json();

   if (!res.ok) {
     console.error("Upload error:", json.error);
     return;
   }

   onUploadComplete?.(fullPath);
   await load();
   return;
 }

 /* -----------------------------------------
    COMPANIES UPLOAD (master only)
 ----------------------------------------- */
 if (activeTree === "companies") {
  const fullPath = base ? `${base}/${cleanName}` : cleanName;

  // Use server upload route
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", "companies");
  formData.append("path", fullPath);

  // tell the server which company this doc belongs to
  if (companyCode) {
    formData.append("companyCode", companyCode);
  }

  const res = await fetch("/api/storage/upload", {
    method: "POST",
    body: formData,
  });

  const json = await res.json();

  if (!res.ok) {
    console.error("Upload error:", json.error);
    return;
  }

  onUploadComplete?.(fullPath);
  await load();
  return;
}
};

  /* -----------------------------------------------------------
     FILTER HANDLERS
  ----------------------------------------------------------- */
  const handleCountyChange = (county: string) => {
    setSelectedCounty(county);
    setSelectedCity("");
  
    if (tree) {
      const detectedCities = extractCitiesFromTree(tree.templates, county);
      setCities(detectedCities);
  
      const { mergedTree, expandedPaths } = filterTree(tree.templates, county, "");
      setFilteredTree({
        templates: mergedTree ?? tree.templates,
        companies: tree.companies,
      });
      setExpandedPaths(expandedPaths);
    }
  };  

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
  
    setTimeout(() => {
      if (tree) {
        const { mergedTree, expandedPaths } = filterTree(
          tree.templates,
          selectedCounty,
          city
        );
        setFilteredTree({
          templates: mergedTree ?? tree.templates,
          companies: tree.companies,
        });
        setExpandedPaths(expandedPaths);
    }
    }, 0);
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="pointer-events-auto bg-[var(--card-bg)] shadow-xl rounded-lg border border-[var(--border-color)] w-[75vw] h-[80vh] max-w-[1400px] flex flex-col resize overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--card-bg)]">
          <div className="font-semibold text-lg text-[var(--text-color)]">
            {mode === "master" ? "Select Item" : "Select Document"}
          </div>

          <div className="flex items-center gap-3">
            {mode === "master" && (
              <>
                {/* UPLOAD PDF */}
                <label className="cursor-pointer text-blue-600 hover:underline">
                  Upload PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                    }}
                  />
                </label>

                {/* NEW FOLDER */}
                <button
                  onClick={() => {
                    const name = prompt("Folder name?");
                    if (name) createFolder(name);
                  }}
                  className="text-blue-600 hover:underline"
                >
                  New Folder
                </button>

                {/* REFRESH */}
                <button onClick={load} className="text-blue-600 hover:underline">
                  Refresh
                </button>
              </>
            )}

            {/* CLOSE */}
            <button onClick={onClose} className="text-[var(--text-color)] opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center gap-4 bg-[var(--card-bg)]">
          {/* COUNTY */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-[var(--text-color)] opacity-80">County</label>
            <select
              value={selectedCounty}
              onChange={(e) => handleCountyChange(e.target.value)}
              className="select w-64 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
            >
              <option value="">All Counties</option>
              {counties.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* CITY */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-[var(--text-color)] opacity-80">City</label>
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="select w-64 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
              disabled={!selectedCounty}
            >
              <option value="">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
            {/* CLEAR FILTER */}
            <button
              onClick={() => {
                setSelectedCounty("");
                setSelectedCity("");

                 if (tree) {
                  setFilteredTree({
                    templates: tree.templates,
                    companies: tree.companies,
                  });
                  
                  setExpandedPaths(new Set(["templates", "companies"])) // expand current root
                }
              }}
              className="dashboard-btn-transparent text-sm"
            >
              Clear Filter
            </button>
        </div>

        {/* MASTER MODE — VIEW SWITCH */}
        {mode === "master" && (
          <div className="px-4 py-2 border-b border-[var(--border-color)] text-sm flex gap-4 bg-[var(--card-bg)]">
            <button
              onClick={() => setActiveTree("root")}
              className={`text-blue-600 hover:underline ${activeTree === "root" ? "font-semibold" : ""}`}
            >
              Root
            </button>

            <button
              onClick={() => setActiveTree("templates")}
              className={`text-blue-600 hover:underline ${activeTree === "templates" ? "font-semibold" : ""}`}
            >
              Templates
            </button>

            <button
              onClick={() => setActiveTree("companies")}
              className={`text-blue-600 hover:underline ${activeTree === "companies" ? "font-semibold" : ""}`}
            >
              Companies
            </button>
          </div>
        )}

        {/* TREE */}
        <div className="p-4 overflow-y-auto flex-1 space-y-8">
          {loading || !filteredTree ? (
            <div className="text-center text-[var(--text-color)] opacity-60 py-10">Loading…</div>
          ) : (
            <>
              {/* JOB MODE — always show both */}
              {mode === "job" && (
                <>
                  <div>
                    <h3 className="text-md font-semibold mb-2 text-[var(--text-color)]">Templates</h3>
                    <FolderTree
                      root={filteredTree.templates}
                      variant="popup"
                      mode={mode}
                      expandedPaths={expandedPaths}
                      selectedFiles={selectedFiles}
                      onToggleFile={toggleFileSelection}
                      onSelectFolder={() => {}}
                      currentPath={currentPath}
                    />
                  </div>

                  <div>
                    <h3 className="text-md font-semibold mb-2 text-[var(--text-color)]">Companies</h3>
                    <FolderTree
                      root={filteredTree.companies}
                      variant="popup"
                      mode={mode}
                      expandedPaths={expandedPaths}
                      selectedFiles={selectedFiles}
                      onToggleFile={toggleFileSelection}
                      onSelectFolder={() => {}}
                      currentPath={currentPath}
                    />
                  </div>
                </>
              )}

              {/* MASTER MODE — dual-tree switching */}
              {mode === "master" && (
                <>
                  {(activeTree === "root" || activeTree === "templates") && (
                    <div>
                      <h3 className="text-md font-semibold mb-2 text-[var(--text-color)]">Templates</h3>
                      <FolderTree
                        root={filteredTree.templates}
                        variant="popup"
                        mode={mode}
                        expandedPaths={expandedPaths}
                        selectedFiles={selectedFiles}
                        onToggleFile={toggleFileSelection}
                        onSelectFolder={(path) => {
                          setActiveTree("templates");
                          setCurrentPath(path);
                        }}
                        currentPath={currentPath}
                      />
                    </div>
                  )}

                  {(activeTree === "root" || activeTree === "companies") && (
                    <div>
                      <h3 className="text-md font-semibold mb-2 text-[var(--text-color)]">Companies</h3>
                      <FolderTree
                        root={filteredTree.companies}
                        variant="popup"
                        mode={mode}
                        expandedPaths={expandedPaths}
                        selectedFiles={selectedFiles}
                        onToggleFile={toggleFileSelection}
                        onSelectFolder={(path) => {
                          if (path && path !== filteredTree.companies.fullPath) {
                            setActiveTree("companies");
                            setCurrentPath(path);
                          }
                        }}
                        currentPath={currentPath}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

      {/* CONFIRM SELECTION */}
        {selectedFiles.length > 0 && (
          <div className="border-t border-[var(--border-color)] p-4 flex justify-end bg-[var(--card-bg)]">
            <button
              type="button"
              onClick={() => {
                const paths = selectedFiles.map((f) =>
                  f.path.replace(/\\/g, "/")
                );
                onSelectFile(paths);
                onClose();
              }}
              className="btn btn-primary"
            >
              Confirm Selection ({selectedFiles.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
 }
