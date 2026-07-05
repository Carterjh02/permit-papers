"use client";

interface DeleteJobButtonProps {
  jobNumber: number;
  action: () => Promise<void>;
}

export default function DeleteJobButton({ jobNumber, action }: DeleteJobButtonProps) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="btn btn-danger"
      >
        Delete Job #{jobNumber}
      </button>
    </form>
  );
}
