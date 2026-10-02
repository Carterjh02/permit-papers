"use client";

import { useState } from "react";

interface JobTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function JobTabs({ activeTab, setActiveTab }: JobTabsProps) {
  const tabs = [
    { id: "windowdoor", label: "Window / Door" },
    { id: "roofing", label: "Roofing" },
    { id: "mechanical", label: "Mechanical" },
    { id: "electric", label: "Electrical" },
  ];

  return (
    <div className="flex flex-wrap gap-[var(--block-gap)] border-b border-[var(--border-color)] pb-[var(--section-gap)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id)}
          className={`px-[var(--btn-padding-x)] py-[var(--btn-padding-y)] rounded-md text-sm-d-d font-medium ${
            activeTab === tab.id
              ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]"
              : "bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover)]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
