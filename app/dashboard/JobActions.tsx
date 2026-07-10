"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteJobAction } from "@/app/dashboard/jobs/serverActions";

interface JobActionsProps {
  jobId: string;
  jobNumber: number;
}

export default function JobActions({ jobId, jobNumber }: JobActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleDelete() {
    await deleteJobAction(jobId);   // direct server action call
    router.refresh();               // instantly refresh dashboard
  }

  return (
    <>
      {/* ACTIONS DROPDOWN */}
      <div ref={menuRef} className="relative inline-block text-left">
        <button
          className="btn btn-sm btn-outline"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          Actions
        </button>

        {menuOpen && (
          <ul
            className="absolute right-0 mt-2 w-40 menu p-2 bg-white border border-gray-300 shadow-xl rounded-lg z-50"
          >
            <li>
              <a href={`/dashboard/jobs/${jobId}`}>Edit Job</a>
            </li>

            <li>
              <button
                className="text-red-600"
                onClick={() => {
                  setMenuOpen(false);
                  setModalOpen(true);
                }}
              >
                Delete Job
              </button>
            </li>
          </ul>
        )}
      </div>

    {/* CONFIRM DELETE MODAL */}
      {modalOpen && (
        <dialog open className="modal bg-gray-200/40 backdrop-blur-sm p-6">
          <div className="modal-box border border-gray-200 shadow-xl bg-white p-6 rounded-lg">
        <h3 className="font-bold text-lg text-gray-800 mb-2">
          Delete Job #{jobNumber}?
        </h3>

        <p className="py-2 text-gray-700 leading-relaxed">
          This action cannot be undone. All files and documents associated with
          this job will be permanently deleted.
        </p>

        <div className="modal-action mt-6">
          <button className="btn" onClick={() => setModalOpen(false)}>
            Cancel
          </button>

          <button className="btn btn-error ml-2" onClick={handleDelete}>
            Yes, Delete
          </button>
        </div>
      </div>
    </dialog>
  )}
    </>
  );
}
