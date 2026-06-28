// app/components/CompanySelector.tsx
"use client";

import { useEffect, useState } from "react";

type Company = {
  id: string;
  name: string;
  companyCode: string;
};

type Props = {
  role: "master" | "admin" | "user";
  sessionCompanyId: string | null;
};

const STORAGE_KEY = "currentCompanyId";

export function CompanySelector({ role, sessionCompanyId }: Props) {
  const [companies, setCompanies] = useState<Company[]>([]);

  // FIX: initialize state lazily instead of setting inside useEffect
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(() => {
    if (role === "admin") return sessionCompanyId;
    if (role === "master" && typeof window !== "undefined") {
      return window.localStorage.getItem(STORAGE_KEY) ?? null;
    }
    return null;
  });

  // Fetch companies (allowed in effect)
  useEffect(() => {
    if (role === "user") return;

    fetch("/api/companies")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => setCompanies(data))
      .catch(() => setCompanies([]));
  }, [role]);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value || null;
    setCurrentCompanyId(value);

    if (role === "master" && typeof window !== "undefined") {
      if (value) window.localStorage.setItem(STORAGE_KEY, value);
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  if (role === "user") return null;
  if (!companies.length) return null;

  return (
    <select
      value={currentCompanyId ?? ""}
      onChange={handleChange}
      className="border rounded px-2 py-1 text-sm"
    >
      <option value="">Select company</option>
      {companies.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name} ({c.companyCode})
        </option>
      ))}
    </select>
  );
}
