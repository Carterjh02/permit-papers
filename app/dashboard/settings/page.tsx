"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function DashboardSettingsPage() {
  const { data: session } = useSession();

  const role = session?.user?.role === "admin" ? "admin" : "user";

  // Initial tab based on role
  const initialTab = role === "admin" ? "company" : "account";
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <p className="text-gray-600">Loading settings...</p>
      </div>
    );
  }

  const adminTabs = [
    { id: "company", label: "Company Profile" },
    { id: "billing", label: "Subscription & Billing" },
    { id: "users", label: "User Management" },
    { id: "account", label: "My Account" },
    { id: "support", label: "Support" },
  ];

  const userTabs = [
    { id: "account", label: "My Account" },
    { id: "support", label: "Support" },
  ];

  const tabs = role === "admin" ? adminTabs : userTabs;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="text-gray-600">
        Manage your account, company information, and support preferences.
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

        {/* ADMIN: Company Profile */}
        {role === "admin" && activeTab === "company" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Company Profile</h2>
            <p className="text-gray-600 mb-4">
              Update your company information, licenses, and contact details.
            </p>

            <Link
              href="/dashboard/company"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit Company Information
            </Link>
          </div>
        )}

        {/* ADMIN: Subscription & Billing */}
        {role === "admin" && activeTab === "billing" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Subscription & Billing</h2>
            <p className="text-gray-600 mb-4">
              View your subscription tier, job usage, and manage billing details.
            </p>

            <div className="space-y-3">
              <p className="text-gray-700">Subscription Tier: <strong>Loading...</strong></p>
              <p className="text-gray-700">Jobs Used This Cycle: <strong>Loading...</strong></p>
            </div>

            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Manage Billing
            </button>
          </div>
        )}

        {/* ADMIN: User Management */}
        {role === "admin" && activeTab === "users" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            <p className="text-gray-600 mb-4">
              Add, remove, and update users for your company.
            </p>

            <Link
              href="/dashboard/users"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Manage Users
            </Link>
          </div>
        )}

        {/* BOTH: My Account */}
        {activeTab === "account" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">My Account</h2>
            <p className="text-gray-600 mb-4">
              Update your personal information and login details.
            </p>

            <Link
              href={`/dashboard/users/${session?.user?.id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit My Account
            </Link>
          </div>
        )}

        {/* BOTH: Support */}
        {activeTab === "support" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Support</h2>
            <p className="text-gray-600 mb-4">
              Contact support or submit a request for help.
            </p>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Contact Support
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
