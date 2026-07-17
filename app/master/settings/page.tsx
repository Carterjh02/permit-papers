"use client";

import Link from "next/link";
import { useState } from "react";

export default function MasterSettingsPage() {
  const [activeTab, setActiveTab] = useState("subscription");

  const tabs = [
    { id: "subscription", label: "Subscription Manager" },
    { id: "templates", label: "Template Manager" },
    { id: "features", label: "Feature Toggles" },
    { id: "demo", label: "Demo Accounts" },
    { id: "companies", label: "Company Overview" },
    { id: "logs", label: "System Logs" },
    { id: "branding", label: "Branding & UI" },
    { id: "support", label: "Support Inbox" },
  ];

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

        {activeTab === "branding" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Branding & UI</h2>
            <p className="text-gray-600">
              Update logos, accent colors, and footer text.
            </p>
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
