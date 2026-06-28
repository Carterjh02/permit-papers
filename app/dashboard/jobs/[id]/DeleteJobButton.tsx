"use client";

import { useState } from "react";

export default function DeleteJobButton({ jobNumber }: { jobNumber: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="btn btn-danger"
        type="button"
        onClick={() => setOpen(true)}
      >
        Delete Job
      </button>

      {open && (
        <dialog open className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              Delete Job #{jobNumber}?
            </h3>

            <p className="py-4">
              This action cannot be undone. All files and documents associated
              with this job will be permanently deleted.
            </p>

            <div className="modal-action">
              <button className="btn" onClick={() => setOpen(false)}>
                Cancel
              </button>

              <button
                className="btn btn-error"
                onClick={() => {
                  const form = document.getElementById(
                    "delete-job-form"
                  ) as HTMLFormElement;
                  form.requestSubmit();
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
