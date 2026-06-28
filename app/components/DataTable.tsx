import React from "react";

interface DataTableProps {
  headers: React.ReactNode;
  children: React.ReactNode;
}

export function DataTable({ headers, children }: DataTableProps) {
  return (
    <div className="card p-4 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b">{headers}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
