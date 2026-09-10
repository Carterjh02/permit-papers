"use client";

import { useState } from "react";

interface CompanyForView {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    website: string | null;
  
    address: string | null;
    addressStreet: string | null;
    addressCity: string | null;
    addressState: string | null;
    addressZip: string | null;
  
    licenseNumber: string | null;
    qualifierName: string | null;
    descOfImprov: string | null;
    businessTaxReceipt: string | null;
  
    roofingLicenseNumber: string | null;
    roofingQualifierName: string | null;
    roofingDescOfImprov: string | null;
    roofingBusinessTaxReceipt: string | null;

    mechanicalLicenseNumber: string | null;
    mechanicalQualifierName: string | null;
    mechanicalDescOfImprov: string | null;

    electricLicenseNumber: string | null;
    electricQualifierName: string | null;
    electricDescOfImprov: string | null;
  
    logoUrl: string | null;
    companyCode: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  function ContractorTabsView({ company }: { company: CompanyForView }) {
  const tabs = [
    { id: "windowdoor", label: "Window / Door Contractor" },
    { id: "roofing", label: "Roofing Contractor" },
    { id: "mechanical", label: "Mechanical Contractor" },
    { id: "electric", label: "Electrical Contractor" },
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
            <Info label="Window / Door License Number" value={company.licenseNumber} />
            <Info label="Window / Door Qualifier Name" value={company.qualifierName} />
            <Info label="Window / Door Description of Improvement" value={company.descOfImprov} />
          </>
        )}

        {activeTab === "roofing" && (
          <>
            <Info label="Roofing License Number" value={company.roofingLicenseNumber} />
            <Info label="Roofing Qualifier Name" value={company.roofingQualifierName} />
            <Info label="Roofing Description of Improvement" value={company.roofingDescOfImprov} />
          </>
        )}

        {activeTab === "mechanical" && (
          <>
            <Info label="Mechanical License Number" value={company.mechanicalLicenseNumber} />
            <Info label="Mechanical Qualifier Name" value={company.mechanicalQualifierName} />
            <Info label="Mechanical Description of Improvement" value={company.mechanicalDescOfImprov} />
          </>
        )}

        {activeTab === "electric" && (
          <>
            <Info label="Electrical License Number" value={company.electricLicenseNumber} />
            <Info label="Electrical Qualifier Name" value={company.electricQualifierName} />
            <Info label="Electrical Description of Improvement" value={company.electricDescOfImprov} />
          </>
        )}
      </div>
    </div>
  );
}

/*  Add this missing component */
function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <label className="block text-sm-d font-medium text-[var(--text-color)] opacity-80">
        {label}
      </label>
      <p className="text-[var(--text-color)]">{value || "—"}</p>
    </div>
  );
}

export default ContractorTabsView;
