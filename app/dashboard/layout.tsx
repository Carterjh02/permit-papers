"use client";

import "./dashboard.css"; //dashboard-only styling

import { SessionProvider, useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { TutorialProvider } from "../components/tutorial/TutorialProvider";
import { TutorialStep } from "../components/tutorial/TutorialStep";

type AutosaveTimers = {
  [key: string]: ReturnType<typeof setTimeout>;
};

declare global {
  interface Window {
    autosaveTimers?: AutosaveTimers;
  }
}

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
  const [tutorialState, setTutorialState] = useState(null);

  const reloadTutorial = useCallback(async () => {
    if (!session?.user) return;
    const res = await fetch("/api/tutorial/load");
    const data = await res.json();
    setTutorialState(data.tutorial);
  }, [session]);

  useEffect(() => {
    async function loadTutorial() {
      if (!session?.user) return;
  
      const res = await fetch("/api/tutorial/load");
      const data = await res.json();
      setTutorialState(data.tutorial);
    }
  
    loadTutorial();
  }, [session]);

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

  useEffect(() => {
    function handleTutorialReload() {
      reloadTutorial();
    }
  
    window.addEventListener("tutorialReload", handleTutorialReload);
    return () => window.removeEventListener("tutorialReload", handleTutorialReload);
  }, [reloadTutorial]);

  useEffect(() => {
    function handleInput(event: Event) {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (!target.name) return;
  
      const value = target.value;
      const page = window.location.pathname;
  
      if (!window.autosaveTimers) {
        window.autosaveTimers = {};
      }
  
      const key = `autosave-${page}-${target.name}`;
      const existingTimer = window.autosaveTimers[key];
      if (existingTimer) clearTimeout(existingTimer);
  
      window.autosaveTimers[key] = setTimeout(() => {
        fetch("/api/autosave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page, field: target.name, value }),
        }).catch(() => {});
      }, 500);
    }
  
    document.addEventListener("input", handleInput);
    return () => document.removeEventListener("input", handleInput);
  }, []);
  
  return (
    
    <div
      className="dashboard-root"
      data-theme={theme}
      data-font={font}
      data-density={density}
    >
    <TutorialProvider
      tutorial={tutorialState}
      role={role === "admin" || role === "master" ? "admin" : "user"}
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
            <Link href="/dashboard" className="dashboard-link" id="nav-dashboard">
              Dashboard
            </Link>

            <Link href="/dashboard/company" className="dashboard-link" id="nav-company">
              Company
            </Link>

            {role === "admin" && (
              <>
              <Link href="/dashboard/users" className="dashboard-link" id="nav-users">
                Users
              </Link>

            </>
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

      <TutorialStep />
        <main className="flex-1 dashboard-container">{children}</main>
      </TutorialProvider>
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
