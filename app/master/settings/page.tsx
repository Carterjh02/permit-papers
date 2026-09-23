"use client";

import { useState } from "react";
import { useEffect } from "react";

export default function MasterSettingsPage() {
  const [activeTab, setActiveTab] = useState("subscription");
  const [masterTheme, setMasterTheme] = useState("dark");
  const [masterFont, setMasterFont] = useState("inter");
  const [masterDensity, setMasterDensity] = useState("comfortable");
  
  const tabs = [
    { id: "subscription", label: "Subscription Manager" },
    { id: "templates", label: "Template Manager" },
    { id: "features", label: "Feature Toggles" },
    { id: "demo", label: "Demo Accounts" },
    { id: "companies", label: "Company Overview" },
    { id: "logs", label: "System Logs" },
    { id: "userprefs", label: "User Preferences" },
    { id: "support", label: "Support Inbox" },
  ];

  useEffect(() => {
    async function loadMasterPrefs() {
      const prefs = await fetch("/api/preferences/load").then((r) => r.json());
  
      if (prefs.userPrefs) {
        setMasterTheme(prefs.userPrefs.theme ?? "dark");
        setMasterFont(prefs.userPrefs.font ?? "inter");
        setMasterDensity(prefs.userPrefs.density ?? "comfortable");
      }
  
      // Apply immediately to master-root
      const root = document.querySelector(".master-root");
      if (root) {
        root.setAttribute("data-theme", prefs.userPrefs?.theme ?? "dark");
        root.setAttribute("data-font", prefs.userPrefs?.font ?? "inter");
        root.setAttribute("data-density", prefs.userPrefs?.density ?? "comfortable");
      }
    }
  
    loadMasterPrefs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

      <h1 className="text-3xl font-bold">Master Settings</h1>
      <p className="text-gray-600">
        Manage system-wide configuration, subscriptions, templates, and support tools.
      </p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 border-b pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white shadow rounded-lg p-6 min-h-[300px]">
        {activeTab === "subscription" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Subscription Manager</h2>
            <p className="text-gray-600">
              Create and manage subscription tiers, job limits, and pricing.
            </p>
          </div>
        )}

        {activeTab === "templates" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Template Manager</h2>
            <p className="text-gray-600">
              Control county availability, categories, and template metadata.
            </p>
          </div>
        )}

        {activeTab === "features" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Feature Toggles</h2>
            <p className="text-gray-600">
              Enable or disable system-wide features such as demo accounts, onboarding wizard, OCR, and property appraiser integration.
            </p>
          </div>
        )}

        {activeTab === "demo" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Demo Accounts</h2>
            <p className="text-gray-600">
              View, manage, and expire temporary demo accounts.
            </p>
          </div>
        )}

        {activeTab === "companies" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Company Overview</h2>
            <p className="text-gray-600">
              Search and manage all companies in the system.
            </p>
          </div>
        )}

        {activeTab === "logs" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">System Logs</h2>
            <p className="text-gray-600">
              View job creation logs, template uploads, and system errors.
            </p>
          </div>
        )}

        {activeTab === "userprefs" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">User Preferences</h2>
            <p className="text-gray-600 mb-6">
              Customize your master dashboard theme, font, and UI density.
            </p>

            {/* ----------------------------- */}
            {/* THEME (Light / Dark)          */}
            {/* ----------------------------- */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">Theme</h3>
              <div className="space-y-2">
                {["light", "dark"].map((v) => (
                  <label key={v} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="masterTheme"
                      value={v}
                      checked={masterTheme === v}
                      onChange={() => setMasterTheme(v)}
                    />
                    <span>{v === "light" ? "Light" : "Dark"}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ----------------------------- */}
            {/* UI FONT                       */}
            {/* ----------------------------- */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">UI Font</h3>
              <div className="space-y-2">
                {["inter", "roboto", "system-ui", "georgia", "source-sans"].map((v) => (
                  <label key={v} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="masterFont"
                      value={v}
                      checked={masterFont === v}
                      onChange={() => setMasterFont(v)}
                    />
                    <span style={{ fontFamily: v === "source-sans" ? "Source Sans Pro" : v }}>
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* ----------------------------- */}
            {/* UI DENSITY                    */}
            {/* ----------------------------- */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">UI Density</h3>
              <div className="space-y-2">
                {["comfortable", "compact"].map((v) => (
                  <label key={v} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="masterDensity"
                      value={v}
                      checked={masterDensity === v}
                      onChange={() => setMasterDensity(v)}
                    />
                    <span>{v === "comfortable" ? "Comfortable" : "Compact"}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ----------------------------- */}
            {/* SAVE + RESET BUTTONS          */}
            {/* ----------------------------- */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex justify-end z-50">
              <button
                onClick={async () => {
                  await fetch("/api/preferences/user", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      theme: masterTheme,
                      font: masterFont,
                      density: masterDensity,
                    }),
                  });

                  const root = document.querySelector(".master-root");
                  if (root) {
                    root.setAttribute("data-theme", masterTheme);
                    root.setAttribute("data-font", masterFont);
                    root.setAttribute("data-density", masterDensity);
                  }

                  alert("Master UI preferences saved!");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Save UI Preferences
              </button>

              <button
                onClick={() => {
                  setMasterTheme("dark");
                  setMasterFont("inter");
                  setMasterDensity("comfortable");
                }}
                className="ml-3 px-4 py-2 bg-gray-200 rounded-md"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        )}

        {activeTab === "support" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Support Inbox</h2>
            <p className="text-gray-600">
              View messages submitted by users and admins.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
