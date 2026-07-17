"use client";

import { useState } from "react";
import FolderBrowserPanel from "@/app/components/FolderBrowserPanel";

interface JobCreateClientProps {
  companyId: string;
  defaultDescription: string;
  createJob: (formData: FormData) => Promise<void>;
}

export default function JobCreateClient({
  companyId,
  defaultDescription,
  createJob,
}: JobCreateClientProps) {
  const [showBrowser, setShowBrowser] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  const handleSelectFile = (paths: string[]) => {
    const path = paths[0];
    if (!path) return;
  
    const safePath = path.replace(/\\/g, "/");
  
    setSelectedTemplates((prev) =>
      prev.includes(safePath) ? prev : [...prev, safePath]
    );
  
    setShowBrowser(false);
  };  

  const handleRemoveTemplate = (path: string) => {
    setSelectedTemplates((prev) => prev.filter((p) => p !== path));
  };

  return (
    <div className="space-y-4 card p-6">
      <form action={createJob} className="space-y-4" encType="multipart/form-data">
        <input type="hidden" name="company_id" value={companyId} />
        <input type="hidden" name="description" value={defaultDescription} />

        {/* Hidden field with selected template paths */}
        <input
          type="hidden"
          name="template_paths"
          value={JSON.stringify(selectedTemplates)}
        />

        <h2 className="text-lg font-semibold mt-6">Customer Information</h2>

        <div>
          <label className="block text-sm font-medium">Customer Name</label>
          <input name="customer_name" className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium">Customer Phone</label>
          <input name="customer_phone" className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium">Customer Email</label>
          <input name="customer_email" className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium">Full Address</label>
          <textarea name="customer_address_full" className="input" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">City</label>
            <input name="customer_address_city" className="input" />
          </div>

          <div>
            <label className="block text-sm font-medium">State</label>
            <input name="customer_address_state" className="input" />
          </div>

          <div>
            <label className="block text-sm font-medium">Zip</label>
            <input name="customer_address_zip" className="input" />
          </div>
        </div>

        <h2 className="text-lg font-semibold mt-6">Legal Description</h2>

        <div>
          <label className="block text-sm font-medium">Legal Description</label>
          <textarea name="legal_description" className="input" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Lot</label>
            <input name="lot" className="input" />
          </div>

          <div>
            <label className="block text-sm font-medium">Block</label>
            <input name="block" className="input" />
          </div>

          <div>
            <label className="block text-sm font-medium">Subdivision</label>
            <input name="subdivision" className="input" />
          </div>
        </div>

        <h2 className="text-lg font-semibold mt-6">Job Details</h2>

        <div>
          <label className="block text-sm font-medium">Tax Folio</label>
          <input name="customer_tax_folio" className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium">Job Price</label>
          <input
            name="job_price"
            type="number"
            step="0.01"
            className="input"
          />
        </div>

        {/* Template selection UI */}
        <h2 className="text-lg font-semibold mt-6">Templates</h2>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setShowBrowser(true)}
        >
          Add Template
        </button>

        {selectedTemplates.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">Selected Templates:</p>
            <ul className="space-y-1">
              {selectedTemplates.map((path) => (
                <li
                  key={path}
                  className="flex items-center justify-between text-sm bg-gray-50 px-3 py-1 rounded"
                >
                  <span className="break-all">{path}</span>
                  <button
                    type="button"
                    className="text-red-600 text-xs font-semibold"
                    onClick={() => handleRemoveTemplate(path)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button className="btn btn-primary mt-6" type="submit">
          Create Job
        </button>
      </form>

      {showBrowser && (
        <FolderBrowserPanel
          mode="master"
          onClose={() => setShowBrowser(false)}
          onSelectFile={handleSelectFile}
        />
      )}
    </div>
  );
}
