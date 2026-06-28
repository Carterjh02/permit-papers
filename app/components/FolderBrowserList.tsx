"use client";

import { useState } from "react";

interface FolderBrowserListProps {
  mode: "job" | "master";
  folders: { name: string }[];
  files: { name: string; path: string }[];
  onNavigate: (folderName: string) => void;
  onSelectFile: (path: string) => void;

  onRename?: (type: "folder" | "file", oldName: string, newName: string) => void;
  onDeleteFolder?: (name: string) => void;
  onDeleteFile?: (name: string) => void;
}

export default function FolderBrowserList({
  mode,
  folders,
  files,
  onNavigate,
  onSelectFile,
  onRename,
  onDeleteFolder,
  onDeleteFile,
}: FolderBrowserListProps) {
  const [renaming, setRenaming] = useState<{
    type: "folder" | "file";
    name: string;
  } | null>(null);

  const [renameValue, setRenameValue] = useState("");

  const startRename = (type: "folder" | "file", name: string) => {
    setRenaming({ type, name });
    setRenameValue(name);
  };

  const submitRename = () => {
    if (!renaming) return;
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenaming(null);
      return;
    }

    if (trimmed !== renaming.name) {
      onRename?.(renaming.type, renaming.name, trimmed);
    }

    setRenaming(null);
  };

  const cancelRename = () => {
    setRenaming(null);
  };

  const confirmDelete = (type: "folder" | "file", name: string) => {
    const ok = window.confirm(
      `Are you sure you want to delete this ${type}?`
    );
    if (!ok) return;

    if (type === "folder") onDeleteFolder?.(name);
    if (type === "file") onDeleteFile?.(name);
  };

  const isMaster = mode === "master";
  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <div className="space-y-1">
      {isEmpty && (
        <div className="text-gray-500 text-center py-8">
          This folder is empty
        </div>
      )}

      {/* FOLDERS */}
      {folders.map((folder) => (
        <div
          key={folder.name}
          className="flex items-center justify-between px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
        >
          {/* NAME OR RENAME INPUT */}
          {renaming?.type === "folder" && renaming.name === folder.name ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={submitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename();
                if (e.key === "Escape") cancelRename();
              }}
              className="border px-1 py-0.5 rounded w-full"
            />
          ) : (
            <div
              className="flex-1"
              onClick={() => onNavigate(folder.name)}
            >
              {folder.name}
            </div>
          )}

          {/* ACTION MENU */}
          {isMaster && (
            <div className="relative ml-2">
              <details className="group">
                <summary className="cursor-pointer px-2 select-none">
                  ⋮
                </summary>
                <div className="absolute right-0 mt-1 bg-white border rounded shadow-md z-10 w-32">
                  <button
                    onClick={() => startRename("folder", folder.name)}
                    className="block w-full text-left px-3 py-1 hover:bg-gray-100"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => confirmDelete("folder", folder.name)}
                    className="block w-full text-left px-3 py-1 hover:bg-gray-100 text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </details>
            </div>
          )}
        </div>
      ))}

      {/* FILES */}
      {files.map((file) => (
        <div
          key={file.name}
          className="flex items-center justify-between px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
        >
          {/* NAME OR RENAME INPUT */}
          {renaming?.type === "file" && renaming.name === file.name ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={submitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename();
                if (e.key === "Escape") cancelRename();
              }}
              className="border px-1 py-0.5 rounded w-full"
            />
          ) : (
            <div
              className="flex-1"
              onClick={() => onSelectFile(file.path)}
            >
              {file.name}
            </div>
          )}

          {/* ACTION MENU */}
          {isMaster && (
            <div className="relative ml-2">
              <details className="group">
                <summary className="cursor-pointer px-2 select-none">
                  ⋮
                </summary>
                <div className="absolute right-0 mt-1 bg-white border rounded shadow-md z-10 w-32">
                  <button
                    onClick={() => startRename("file", file.name)}
                    className="block w-full text-left px-3 py-1 hover:bg-gray-100"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => confirmDelete("file", file.name)}
                    className="block w-full text-left px-3 py-1 hover:bg-gray-100 text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </details>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
