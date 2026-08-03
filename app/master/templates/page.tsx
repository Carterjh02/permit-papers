"use server";

import Link from "next/link";
import TreeWrapper from "./TreeWrapper";
import { FolderNode, SupabaseFile } from "@/app/components/FolderTree";
import { supabaseServer } from "@/lib/supabaseServer";

/* ---------------- SUPABASE LISTING (BUCKET-AWARE) ---------------- */

async function listFolder(bucket: "templates" | "companies", path: string) {
  const clean = path.replace(/\/$/, "");
  const prefix = clean === "" ? "" : clean + "/";

  const { data, error } = await supabaseServer.storage
    .from(bucket)
    .list(prefix, { limit: 1000 });

  if (error) {
    console.error(`Supabase list error (${bucket}):`, error);
    return { folders: [] as { name: string }[], files: [] as SupabaseFile[] };
  }

  const folders: { name: string }[] = [];
  const files: SupabaseFile[] = [];

  for (const item of data || []) {
    if (item.name.startsWith(".")) continue;

    // Hide jobs/logos for companies bucket
    if (bucket === "companies" && item.metadata === null) {
      if (item.name === "jobs" || item.name === "logos") continue;
    }

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

/* ---------------- BUILD TREE (BUCKET-AWARE) ---------------- */

async function buildTree(bucket: "templates" | "companies", path: string): Promise<FolderNode> {
  const clean = path.replace(/\/+$/, "");
  const { folders, files } = await listFolder(bucket, clean);

  const children = await Promise.all(
    folders.map((f) =>
      buildTree(bucket, clean === "" ? f.name : `${clean}/${f.name}`)
    )
  );

  return {
    name: clean === "" ? (bucket === "templates" ? "Templates" : "Companies") : clean.split("/").pop()!,
    fullPath: clean,
    folders: children,
    files,
  };
}

/* ---------------- PAGE ---------------- */

export default async function MasterTemplatesPage() {
  // Templates bucket root
  const templatesRoot = await buildTree("templates", "");

  // Companies bucket root (all companies)
  const companiesRoot = await buildTree("companies", "");

  return (
    <div className="page-container space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Master Templates</h1>

        <Link href="/master/templates/new" className="btn btn-primary">
          Upload New Template
        </Link>
      </div>

      {/* TEMPLATES TREE */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Templates</h2>
        <TreeWrapper
          root={templatesRoot}
          expandedPaths={new Set([""])}
        />
      </div>

      {/* COMPANIES TREE */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Companies</h2>
        <TreeWrapper
          root={companiesRoot}
          expandedPaths={new Set([""])}
        />
      </div>
    </div>
  );
}
