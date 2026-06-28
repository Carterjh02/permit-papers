import React from "react";

interface FilterPanelProps {
  children: React.ReactNode;
}

export function FilterPanel({ children }: FilterPanelProps) {
  return (
    <form className="flex flex-wrap items-end gap-4 mb-4" method="get">
      {children}
      <button type="submit" className="btn btn-secondary">
        Apply
      </button>
    </form>
  );
}
