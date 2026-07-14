"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

export default function MasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side protection is already handled in the master pages.

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Permit Papers
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/master" className="hover:text-blue-600">
              Dashboard
            </Link>
            <Link href="/master/companies" className="hover:text-blue-600">
              Companies
            </Link>
            <Link href="/master/users" className="hover:text-blue-600">
              Users
            </Link>
            <Link href="/master/templates" className="hover:text-blue-600">
              Templates
            </Link>
            <Link href="/master/settings" className="hover:text-blue-600">
              Settings
            </Link>

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
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>
    </div>
  );
}
