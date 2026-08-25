"use client";

export function AddJobRowContent() {
  return (
    <div
      className="add-job-cell cursor-pointer"
      onClick={() => (window.location.href = "/dashboard/jobs/new")}
    >
      + Add Job
    </div>
  );
}
