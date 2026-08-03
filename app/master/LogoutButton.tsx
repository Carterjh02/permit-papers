"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      type="button"
      className="btn btn-secondary"
      onClick={() => {
        setTimeout(() => {
          signOut({ callbackUrl: "/login" });
        }, 50);
      }}
    >
      Logout
    </button>
  );
}
