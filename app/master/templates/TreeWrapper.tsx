"use client";

import { useRouter } from "next/navigation";
import FolderTree, { FolderNode } from "@/app/components/FolderTree";

export default function TreeWrapper({
  root,
  expandedPaths,
}: {
  root: FolderNode;
  expandedPaths: Set<string>;
}) {
  const router = useRouter();

  const goToMapping = (fullPath: string) => {
    const bucket =
      root.name === "Templates" ? "templates" : "companies";

    const corrected = `${bucket}/${fullPath}`;
    const encoded = encodeURIComponent(corrected);

    router.push(`/master/templates/map/batch?paths=${encoded}`);
  };

  return (
    <FolderTree
      root={root}
      variant="admin"
      disableSelection={true}
      expandedPaths={expandedPaths}
      onSelectFolder={(path) => {
        if (!path) return;
        goToMapping(path);
      }}
      onSelectFile={(filePath) => {
        if (!filePath) return;
        goToMapping(filePath);
      }}
    />
  );
}
