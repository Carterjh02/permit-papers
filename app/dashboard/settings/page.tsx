"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function DashboardSettingsPage() {
  const { data: session } = useSession();

  const role = session?.user?.role === "admin" ? "admin" : "user";

  // Initial tab based on role
  const initialTab = role === "admin" ? "company" : "account";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Company formatting preference state
  const [companyAddressFormat, setCompanyAddressFormat] = useState("usps");
  const [companyAddressCase, setCompanyAddressCase] = useState("title");
  const [companyNameFormat, setCompanyNameFormat] = useState("first-last");
  const [companyNameCase, setCompanyNameCase] = useState("title");
  const [companyPhoneFormat, setCompanyPhoneFormat] = useState("parentheses");
  const [companyDocumentFont, setCompanyDocumentFont] = useState("inter");
  
  // User preference state
  const [userTheme, setUserTheme] = useState("light");
  const [userFont, setUserFont] = useState("inter");
  const [userDensity, setUserDensity] = useState("comfortable");
  const [tutorialEnabled, setTutorialEnabled] = useState<boolean>(true);

  // Toast system
const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

function showToast(message: string, type: "success" | "error" = "success") {
  setToast({ message, type });
  setTimeout(() => setToast(null), 3000);
}

const [showResetModal, setShowResetModal] = useState(false);
const [resetTarget, setResetTarget] = useState<"company" | "user" | null>(null);

function openResetModal(target: "company" | "user") {
  setResetTarget(target);
  setShowResetModal(true);
}

function closeResetModal() {
  setShowResetModal(false);
  setResetTarget(null);
}

  async function saveCompanyPreferences() {
    try {
      await fetch("/api/preferences/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultAddressFormat: companyAddressFormat,
          defaultAddressCase: companyAddressCase,
          defaultNameFormat: companyNameFormat,
          defaultNameCase: companyNameCase,
          defaultPhoneFormat: companyPhoneFormat,
          defaultDocumentFont: companyDocumentFont,
        }),
      });
    } catch (err) {
      console.error("Failed to save company preferences:", err);
      showToast("Failed to save company preferences", "error");
    }
  }
  
  async function saveUserPreferences() {
    try {
      await fetch("/api/preferences/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: userTheme,
          font: userFont,
          density: userDensity,
        }),
      });

      const root = document.querySelector(".dashboard-root");
      if (root) {
        root.setAttribute("data-theme", userTheme);
        root.setAttribute("data-font", userFont);
        root.setAttribute("data-density", userDensity);
      }
  
      showToast("User preferences saved", "success");
    } catch (err) {
      console.error("Failed to save user preferences:", err);
      showToast("Failed to save user preferences", "error");
    }
  }

  async function resetCompanyPreferences() {
    try {
      // Reset state
      setCompanyAddressFormat("usps");
      setCompanyAddressCase("title");
      setCompanyNameFormat("first-last");
      setCompanyNameCase("title");
      setCompanyPhoneFormat("parentheses");
      setCompanyDocumentFont("inter");
  
      // Persist reset
      await fetch("/api/preferences/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultAddressFormat: "usps",
          defaultAddressCase: "title",
          defaultNameFormat: "first-last",
          defaultNameCase: "title",
          defaultPhoneFormat: "parentheses",
          defaultDocumentFont: "inter",
        }),
      });
  
      showToast("Company formatting reset to defaults!", "success");
    } catch (err) {
      console.error("Failed to reset company preferences:", err);
      showToast("Failed to reset company preferences", "error");
    }
  }
  
  async function resetUserPreferences() {
    try {
      // Reset state
      setUserTheme("light");
      setUserFont("inter");
      setUserDensity("comfortable");
  
      // Persist reset
      await fetch("/api/preferences/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: "light",
          font: "inter",
          density: "comfortable",
        }),
      });
  
      showToast("User preferences reset to defaults!", "success");
    } catch (err) {
      console.error("Failed to reset user preferences:", err);
      showToast("Failed to reset user preferences", "error");
    }
  }

  async function toggleTutorialEnabled() {
    await fetch("/api/tutorial/update", {
      method: "POST",
      body: JSON.stringify({ enabled: !tutorialEnabled }),
    });
    setTutorialEnabled(!tutorialEnabled);
  }
  
  async function restartSection(section: string) {
    await fetch("/api/tutorial/restart", {
      method: "POST",
      body: JSON.stringify({ section }),
    });
  
    window.location.reload();
  }

useEffect(() => {
  async function loadPrefs() {
    if (!session?.user) return;

    const prefs = await fetch("/api/preferences/load").then((r) => r.json());

    // Company prefs
    if (prefs.companyPrefs) {
      setCompanyAddressFormat(prefs.companyPrefs.defaultAddressFormat ?? "usps");
      setCompanyAddressCase(prefs.companyPrefs.defaultAddressCase ?? "title");
      setCompanyNameFormat(prefs.companyPrefs.defaultNameFormat ?? "first-last");
      setCompanyNameCase(prefs.companyPrefs.defaultNameCase ?? "title");
      setCompanyPhoneFormat(prefs.companyPrefs.defaultPhoneFormat ?? "parentheses");
      setCompanyDocumentFont(prefs.companyPrefs.defaultDocumentFont ?? "inter");
    }

    // User prefs
    if (prefs.userPrefs) {
      setUserTheme(prefs.userPrefs.theme ?? "light");
      setUserFont(prefs.userPrefs.font ?? "inter");
      setUserDensity(prefs.userPrefs.density ?? "comfortable");
    }
  }

  loadPrefs();
}, [session]);
  
  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-[var(--section-gap)] py-[calc(var(--section-gap)*2)]">
        <p className="text-[var(--text-color)]">Loading settings...</p>
      </div>
    );
  }

  const adminTabs = [
    { id: "company", label: "Company Profile" },
    { id: "formatting", label: "Formatting Preferences" }, 
    { id: "billing", label: "Subscription & Billing" },
    { id: "users", label: "User Management" },
    { id: "account", label: "My Account" },
    { id: "userprefs", label: "User Preferences" }, 
    { id: "support", label: "Support" },
  ];

  const userTabs = [
    { id: "account", label: "My Account" },
    { id: "userprefs", label: "User Preferences" }, 
    { id: "support", label: "Support" },
  ];

  const tabs = role === "admin" ? adminTabs : userTabs;

  return (
    <div className="max-w-7xl mx-auto px-[var(--section-gap)] py-[calc(var(--section-gap)*2)] space-y-[calc(var(--section-gap)*2)]">

      <h1 className="text-2xl-d font-bold">Settings</h1>
      <p className="text-[var(--text-color)]">
        Manage your account, company information, and support preferences.
      </p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-[var(--block-gap)] border-b border-[var(--border-color)] pb-[var(--section-gap)]">
        {tabs.map((tab) => (
          <div key={tab.id} className="relative">
            <button
              onClick={() => setActiveTab(tab.id)}
              id={tab.id === "formatting" ? "tab-formatting" : undefined}
              className={`px-[var(--btn-padding-x)] py-[var(--btn-padding-y)] rounded-md text-sm-d-d font-medium ${
                activeTab === tab.id
                  ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]"
                  : "bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover)]"
              }`}
            >
              {tab.label}
            </button>
          </div>
        ))}
      </div>
      {/* Content */}
      <div className="bg-[var(--card-bg)] shadow rounded-lg p-[var(--section-gap)] min-h-[calc(var(--row-height)*12)] ">

        {/* ADMIN: Company Profile */}
        {role === "admin" && activeTab === "company" && (
          <div>
            <h2 className="text-xl-d font-semibold mb-[var(--block-gap)]">Company Profile</h2>
            <p className="text-[var(--text-color)] mb-[var(--block-gap)]">
              Update your company information, licenses, and contact details.
            </p>

            <Link
              href="/dashboard/company"
              className="px-[var(--btn-padding-x)] py-[var(--btn-padding-y)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-md hover:bg-[var(--btn-primary-hover)]"
            >
              Edit Company Information
            </Link>
          </div>
        )}

        {/* ADMIN: Formatting Preferences */}
        {role === "admin" && activeTab === "formatting" && (
          <div>
            <h2 className="text-xl-d font-semibold mb-[var(--block-gap)]" id="formatting-overview">Formatting Preferences</h2>
            <p className="text-[var(--text-color)] mb-[var(--block-gap)]">
              Configure company-wide formatting rules for names, addresses, phone numbers, and document fonts.
            </p>

            <div className="space-y-[var(--section-gap)]">

              {/* Address Format */}
              <div className="border-t border-[var(--border-color)] mt-[var(--section-gap)] pt-[var(--section-gap)]">
                <h3 className="text-lg-d font-semibold mb-[var(--block-gap)] text-[var(--text-color)]">Address Format</h3>
                  <div className="space-y-[var(--block-gap)]">
                    {["usps", "full"].map((v) => (
                      <label key={v} className="flex items-center gap-[var(--block-gap)]">
                        <input
                          type="radio"
                          name="addressFormat"
                          value={v}
                          checked={companyAddressFormat === v}
                          onChange={() => setCompanyAddressFormat(v)}
                        />
                        <span>{v === "usps" ? "USPS Standard" : "Full Words"}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Address Case */}
                <div className="border-t border-[var(--border-color)] mt-[var(--section-gap)] pt-[var(--section-gap)]">
                <h3 className="text-lg-d font-semibold mb-[var(--block-gap)] text-[var(--text-color)]">Address Case</h3>
                  <div className="space-y-[var(--block-gap)]">
                    {["upper", "title"].map((v) => (
                      <label key={v} className="flex items-center gap-[var(--block-gap)]">
                        <input
                          type="radio"
                          name="addressCase"
                          value={v}
                          checked={companyAddressCase === v}
                          onChange={() => setCompanyAddressCase(v)}
                        />
                        <span>{v === "upper" ? "ALL CAPS" : "Upper / Lowercase"}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Name Format */}
                <div className="border-t border-[var(--border-color)] mt-[var(--section-gap)] pt-[var(--section-gap)]">
                <h3 className="text-lg-d font-semibold mb-[var(--block-gap)] text-[var(--text-color)]">Name Format</h3>
                  <div className="space-y-[var(--block-gap)]">
                    {["first-last", "last-first"].map((v) => (
                      <label key={v} className="flex items-center gap-[var(--block-gap)]">
                        <input
                          type="radio"
                          name="nameFormat"
                          value={v}
                          checked={companyNameFormat === v}
                          onChange={() => setCompanyNameFormat(v)}
                        />
                        <span>{v === "first-last" ? "First Last" : "Last, First"}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Name Case */}
                <div className="border-t border-[var(--border-color)] mt-[var(--section-gap)] pt-[var(--section-gap)]">
                  <h3 className="text-lg-d font-semibold mb-[var(--block-gap)] text-[var(--text-color)]">Name Case</h3>
                  <div className="space-y-[var(--block-gap)]">
                    {["upper", "title"].map((v) => (
                      <label key={v} className="flex items-center gap-[var(--block-gap)]">
                        <input
                          type="radio"
                          name="nameCase"
                          value={v}
                          checked={companyNameCase === v}
                          onChange={() => setCompanyNameCase(v)}
                        />
                        <span>{v === "upper" ? "ALL CAPS" : "Upper / Lowercase"}</span>
                      </label>
                    ))}
                  </div>
                </div>    
              </div>

              {/* Phone Format */}
              <div className="border-t border-[var(--border-color)] mt-[var(--section-gap)] pt-[var(--section-gap)]">
                <h3 className="text-lg-d font-semibold mb-[var(--block-gap)] text-[var(--text-color)]">Phone Format</h3>
                <div className="space-y-[var(--block-gap)]">
                  {["parentheses", "dashes"].map((v) => (
                    <label key={v} className="flex items-center gap-[var(--block-gap)]">
                      <input
                        type="radio"
                        name="phoneFormat"
                        value={v}
                        checked={companyPhoneFormat === v}
                        onChange={() => setCompanyPhoneFormat(v)}
                      />
                      <span>{v === "parentheses" ? "(###) ###-####" : "###-###-####"}</span>
                    </label>
                  ))}
                </div>

                {/* Document Font */}
                <div className="border-t border-[var(--border-color)] mt-[var(--section-gap)] pt-[var(--section-gap)]">
                  <h3 className="text-lg-d font-semibold mb-[var(--block-gap)] text-[var(--text-color)]">Document Font</h3>
                    {["inter", "roboto", "times", "georgia"].map((v) => (
                      <label key={v} className="flex items-center gap-[var(--block-gap)]">
                        <input
                          type="radio"
                          name="documentFont"
                          value={v}
                          checked={companyDocumentFont === v}
                          onChange={() => setCompanyDocumentFont(v)}
                        />
                        <span
                          style={{
                            fontFamily:
                              v === "times"
                                ? "Times New Roman"
                                : v === "source-sans"
                                ? "Source Sans Pro"
                                : v,
                          }}
                      >
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* SAVE BUTTON */}
              <div className="fixed bottom-0 left-0 right-0 bg-[var(--card-bg)] border-t border-[var(--border-color)] shadow-lg p-2 flex justify-end z-50">
              <button
                id="btn-formatting-save"
                onClick={async () => {
                  await saveCompanyPreferences();
                  showToast("Company formatting preferences saved!", "success");
                }}
                className="dashboard-btn dashboard-btn-primary mt-[var(--section-gap)]"
              >
                Save Formatting Preferences
              </button>

              {/* RESET BUTTON */}
              <button
                onClick={() => openResetModal("company")}
                className="dashboard-btn dashboard-btn-secondary mt-[var(--block-gap)] ml-[var(--block-gap)]"
              >
                Reset to Defaults
              </button>
              </div>
            </div>
        )}

        {/* ADMIN: Subscription & Billing */}
        {role === "admin" && activeTab === "billing" && (
          <div>
            <h2 className="text-xl-d font-semibold mb-[var(--block-gap)]">Subscription & Billing</h2>
            <p className="text-[var(--text-color)] mb-[var(--block-gap)]">
              View your subscription tier, job usage, and manage billing details.
            </p>

            <div className="space-y-3">
              <p className="text-[var(--text-color)]">Subscription Tier: <strong>Loading...</strong></p>
              <p className="text-[var(--text-color)]">Jobs Used This Cycle: <strong>Loading...</strong></p>
            </div>

            <button className="mt-[var(--section-gap)] px-[var(--btn-padding-x)] py-[var(--btn-padding-y)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-md hover:bg-[var(--btn-primary-hover)]">
              Manage Billing
            </button>
          </div>
        )}

        {/* ADMIN: User Management */}
        {role === "admin" && activeTab === "users" && (
          <div>
            <h2 className="text-xl-d font-semibold mb-[var(--block-gap)]">User Management</h2>
            <p className="text-[var(--text-color)] mb-[var(--block-gap)]">
              Add, remove, and update users for your company.
            </p>

            <Link
              href="/dashboard/users"
              className="px-[var(--btn-padding-x)] py-[var(--btn-padding-y)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-md hover:bg-[var(--btn-primary-hover)]"
            >
              Manage Users
            </Link>
          </div>
        )}

        {/* BOTH: My Account */}
        {activeTab === "account" && (
          <div>
            <h2 className="text-xl-d font-semibold mb-[var(--block-gap)]">My Account</h2>
            <p className="text-[var(--text-color)] mb-[var(--block-gap)]">
              Update your personal information and login details.
            </p>

            <Link
              href={`/dashboard/users/${session?.user?.id}/edit`}
              className="px-[var(--btn-padding-x)] py-[var(--btn-padding-y)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-md hover:bg-[var(--btn-primary-hover)]"
            >
              Edit My Account
            </Link>
          </div>
        )}

        {/* BOTH: User Preferences */}
        {activeTab === "userprefs" && (
        <div className="border-t border-[var(--border-color)] mt-[var(--section-gap)] pt-[var(--section-gap)]">
          <h3 className="text-lg-d font-semibold mb-[var(--block-gap)] text-[var(--text-color)]">User Preferences</h3>
            <p className="text-[var(--text-color)] mb-[var(--block-gap)]">
              Customize your personal UI experience.
            </p>

            <div className="space-y-[var(--section-gap)]">

              {/* Theme */}
              <div className="border-t border-[var(--border-color)] mt-[var(--section-gap)] pt-[var(--section-gap)]">
                <h3 className="text-lg-d font-semibold mb-[var(--block-gap)] text-[var(--text-color)]">Theme</h3>
                <div className="space-y-[var(--block-gap)]">
                  {["light", "dark"].map((v) => (
                    <label key={v} className="flex items-center gap-[var(--block-gap)]">
                      <input
                        type="radio"
                        name="theme"
                        value={v}
                        checked={userTheme === v}
                        onChange={() => setUserTheme(v)}
                      />
                      <span>{v === "light" ? "Light" : "Dark"}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* UI Font */}
              <div className="border-t border-[var(--border-color)] mt-[var(--section-gap)] pt-[var(--section-gap)]">
                <h3 className="text-lg-d font-semibold mb-[var(--block-gap)] text-[var(--text-color)]">UI Font</h3>
                <div className="space-y-[var(--block-gap)]">
                  {["inter", "roboto", "system-ui", "georgia", "source-sans"].map((v) => (
                    <label key={v} className="flex items-center gap-[var(--block-gap)]">
                      <input
                        type="radio"
                        name="uiFont"
                        value={v}
                        checked={userFont === v}
                        onChange={() => setUserFont(v)}
                      />
                      <span
                        style={{
                          fontFamily:
                            v === "times"
                              ? "Times New Roman"
                              : v === "source-sans"
                              ? "Source Sans Pro"
                              : v,
                        }}
                      >
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Density */}
              <div className="border-t border-[var(--border-color)] mt-[var(--section-gap)] pt-[var(--section-gap)]">
                <h3 className="text-lg-d font-semibold mb-[var(--block-gap)] text-[var(--text-color)]">UI Density</h3>
                <div className="space-y-[var(--block-gap)]">
                  {["comfortable", "compact"].map((v) => (
                    <label key={v} className="flex items-center gap-[var(--block-gap)]">
                      <input
                        type="radio"
                        name="density"
                        value={v}
                        checked={userDensity === v}
                        onChange={() => setUserDensity(v)}
                      />
                      <span>{v === "comfortable" ? "Comfortable" : "Compact"}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tutorial Preferences */}
              <div className="border-t border-[var(--border-color)] mt-[var(--section-gap)] pt-[var(--section-gap)]">
                <h3 className="text-lg-d font-semibold mb-[var(--block-gap)] text-[var(--text-color)]">
                  Tutorial Preferences
                </h3>

                <p className="text-[var(--text-color)] mb-[var(--block-gap)]">
                  Manage your onboarding tutorial settings.
                </p>

                {/* Toggle Tutorial */}
                <div className="flex items-center justify-between mb-[var(--section-gap)]">
                  <span className="text-[var(--text-color)]">Tutorial Enabled</span>
                  <button
                    onClick={() => toggleTutorialEnabled()}
                    className={`px-4 py-2 rounded-md font-medium ${
                      tutorialEnabled ? "bg-green-600 text-white" : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {tutorialEnabled ? "On" : "Off"}
                  </button>
                </div>

                {/* Stacked tutorial sections */}
                <div className="flex flex-col items-start gap-[var(--block-gap)]">
                  {role === "admin" && (
                    <>
                      <button
                        onClick={() => restartSection("company-setup")}
                        className="dashboard-btn dashboard-btn-secondary w-auto min-w-[16rem]"
                      >
                        Restart Company Setup Tutorial
                      </button>

                      <button
                        onClick={() => restartSection("user-management")}
                        className="dashboard-btn dashboard-btn-secondary w-auto min-w-[16rem]"
                      >
                        Restart User Management Tutorial
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => restartSection("job-flow")}
                    className="dashboard-btn dashboard-btn-secondary w-auto min-w-[16rem]"
                  >
                    Restart Job Tutorial
                  </button>
                </div>
              </div>

              {/* SAVE BUTTON */}
              <div className="fixed bottom-0 left-0 right-0 bg-[var(--card-bg)] border-t border-[var(--border-color)] shadow-lg p-2 flex justify-end z-50">
              <button
                onClick={async () => {
                  await saveUserPreferences();
                  showToast("User preferences saved!", "success");
                }}
                className="dashboard-btn dashboard-btn-primary mt-[var(--section-gap)]"
              >
                Save User Preferences
              </button>

              {/* RESET BUTTON */}
              <button
                onClick={() => openResetModal("user")}
                className="dashboard-btn dashboard-btn-secondary mt-[var(--block-gap)] ml-[var(--block-gap)]"
              >
                Reset to Defaults
              </button>
              </div>
            </div>
          </div>
        )}

        {/* BOTH: Support */}
        {activeTab === "support" && (
          <div>
            <h2 className="text-xl-d font-semibold mb-[var(--block-gap)]">Support</h2>
            <p className="text-[var(--text-color)] mb-[var(--block-gap)]">
              Contact support or submit a request for help.
            </p>

            <button className="px-[var(--btn-padding-x)] py-[var(--btn-padding-y)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-md hover:bg-[var(--btn-secondary-hover)]">
              Contact Support
            </button>
          </div>
        )}
      </div>
      {/* RESET CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-lg shadow-lg p-[var(--section-gap)] w-full max-w-md">
            <h3 className="text-xl-d font-semibold mb-[var(--block-gap)]">Reset Preferences</h3>
            <p className="text-[var(--text-color)] mb-[var(--section-gap)]">
              Are you sure you want to reset all{" "}
              {resetTarget === "company" ? "company formatting" : "user"} preferences to defaults?
            </p>

            <div className="flex justify-end gap-[var(--block-gap)]">
              <button
                onClick={closeResetModal}
                className="px-[var(--btn-padding-x)] py-[var(--btn-padding-y)] bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] rounded hover:bg-[var(--btn-secondary-hover)]"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  if (resetTarget === "company") {
                    await resetCompanyPreferences();
                  } else if (resetTarget === "user") {
                    await resetUserPreferences();
                  }
                  closeResetModal();
                }}
                className="px-[var(--btn-padding-x)] py-[var(--btn-padding-y)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded hover:bg-[var(--btn-primary-hover)]"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
      {/* TOAST */}
      {toast && (
        <div
          className={`
            fixed bottom-6 right-6 px-[var(--btn-padding-x)] py-[var(--btn-padding-y)] rounded shadow-lg 
            bg-[var(--card-bg)] 
            text-sm-d-d font-medium
            ${toast.type === "success" ? "text-green-600" : "text-red-600"}
          `}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}