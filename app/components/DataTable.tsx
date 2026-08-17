import React from "react";

interface DataTableProps {
  headers: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DataTable({ headers, children, className }: DataTableProps) {
  return (
    <div className="p-4 overflow-x-auto bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg">
      <table className={`min-w-full text-sm ${className ?? ""}`}>
        <thead>
          <tr className="border-b border-[var(--border-color)]">
            {headers}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}