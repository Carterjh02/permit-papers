"use client";

interface DeleteJobButtonProps {
  jobNumber: number;
  action: () => Promise<void>;
}

export default function DeleteJobButton({ jobNumber, action }: DeleteJobButtonProps) {
  async function handleDelete() {
    try {
      await action(); // run server action
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
