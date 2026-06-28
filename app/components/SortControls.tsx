import React from "react";

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
  return (
    <>
      <div className={className}>
        <label className="block text-sm font-medium">Sort by</label>
        <select name={sortName} defaultValue={sortValue} className="input">
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className={className}>
        <label className="block text-sm font-medium">Direction</label>
        <select name={dirName} defaultValue={dirValue} className="input">
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>
      </div>
    </>
  );
}
