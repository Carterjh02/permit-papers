"use client";

import { useState, useMemo } from "react";
import {
  FolderIcon,
  DocumentIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/solid";

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
  deleteTemplateAction?: (formData: FormData) => Promise<void>;
  onSelectFile?: (file: SupabaseFile) => void;
  onSelectFolder?: (path: string) => void;
}

export default function FolderTree({
  root,
  variant,
  deleteTemplateAction,
  onSelectFile,
  onSelectFolder,
}: FolderTreeProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const term = search.trim().toLowerCase();

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
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(sortNode);

      const sortedFiles = [...node.files].sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      return { ...node, folders: sortedFolders, files: sortedFiles };
    };

    let filtered: FolderNode = root;

    if (term) {
      const result = filterNode(root);
      filtered = result ?? { ...root, folders: [], files: [] };
    }

    return sortNode(filtered);
  }, [root, term]);

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
    return expanded.has(path);
  };

  return (
    <div className="space-y-4">
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

      <div
        className={
          variant === "admin"
            ? "border rounded-lg p-4 bg-white"
            : "border rounded-lg p-3 bg-white"
        }
      >
        <FolderNodeView
          node={displayRoot}
          variant={variant}
          isOpen={isOpen}
          toggle={toggle}
          deleteTemplateAction={deleteTemplateAction}
          onSelectFile={onSelectFile}
          onSelectFolder={onSelectFolder}
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
  onSelectFile,
  onSelectFolder,
}: {
  node: FolderNode;
  variant: Variant;
  isOpen: (path: string) => boolean;
  toggle: (path: string) => void;
  deleteTemplateAction?: (formData: FormData) => Promise<void>;
  onSelectFile?: (file: SupabaseFile) => void;
  onSelectFolder?: (path: string) => void;
}) {
  const path = node.fullPath;
  const open = isOpen(path);

  return (
    <div className="space-y-2">
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
      </div>

      {open ? (
        <div className="ml-6 space-y-3">
          {node.files.length > 0 && (
            <ul className="space-y-1">
              {node.files.map((f) => (
                <li key={f.path}>
                  <button
                    onClick={() => onSelectFile?.(f)}
                    className="flex items-center gap-2 w-full text-left px-2 py-1 rounded hover:bg-gray-100"
                  >
                    <DocumentIcon className="w-4 h-4 text-blue-500" />
                    {f.name}
                  </button>
                </li>
              ))}
            </ul>
          )}

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
                  onSelectFile={onSelectFile}
                  onSelectFolder={onSelectFolder}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
