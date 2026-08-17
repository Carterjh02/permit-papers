"use client";

import "./dashboard.css"; //dashboard-only styling

import { SessionProvider, useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [font, setFont] = useState<
    "inter" | "roboto" | "system-ui" | "georgia" | "source-sans"
  >("inter");
  const [density, setDensity] = useState<"comfortable" | "compact">(
    "comfortable"
  );

  useEffect(() => {
    async function fetchPrefs() {
      if (!session?.user) return;

      const prefs = await fetch("/api/preferences/load").then(r => r.json());

      const effective = prefs.effectivePrefs;

      setTheme(effective.theme);
      setFont(effective.uiFont);
      setDensity(effective.density);
    }

    fetchPrefs();
  }, [session]);

  return (
    <div
      className="dashboard-root"
      data-theme={theme}
      data-font={font}
      data-density={density}
    >
      <nav className="dashboard-nav sticky top-0 z-50 py-4 sm:py-5">
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
            <Link href="/dashboard" className="dashboard-link">
              Dashboard
            </Link>

            <Link href="/dashboard/company" className="dashboard-link">
              Company
            </Link>

            {role === "admin" && (
              <Link href="/dashboard/users" className="dashboard-link">
                Users
              </Link>
            )}

            <Link href="/dashboard/settings" className="dashboard-link">
              Settings
            </Link>

            <button
              type="button"
              className="dashboard-btn dashboard-btn-secondary"
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

      <main className="flex-1 dashboard-container">{children}</main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </SessionProvider>
  );
}
