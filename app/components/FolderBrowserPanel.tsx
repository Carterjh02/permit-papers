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
  onClose: () => void;
  onUploadComplete?: (path: string) => void;

  // MULTI-FILE SELECTION
  onSelectFile: (paths: string[]) => void;
}

/* -----------------------------------------------------------
     BuildTree
----------------------------------------------------------- */
async function buildTree(path: string): Promise<FolderNode> {
  const clean = path.replace(/\/+$/, "");

  const { folders, files } = await listFolder(clean);

  const visibleFolders = folders.filter((f) => !f.name.startsWith("."));
  const visibleFiles = files.filter((f) => !f.name.startsWith("."));

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

export default function FolderBrowserPanel({
  mode,
  initialPath = "",
  onClose,
  onSelectFile,
  onUploadComplete,
}: FolderBrowserPanelProps) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [tree, setTree] = useState<FolderNode | null>(null);

  /* -----------------------------------------------------------
     FILTER STATE 
  ----------------------------------------------------------- */
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");

  const [counties, setCounties] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [filteredTree, setFilteredTree] = useState<FolderNode | null>(null);
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
      const clean = currentPath.replace(/\/+$/, "");
      const parts = clean ? clean.split("/").filter(Boolean) : [];
      setBreadcrumbs(parts);

      const root = await buildTree(clean);
      setTree(root);

      /* -----------------------------------------------------------
         FIXED — use helper extractCountiesFromTree
      ----------------------------------------------------------- */
      const detectedCounties = extractCountiesFromTree(root);
      setCounties(detectedCounties);

      /* -----------------------------------------------------------
         use helper extractCitiesFromTree
      ----------------------------------------------------------- */
      if (selectedCounty) {
      const detectedCities = extractCitiesFromTree(root, selectedCounty);
       setCities(detectedCities);
      }   

      /* -----------------------------------------------------------
         FilterTree destructuring
      ----------------------------------------------------------- */
      // Always reapply filters after tree rebuild
      const { mergedTree, expandedPaths } = filterTree(
        root,
        selectedCounty,
        selectedCity
      );

      expandedPaths.add("");
      
      setFilteredTree(mergedTree);
      setExpandedPaths(expandedPaths);         
    } catch (err) {
      console.error("Folder load error:", err);
    }

    setLoading(false);
  }, [currentPath, selectedCounty, selectedCity]);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

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
    if (mode !== "master") return;

    const base = currentPath.replace(/\/+$/, "");
    const fullPath = (base ? `${base}/${file.name}` : file.name).replace(
      /\\/g,
      "/"
    );

    const { error } = await supabaseClient.storage
      .from("templates")
      .upload(fullPath, file);

    if (error) {
      console.error("Upload error:", error);
      return;
    }

    if (onUploadComplete) onUploadComplete(fullPath);

    // RULE #14 — DO NOT auto-select uploaded files
    // (removed toggleFileSelection)

    await load();
  };

  /* -----------------------------------------------------------
     FILTER HANDLERS
  ----------------------------------------------------------- */
  const handleCountyChange = (county: string) => {
    setSelectedCounty(county);
    setSelectedCity("");
  
    if (tree) {
      const detectedCities = extractCitiesFromTree(tree, county);
      setCities(detectedCities);
  
      const { mergedTree, expandedPaths } = filterTree(tree, county, "");
      setFilteredTree(mergedTree);
      setExpandedPaths(expandedPaths);
    }
  };  

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
  
    setTimeout(() => {
      if (tree) {
        const { mergedTree, expandedPaths } = filterTree(
          tree,
          selectedCounty,
          city
        );
        setFilteredTree(mergedTree);
        setExpandedPaths(expandedPaths);
    }
    }, 0);
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="pointer-events-auto bg-white shadow-xl rounded-lg border border-gray-200 w-[75vw] h-[80vh] max-w-[1400px] flex flex-col resize overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="font-semibold text-lg">Select Template</div>

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
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-4">
          {/* COUNTY */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600">County</label>
            <select
              value={selectedCounty}
              onChange={(e) => handleCountyChange(e.target.value)}
              className="select select-bordered w-64"
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
            <label className="text-sm font-medium text-gray-600">City</label>
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="select select-bordered w-64"
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
                setFilteredTree(tree);        // restore full tree
                setExpandedPaths(new Set([""])); // keep root expanded
              }
            }}
          className="btn btn-outline btn-sm"
            >
            Clear Filter
          </button>
        </div>

        {/* BREADCRUMBS */}
        <div className="px-4 py-2 border-b border-gray-100 text-sm flex flex-wrap gap-1">
          <button
            onClick={() => setCurrentPath("")}
            className="text-blue-600 hover:underline"
          >
            Templates
          </button>

          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center">
              <span className="mx-1 text-gray-400">/</span>

              <button
                onClick={() => {
                  const newPath = breadcrumbs
                    .slice(0, i + 1)
                    .join("/")
                    .replace(/\/+$/, "");
                  setCurrentPath(newPath);
                }}
                className="text-blue-600 hover:underline"
              >
                {crumb}
              </button>
            </span>
          ))}
        </div>

        {/* TREE */}
          <div className="p-4 overflow-y-auto flex-1">
            {loading || !filteredTree ? (
          <div className="text-center text-gray-500 py-10">Loading…</div>
        ) : (
          <FolderTree
            root={filteredTree}
            variant="popup"
            expandedPaths={expandedPaths}
            selectedFiles={selectedFiles}
            onToggleFile={toggleFileSelection}
            onSelectFolder={(path: string) => {
            setCurrentPath(path);
            }}
          />
        )}
      </div>

      {/* CONFIRM SELECTION */}
        {selectedFiles.length > 0 && (
          <div className="border-t border-gray-200 p-4 flex justify-end bg-gray-50">
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
