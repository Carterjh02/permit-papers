// lib/useCurrentCompanyId.ts
"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";

const STORAGE_KEY = "currentCompanyId";

type SessionUser = {
  id: string;
  username: string;
  role: "master" | "admin" | "user";
  companyId: string | null;
};

export function useCurrentCompanyId() {
  const { data: session } = useSession();

  // No state, no effects — fully derived value
  const companyId = useMemo(() => {
    const user = session?.user as SessionUser | undefined;
    if (!user) return null;

    // Admins always use their own company
    if (user.role === "admin") {
      return user.companyId;
    }

    // Master admin uses selected company from localStorage
    if (user.role === "master" && typeof window !== "undefined") {
      return window.localStorage.getItem(STORAGE_KEY) ?? null;
    }

    return null;
  }, [session]);

  return companyId;
}
