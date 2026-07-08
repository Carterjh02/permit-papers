"use client";

import { useEffect, useState, useCallback } from "react";
import { listFolder } from "@/lib/supabase/listFolder";
import { supabaseClient } from "@/lib/supabaseClient";
import FolderTree, { FolderNode } from "@/app/components/FolderTree";

interface FolderBrowserPanelProps {
  mode: "job" | "master";
  initialPath?: string;
  onClose: () => void;
  onUploadComplete?: (path: string) => void;
  onSelectFile: (path: string) => void;
}

/* -----------------------------------------------------------
   BUILD TREE DIRECTLY FROM BUCKET STRUCTURE
----------------------------------------------------------- */
async function buildTree(path: string): Promise<FolderNode> {
  const clean = path.replace(/\/+$/, ""); // normalize

  // read exactly from this path inside the bucket
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
    fullPath: clean, // this is the real path inside the bucket
    folders: children,
    files: visibleFiles,
  };
}

export default function FolderBrowserPanel({
  mode,
  initialPath = "", // ⭐ start at bucket root
  onClose,
  onSelectFile,
  onUploadComplete,
}: FolderBrowserPanelProps) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tree, setTree] = useState<FolderNode | null>(null);

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
    } catch (err) {
      console.error("Folder load error:", err);
    }

    setLoading(false);
  }, [currentPath]);

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
     MASTER MODE — CREATE FOLDER
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

    // return the real path inside the bucket
    onSelectFile(fullPath);
    await load();
  };

  /* -----------------------------------------------------------
     RENDER
  ----------------------------------------------------------- */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="
          pointer-events-auto bg-white shadow-xl rounded-lg border border-gray-200
          w-[75vw] h-[80vh] max-w-[1400px]
          flex flex-col resize overflow-hidden
        "
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="font-semibold text-lg">Select Template</div>

          <div className="flex items-center gap-3">
            {mode === "master" && (
              <>
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

                <button
                  onClick={() => {
                    const name = prompt("Folder name?");
                    if (name) createFolder(name);
                  }}
                  className="text-blue-600 hover:underline"
                >
                  New Folder
                </button>

                <button
                  onClick={load}
                  className="text-blue-600 hover:underline"
                >
                  Refresh
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
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
          {loading || !tree ? (
            <div className="text-center text-gray-500 py-10">Loading…</div>
          ) : (
            <FolderTree
              root={tree}
              variant="popup"
              onSelectFolder={(path) => {
                setCurrentPath(path);
              }}
              onSelectFile={(file) => {
                // send the exact path inside the bucket
                onSelectFile(file.path.replace(/\\/g, "/"));
                onClose();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
