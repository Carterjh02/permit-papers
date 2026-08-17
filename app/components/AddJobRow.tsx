"use client";

export function AddJobRow() {
  return (
    <tr
      className="bg-[var(--card-bg)] hover:bg-[var(--btn-secondary-hover)] cursor-pointer transition"
      onClick={() => (window.location.href = "/dashboard/jobs/new")}
    >
      <td
        colSpan={6}
        className="py-3 px-4 font-medium text-center text-[var(--text-color)]"
      >
        + Add Job
      </td>
    </tr>
  );
}
