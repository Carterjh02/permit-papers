"use client";

import { useState } from "react";
import Image from "next/image";
import ContractorTabs from "./ContractorTabs";
import { formatCompanyFields } from "@/lib/utils/formatters";

interface LoadedPrefs {
  userPrefs: Record<string, unknown> | null;
  companyPrefs: Record<string, unknown> | null;
}

interface CompanyForEdit {
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

    companyContactName: string | null;
    companyContactPhone: string | null;
    companyContactEmail: string | null;
  
    logoUrl: string | null;
    companyCode: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  interface Props {
    company: CompanyForEdit;
    prefs: LoadedPrefs;
  }

export default function EditCompanyClient({ company, prefs }: Props) {
  const [formData, setFormData] = useState({
    name: company.name ?? "",
    email: company.email ?? "",
    phone: company.phone ?? "",
    website: company.website ?? "",

    addressStreet: company.addressStreet ?? "",
    addressCity: company.addressCity ?? "",
    addressState: company.addressState ?? "",
    addressZip: company.addressZip ?? "",

    // Window / Door Contractor
    licenseNumber: company.licenseNumber ?? "",
    qualifierName: company.qualifierName ?? "",
    descOfImprov: company.descOfImprov ?? "",
    businessTaxReceipt: company.businessTaxReceipt ?? "",

    // Roofing Contractor
    roofingLicenseNumber: company.roofingLicenseNumber ?? "",
    roofingQualifierName: company.roofingQualifierName ?? "",
    roofingDescOfImprov: company.roofingDescOfImprov ?? "",
    roofingBusinessTaxReceipt: company.roofingBusinessTaxReceipt ?? "",

    mechanicalLicenseNumber: company.mechanicalLicenseNumber ?? "",
    mechanicalQualifierName: company.mechanicalQualifierName ?? "",
    mechanicalDescOfImprov: company.mechanicalDescOfImprov ?? "",

    electricLicenseNumber: company.electricLicenseNumber ?? "",
    electricQualifierName: company.electricQualifierName ?? "",
    electricDescOfImprov: company.electricDescOfImprov ?? "",

    companyContactName: company.companyContactName ?? "",
    companyContactPhone: company.companyContactPhone ?? "",
    companyContactEmail: company.companyContactEmail ?? "",

    // Logo file
    logo: null as File | null,
  });

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formatted = formatCompanyFields(formData, {
        addressFormat: (prefs.companyPrefs?.defaultAddressFormat as "usps" | "full") ?? "usps",
        addressCase: (prefs.companyPrefs?.defaultAddressCase as "title" | "upper") ?? "title",
        nameFormat: (prefs.companyPrefs?.defaultNameFormat as "first-last" | "last-first") ?? "first-last",
        nameCase: (prefs.companyPrefs?.defaultNameCase as "title" | "upper") ?? "title",
        phoneFormat: (prefs.companyPrefs?.defaultPhoneFormat as "parentheses" | "dashes") ?? "parentheses",
        documentFont: (prefs.companyPrefs?.defaultDocumentFont as "inter" | "roboto" | "times" | "georgia") ?? "inter",
      });

    const res = await fetch("/api/company/update", {
      method: "POST",
      body: JSON.stringify(formatted),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      window.location.href = "/dashboard/company";
    }
  }

  return (
    <div className="page-container space-y-[var(--section-gap)]">
      <h1 className="text-2xl-d font-bold">Edit Company Info</h1>

      <form onSubmit={handleSave} className="space-y-[var(--section-gap)]">
        <Section title="Company Info" id="company-info-section">
          {company.logoUrl && (
            <div className="mb-[var(--block-gap)]">
              <p className="text-sm-d font-medium text-gray-800 mb-[calc(var(--block-gap)*0.5)]">
                Current Logo
              </p>
              <Image
                src={company.logoUrl}
                alt="Company Logo"
                width={200}
                height={200}
                className="h-[calc(var(--row-height)*2)] w-auto rounded border object-contain"
              />
            </div>
          )}

          <InputFile
            label="Upload New Logo"
            name="logo"
            onChange={(file) => setFormData({ ...formData, logo: file })}
          />

          <Input
            label="Company Name"
            name="name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
          />
          <Input
            label="Business Tax Receipt Number"
            name="businessTaxReceipt"
            value={formData.businessTaxReceipt}
            onChange={(e) =>
              setFormData({ ...formData, businessTaxReceipt: e.target.value })
              }
            />

          <Input
            label="Email"
            name="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />

          <Input
            label="Website"
            name="website"
            value={formData.website}
            onChange={(e) =>
              setFormData({ ...formData, website: e.target.value })
            }
          />
        </Section>

        <Section title="Address Info" id="company-address-section">
          <Input
            label="Street"
            name="addressStreet"
            value={formData.addressStreet}
            onChange={(e) =>
              setFormData({ ...formData, addressStreet: e.target.value })
            }
          />

          <Input
            label="City"
            name="addressCity"
            value={formData.addressCity}
            onChange={(e) =>
              setFormData({ ...formData, addressCity: e.target.value })
            }
          />

          <Input
            label="State"
            name="addressState"
            value={formData.addressState}
            onChange={(e) =>
              setFormData({ ...formData, addressState: e.target.value })
            }
          />

          <Input
            label="Zip"
            name="addressZip"
            value={formData.addressZip}
            onChange={(e) =>
              setFormData({ ...formData, addressZip: e.target.value })
            }
          />
        </Section>

        <Section title="Company Contact" id="company-contact-section">
          <Input
            label="Contact Name"
            name="companyContactName"
            value={formData.companyContactName}
            onChange={(e) =>
              setFormData({ ...formData, companyContactName: e.target.value })
            }
          />

          <Input
            label="Contact Phone"
            name="companyContactPhone"
            value={formData.companyContactPhone}
            onChange={(e) =>
              setFormData({ ...formData, companyContactPhone: e.target.value })
            }
          />

          <Input
           label="Contact Email"
            name="companyContactEmail"
            value={formData.companyContactEmail}
            onChange={(e) =>
              setFormData({ ...formData, companyContactEmail: e.target.value })
            }
          />
        </Section>

        <Section title="Contractor Info" id="company-contractor-section">
          <ContractorTabs formData={formData} setFormData={setFormData} />
        </Section>

        <div className="fixed bottom-0 left-0 right-0 bg-[var(--card-bg)] border-t border-[var(--border-color)] shadow-lg p-2 flex justify-end z-50">
          <button
            className="btn btn-primary py-[var(--btn-padding-y)] px-[var(--btn-padding-x)]"
            type="submit"
            id="btn-company-save"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

/* Shared components */

function Section({
  title,
  children,
  id,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div
      id={id}
      className="p-[var(--section-gap)] space-y-[var(--block-gap)] bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-sm"
    >
      <h2 className="text-lg-d font-semibold text-[var(--text-color)] border-b border-[var(--border-color)] pb-2">
        {title}
      </h2>
      <div className="space-y-[var(--block-gap)]">{children}</div>
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

function InputFile({
  label,
  name,
  onChange,
}: {
  label: string;
  name: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <div>
      <label className="block text-sm-d font-medium text-[var(--text-color)] opacity-80">
        {label}
      </label>
      <input
        type="file"
        name={name}
        accept="image/*"
        className="input bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}