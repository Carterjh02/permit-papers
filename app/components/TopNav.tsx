// app/components/TopNav.tsx
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { CompanySelector } from "./CompanySelector";

export default function TopNav() {
  const { data: session } = useSession();

  const user = session?.user as
    | {
        id: string;
        username: string;
        role: "master" | "admin" | "user";
        companyId: string | null;
      }
    | undefined;

  return (
    <header className="w-full bg-white shadow px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <Link href="/dashboard" className="font-bold text-lg">
          Permit Papers
        </Link>

        <Link href="/jobs" className="hover:text-blue-600">
          Jobs
        </Link>

        {(user?.role === "admin" || user?.role === "master") && (
          <>
            <Link href="/company/settings" className="hover:text-blue-600">
              Company Settings
            </Link>

            <Link href="/company/users" className="hover:text-blue-600">
              User Management
            </Link>
          </>
        )}
      </div>

      <div className="flex items-center space-x-4 text-sm text-gray-600">
        {user && (
          <CompanySelector
            role={user.role}
            sessionCompanyId={user.companyId}
          />
        )}
        <span>{user?.username ?? "Unknown"} ({user?.role})</span>
      </div>
    </header>
  );
}
