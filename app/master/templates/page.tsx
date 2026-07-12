"use server";

import Link from "next/link";
import FolderTree, { FolderNode, SupabaseFile } from "@/app/components/FolderTree";
import { supabaseServer } from "@/lib/supabaseServer";
import ClientDebug from "@/app/debug/ClientDebug";

/* ---------------- SUPABASE LISTING ---------------- */

async function listFolder(path: string) {
  const clean = path.replace(/\/$/, "");
  const prefix = clean === "" ? "" : clean + "/";

  const { data, error } = await supabaseServer.storage
    .from("templates")
    .list(prefix, { limit: 1000 });

  if (error) {
    console.error("Supabase list error:", error);
    return { folders: [] as { name: string }[], files: [] as SupabaseFile[] };
  }

  const folders: { name: string }[] = [];
  const files: SupabaseFile[] = [];

  for (const item of data || []) {
    if (item.name === ".") continue;

    if (item.metadata === null) {
      folders.push({ name: item.name });
    } else {
      files.push({
        name: item.name,
        path: prefix + item.name,
      });
    }
  }

  return { folders, files };
}

async function buildTree(path: string): Promise<FolderNode> {
  const { folders, files } = await listFolder(path);

  const children = await Promise.all(
    folders.map((f) =>
      buildTree(path === "" ? f.name : `${path}/${f.name}`)
    )
  );

  return {
    name: path === "" ? "templates" : path.split("/").pop()!,
    fullPath: path,
    folders: children,
    files,
  };
}

/* ---------------- PAGE ---------------- */

export default async function MasterTemplatesPage() {
  const root = await buildTree("templates");

  return (
    <div className="page-container space-y-6">
      <ClientDebug serverSession={null} />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Master Templates</h1>

        <Link href="/master/templates/new" className="btn btn-primary">
          Upload New Template
        </Link>
      </div>

      <FolderTree
        root={root}
        variant="admin"
        disableSelection={true}
      />
    </div>
  );
}
