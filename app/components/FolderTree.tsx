"use client";

import { useState, useMemo, useEffect } from "react";
import {
  FolderIcon,
  DocumentIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CheckIcon,
} from "@heroicons/react/24/solid";

import {
  sortSelectedFilesInTreeOrder,
  buildSelectedFilesSection,
} from "@/lib/helpers/selection";

export interface SupabaseFile {
  name: string;
  path: string;
}

export interface FolderNode {
  name: string;
  fullPath: string;
  folders: FolderNode[];
  files: SupabaseFile[];
}

type Variant = "admin" | "popup";

interface FolderTreeProps {
  root: FolderNode;
  variant: Variant;
  expandedPaths?: Set<string>;

  // Selection is optional now
  selectedFiles?: SupabaseFile[];
  onToggleFile?: (file: SupabaseFile) => void;
  disableSelection?: boolean;

  deleteTemplateAction?: (formData: FormData) => Promise<void>;
  onSelectFolder?: (path: string) => void;
}

export default function FolderTree({
  root,
  variant,
  expandedPaths,
  selectedFiles,
  onToggleFile,
  disableSelection,
  deleteTemplateAction,
  onSelectFolder,
}: FolderTreeProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const term = search.trim().toLowerCase();

  /* -----------------------------------------------------------
     Sync external expandedPaths into internal state
     ----------------------------------------------------------- */
  useEffect(() => {
    if (expandedPaths && expandedPaths.size > 0) {
      Promise.resolve().then(() => {
        setExpanded(new Set(expandedPaths));
      });
    }
  }, [expandedPaths]);

  /* -----------------------------------------------------------
     FILTER + SORT (existing logic preserved)
     ----------------------------------------------------------- */
  const displayRoot = useMemo(() => {
    const filterNode = (node: FolderNode): FolderNode | null => {
      if (!term) return node;

      const nameMatches = node.name.toLowerCase().includes(term);

      const matchedFiles = node.files.filter((f) =>
        f.name.toLowerCase().includes(term)
      );

      const matchedFolders: FolderNode[] = [];
      for (const child of node.folders) {
        const filtered = filterNode(child);
        if (filtered) matchedFolders.push(filtered);
      }

      const hasMatch =
        nameMatches ||
        matchedFiles.length > 0 ||
        matchedFolders.length > 0;

      if (!hasMatch) return null;

      return {
        ...node,
        folders: matchedFolders,
        files: matchedFiles,
      };
    };

    const sortNode = (node: FolderNode): FolderNode => {
      const sortedFolders = [...node.folders]
        .sort((a, b) => {
          const aIsNOC = a.name.toLowerCase() === "notice of commencement";
          const bIsNOC = b.name.toLowerCase() === "notice of commencement";

          if (aIsNOC && !bIsNOC) return -1;
          if (!aIsNOC && bIsNOC) return 1;

          return a.name.localeCompare(b.name);
        })
        .map(sortNode);

      const sortedFiles = [...node.files].sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      return {
        ...node,
        folders: sortedFolders,
        files: sortedFiles,
      };
    };

    let filtered: FolderNode = root;

    if (term) {
      const result = filterNode(root);
      filtered = result ?? { ...root, folders: [], files: [] };
    }

    return sortNode(filtered);
  }, [root, term]);

  /* -----------------------------------------------------------
     EXPANSION LOGIC
     ----------------------------------------------------------- */
  const toggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    const walk = (n: FolderNode) => {
      all.add(n.fullPath);
      n.folders.forEach(walk);
    };
    walk(root);
    setExpanded(all);
  };

  const collapseAll = () => setExpanded(new Set());

  const isOpen = (path: string) => {
    if (term) return true;
    if (expandedPaths && expandedPaths.has(path)) return true;
    return expanded.has(path);
  };

  /* -----------------------------------------------------------
     SELECTED FILES SECTION (disabled in admin mode)
     ----------------------------------------------------------- */
  const selectionEnabled =
    !disableSelection && selectedFiles && onToggleFile;

  const selectedSection = selectionEnabled
    ? buildSelectedFilesSection(
        sortSelectedFilesInTreeOrder(selectedFiles!, root)
      )
    : null;

  const treeWithSelected: FolderNode = {
    ...displayRoot,
    folders: selectedSection
      ? [selectedSection, ...displayRoot.folders]
      : displayRoot.folders,
  };

  return (
    <div className="space-y-4">
      {/* SEARCH BAR */}
      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search folders and files…"
          className="input input-bordered w-64"
        />
        <button onClick={collapseAll} className="btn btn-outline btn-sm">
          Collapse All
        </button>
        <button onClick={expandAll} className="btn btn-outline btn-sm">
          Expand All
        </button>
      </div>

      {/* TREE */}
      <div
        className={
          variant === "admin"
            ? "border rounded-lg p-4 bg-white"
            : "border rounded-lg p-3 bg-white"
        }
      >
        <FolderNodeView
          node={treeWithSelected}
          variant={variant}
          isOpen={isOpen}
          toggle={toggle}
          deleteTemplateAction={deleteTemplateAction}
          onToggleFile={onToggleFile}
          selectedFiles={selectedFiles}
          onSelectFolder={onSelectFolder}
          disableSelection={disableSelection}
        />
      </div>
    </div>
  );
}

function FolderNodeView({
  node,
  variant,
  isOpen,
  toggle,
  deleteTemplateAction,
  onToggleFile,
  selectedFiles,
  onSelectFolder,
  disableSelection,
}: {
  node: FolderNode;
  variant: Variant;
  isOpen: (path: string) => boolean;
  toggle: (path: string) => void;
  deleteTemplateAction?: (formData: FormData) => Promise<void>;
  onToggleFile?: (file: SupabaseFile) => void;
  selectedFiles?: SupabaseFile[];
  onSelectFolder?: (path: string) => void;
  disableSelection?: boolean;
}) {
  const path = node.fullPath;
  const open = isOpen(path);

  const selectionEnabled =
    !disableSelection && selectedFiles && onToggleFile;

  const isSelected = (file: SupabaseFile) =>
    selectionEnabled
      ? selectedFiles!.some((f) => f.path === file.path)
      : false;

  return (
    <div className="space-y-2">
      {/* Folder Header */}
      {node.fullPath !== "__selected__" && (
        <div className="flex items-center gap-2 w-full px-2 py-1 rounded hover:bg-gray-50">
          {/* Expand / collapse */}
          <button type="button" onClick={() => toggle(path)} className="p-1">
            {open ? (
              <ChevronDownIcon className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {/* Navigate into folder */}
          <button
            type="button"
            onClick={() => onSelectFolder?.(path)}
            className="flex items-center gap-2 flex-1 text-left"
          >
            <FolderIcon className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold">{node.name}</span>
          </button>

          {/* Admin delete button */}
          {variant === "admin" && deleteTemplateAction && (
            <form
              action={deleteTemplateAction}
              onClick={(e) => e.stopPropagation()}
            >
              <input type="hidden" name="path" value={node.fullPath} />
              <button
                type="submit"
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete
              </button>
            </form>
          )}
        </div>
      )}

      {/* Folder Contents */}
      {open && (
        <div className="ml-6 space-y-3">
          {/* Files */}
          {node.files.length > 0 && (
            <ul className="space-y-1">
              {node.files.map((f) => {
                const selected = isSelected(f);

                return (
                  <li key={f.path}>
                    <button
                      onClick={() =>
                        selectionEnabled && onToggleFile?.(f)
                      }
                      className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded hover:bg-gray-100 ${
                        selected
                          ? "bg-blue-50 border-l-4 border-blue-600"
                          : ""
                      }`}
                    >
                      {/* Checkbox */}
                      {selectionEnabled && (
                        <div
                          className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
                            selected
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-400"
                          }`}
                        >
                          {selected && (
                            <CheckIcon className="w-3 h-3 text-white" />
                          )}
                        </div>
                      )}

                      {/* File Icon */}
                      <DocumentIcon className="w-4 h-4 text-blue-500" />

                      {/* File Name */}
                      <span className="truncate">{f.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Child Folders */}
          {node.folders.length > 0 && (
            <div className="space-y-2">
              {node.folders.map((child) => (
                <FolderNodeView
                  key={child.fullPath}
                  node={child}
                  variant={variant}
                  isOpen={isOpen}
                  toggle={toggle}
                  deleteTemplateAction={deleteTemplateAction}
                  onToggleFile={onToggleFile}
                  selectedFiles={selectedFiles}
                  onSelectFolder={onSelectFolder}
                  disableSelection={disableSelection}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
