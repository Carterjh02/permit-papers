"use client";

import { useRouter } from "next/navigation";

interface DeleteJobButtonProps {
  jobNumber: number;
  action: () => Promise<void>;
}

export default function DeleteJobButton({ jobNumber, action }: DeleteJobButtonProps) {
  const router = useRouter();

  async function handleDelete() {
    try {
      await action(); // run server action

      // Redirect to dashboard after successful delete
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  return (
    <button
      type="button"
      className="btn btn-danger"
      onClick={handleDelete}
    >
      Delete Job #{jobNumber}
    </button>
  );
}
