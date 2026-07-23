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

  return (
    <FolderTree
      root={root}
      variant="admin"
      disableSelection={true}
      expandedPaths={expandedPaths}
      onSelectFolder={(path) => {
        const encoded = encodeURIComponent(path);
        router.push(`/master/templates/map?path=${encoded}`);
      }}
    />
  );
}
