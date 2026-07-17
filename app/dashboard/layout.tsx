"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const role = session?.user?.role;

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-200 shadow-sm sticky top-0 z-50 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          <Link href="/" className="flex items-center">
            <Image
              src="/logos/logo-permitpapers-plain.png"
              alt="Permit Papers"
              width={320}
              height={85}
              className="h-20 w-auto sm:h-16"
              priority
            />
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-blue-600">
              Dashboard
            </Link>

            <Link href="/dashboard/company" className="hover:text-blue-600">
              Company
            </Link>

            {role === "admin" && (
              <Link href="/dashboard/users" className="hover:text-blue-600">
                Users
              </Link>
            )}

            <Link href="/dashboard/settings" className="hover:text-blue-600">
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </SessionProvider>
  );
}
