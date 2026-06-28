"use client";

export function AddJobRow() {
  return (
    <tr
      className="bg-neutral-100 hover:bg-neutral-200 cursor-pointer transition"
      onClick={() => (window.location.href = "/dashboard/jobs/new")}
    >
      <td colSpan={6} className="py-3 px-4 font-medium text-center">
        + Add Job
      </td>
    </tr>
  );
}
