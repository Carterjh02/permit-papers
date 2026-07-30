"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

type SortDir = "asc" | "desc";

interface SortOption {
  value: string;
  label: string;
}

interface SortControlsProps {
  sortName?: string;
  dirName?: string;
  sortValue: string;
  dirValue: SortDir;
  options: SortOption[];
  className?: string;
}

export function SortControls({
  sortName = "sort",
  dirName = "dir",
  sortValue,
  dirValue,
  options,
  className,
}: SortControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    params.set("page", "1"); // reset pagination when sorting
    router.push(`?${params.toString()}`);
  };

  return (
    <>
      <div className={className}>
        <label className="block text-sm font-medium">Sort by</label>
        <select
          name={sortName}
          defaultValue={sortValue}
          className="input"
          onChange={(e) => updateParam(sortName, e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className={className}>
        <label className="block text-sm font-medium">Direction</label>
        <select
          name={dirName}
          defaultValue={dirValue}
          className="input"
          onChange={(e) => updateParam(dirName, e.target.value)}
        >
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>
      </div>
    </>
  );
}
