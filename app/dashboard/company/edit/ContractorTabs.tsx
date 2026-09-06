"use client";

import { useState } from "react";

interface FullFormData {
  name: string;
  email: string;
  phone: string;
  website: string;

  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;

  licenseNumber: string;
  qualifierName: string;
  descOfImprov: string;
  businessTaxReceipt: string;

  roofingLicenseNumber: string;
  roofingQualifierName: string;
  roofingDescOfImprov: string;
  roofingBusinessTaxReceipt: string;

  logo: File | null;
}

interface ContractorTabsProps {
  formData: FullFormData;
  setFormData: React.Dispatch<React.SetStateAction<FullFormData>>;
}

export default function ContractorTabs({ formData, setFormData }: ContractorTabsProps) {
  const tabs = [
    { id: "windowdoor", label: "Window / Door Contractor" },
    { id: "roofing", label: "Roofing Contractor" },
  ];

  const [activeTab, setActiveTab] = useState("windowdoor");

  return (
    <div className="space-y-[var(--section-gap)]">
      {/* Tabs */}
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

      {/* Content */}
      <div className="space-y-[var(--block-gap)]">
        {activeTab === "windowdoor" && (
          <>
            <Input
              label="License Number"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={(e) =>
                setFormData({ ...formData, licenseNumber: e.target.value })
              }
            />

            <Input
              label="Qualifier Name"
              name="qualifierName"
              value={formData.qualifierName}
              onChange={(e) =>
                setFormData({ ...formData, qualifierName: e.target.value })
              }
            />

            <Textarea
              label="Description of Improvement"
              name="descOfImprov"
              value={formData.descOfImprov}
              onChange={(e) =>
                setFormData({ ...formData, descOfImprov: e.target.value })
              }
            />
          </>
        )}

        {activeTab === "roofing" && (
          <>
            <Input
              label="Roofing License Number"
              name="roofingLicenseNumber"
              value={formData.roofingLicenseNumber}
              onChange={(e) =>
                setFormData({ ...formData, roofingLicenseNumber: e.target.value })
              }
            />

            <Input
              label="Roofing Qualifier Name"
              name="roofingQualifierName"
              value={formData.roofingQualifierName}
              onChange={(e) =>
                setFormData({ ...formData, roofingQualifierName: e.target.value })
              }
            />

            <Textarea
              label="Roofing Description of Improvement"
              name="roofingDescOfImprov"
              value={formData.roofingDescOfImprov}
              onChange={(e) =>
                setFormData({ ...formData, roofingDescOfImprov: e.target.value })
              }
            />
          </>
        )}
      </div>
    </div>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="block text-sm-d font-medium text-[var(--text-color)] opacity-80">
        {label}
      </label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        className="input bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
      />
    </div>
  );
}

function Textarea({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div>
      <label className="block text-sm-d font-medium text-[var(--text-color)] opacity-80">
        {label}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        className="input bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
        rows={4}
      />
    </div>
  );
}
