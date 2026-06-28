"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function JobActions({
  jobId,
  jobNumber,
}: {
  jobId: string;
  jobNumber: number;
}) {
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
    await fetch(`/dashboard/jobs/${jobId}/delete`, {
      method: "POST",
    });

    router.push("/dashboard");
    router.refresh();
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
          <ul className="absolute right-0 mt-2 w-40 menu p-2 shadow bg-base-100 rounded-box z-50">
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
        <dialog open className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Job #{jobNumber}?</h3>

            <p className="py-4">
              This action cannot be undone. All files and documents associated
              with this job will be permanently deleted.
            </p>

            <div className="modal-action">
              <button className="btn" onClick={() => setModalOpen(false)}>
                Cancel
              </button>

              <button className="btn btn-error" onClick={handleDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
