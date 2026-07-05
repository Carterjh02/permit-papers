"use client";

import { useState } from "react";
import FolderBrowserPanel from "@/app/components/FolderBrowserPanel";
import { useToast } from "@/app/components/ToastProvider";
import Image from "next/image";

type JobFormMode = "create" | "edit";

interface JobFormClientProps {
  mode: JobFormMode;
  jobId?: string;

  initialJob?: {
    customerName?: string | null;
    customerPhone?: string | null;
    customerEmail?: string | null;
    customerAddress?: string | null;
    customerCity?: string | null;
    customerState?: string | null;
    customerZip?: string | null;
    legalDescription?: string | null;
    subdivision?: string | null;
    taxFolioNumber?: string | null;
    jobValue?: number | null;
    description?: string | null;
    snippetPath?: string | null;
    companyId?: string;
    createdBy?: string;
  };

  initialTemplates: {
    id: string;
    templateName: string;
    templatePath: string;
  }[];

  onSave: (formData: FormData) => Promise<void>;
  onAddTemplate?: (path: string) => Promise<void> | void;
  onRemoveTemplate?: (jobDocumentId: string) => Promise<void> | void;

  onCreateMinimalJob: (
    companyId: string,
    createdBy: string
  ) => Promise<{ id: string }>;

  onUploadSnippet: (
    jobId: string,
    file: File
  ) => Promise<{ publicUrl: string }>;
}

export default function JobFormClient({
  mode,
  jobId,
  initialJob,
  initialTemplates,
  onSave,
  onAddTemplate,
  onRemoveTemplate,
  onCreateMinimalJob,
  onUploadSnippet,
}: JobFormClientProps) {
  const { showToast } = useToast();

  /* ---------------------------------------------------------
     LOCAL JOB ID (supports new jobs)
  --------------------------------------------------------- */
  const [localJobId, setLocalJobId] = useState(jobId ?? null);

  const ensureJobExists = async () => {
    if (localJobId) return localJobId;

    if (!initialJob?.companyId || !initialJob?.createdBy) {
      throw new Error("Missing companyId or createdBy for minimal job creation.");
    }

    const newJob = await onCreateMinimalJob(
      initialJob.companyId,
      initialJob.createdBy
    );

    setLocalJobId(newJob.id);
    return newJob.id;
  };

  /* ---------------------------------------------------------
     UI STATE
  --------------------------------------------------------- */
  const [showBrowser, setShowBrowser] = useState(false);
  const [templates, setTemplates] = useState(initialTemplates);

  const [snippetUrl, setSnippetUrl] = useState<string | null>(
    initialJob?.snippetPath
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/companies/${initialJob.snippetPath}`
      : null
  );

  /* ---------------------------------------------------------
     PRICE FIELD (controlled)
  --------------------------------------------------------- */
  const [jobPrice, setJobPrice] = useState(
    initialJob?.jobValue != null
      ? new Intl.NumberFormat("en-US").format(initialJob.jobValue)
      : ""
  );

  const formatWithCommas = (value: string) => {
    const numeric = value.replace(/[^\d.]/g, "");
    if (!numeric) return "";
    const parts = numeric.split(".");
    parts[0] = Number(parts[0]).toLocaleString("en-US");
    return parts.join(".");
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setJobPrice(formatWithCommas(raw));
  };

  /* ---------------------------------------------------------
     SNIPPET UPLOAD
  --------------------------------------------------------- */
  const handleSnippetUpload = async (file: File | null) => {
    if (!file) return;

    try {
      const id = await ensureJobExists();

      showToast(
        <div className="text-sm font-medium text-gray-700">
          Uploading snippet…
        </div>
      );

      const { publicUrl } = await onUploadSnippet(id, file);
      setSnippetUrl(publicUrl);

      showToast(
        <div className="text-sm font-medium text-green-700">
          Snippet uploaded successfully.
        </div>
      );
    } catch (err) {
      console.error(err);
      showToast(
        <div className="text-sm font-medium text-red-700">
          Failed to upload snippet.
        </div>
      );
    }
  };

  /* ---------------------------------------------------------
     TEMPLATE SELECTION
  --------------------------------------------------------- */
  const handleSelectTemplate = async (path: string) => {
    const cleanPath = path.replace(/\\/g, "/");
  
    await ensureJobExists(); // no unused variable
  
    if (onAddTemplate) await onAddTemplate(cleanPath);
  
    setTemplates((prev) => {
      if (prev.some((t) => t.templatePath === cleanPath)) return prev;
  
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          templateName: cleanPath.split("/").slice(-1)[0] || cleanPath,
          templatePath: cleanPath,
        },
      ];
    });
  
    setShowBrowser(false);
  };  

  const handleRemove = async (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);

    if (onRemoveTemplate && template) {
      await onRemoveTemplate(templateId);
    }

    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
  };

  /* ---------------------------------------------------------
     RENDER
  --------------------------------------------------------- */
  return (
    <div className="grid grid-cols-[2fr,1fr] gap-6">
      {/* ⭐ FORM BINDS SERVER ACTION DIRECTLY */}
      <form className="space-y-6 card p-6">
        {/* Hidden fields required for server action */}
        <input
          type="hidden"
          name="job_price"
          value={jobPrice.replace(/,/g, "")}
        />
        <input
          type="hidden"
          name="template_paths"
          value={JSON.stringify(templates.map((t) => t.templatePath))}
        />
        {localJobId && (
          <input type="hidden" name="job_id" value={localJobId} />
        )}
        {initialJob?.companyId && (
          <input type="hidden" name="company_id" value={initialJob.companyId} />
        )}
        <input
          type="hidden"
          name="description"
          value={initialJob?.description ?? ""}
        />

        {/* ---------------------------------------------------------
           SNIPPET UPLOAD
        --------------------------------------------------------- */}
        <div className="space-y-3 pb-4 border-b">
          <h3 className="text-md font-semibold">Snippet Upload</h3>

          <div className="flex flex-col gap-3">
            <label className="block text-sm font-medium">
              Upload Customer Snippet (PNG/JPEG)
            </label>

            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={(e) => {
                const file = e.target.files ? e.target.files[0] : null;
                handleSnippetUpload(file);
              }}
              className="file-input file-input-bordered w-full"
            />

            {snippetUrl && (
              <div className="mt-2">
                <Image
                  src={snippetUrl}
                  alt="Snippet Preview"
                  width={300}
                  height={200}
                  className="rounded border object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* ---------------------------------------------------------
           CUSTOMER INFORMATION
        --------------------------------------------------------- */}
        <div className="space-y-4 pt-2">
          <h3 className="text-md font-semibold">Customer Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Customer Name</label>
              <input
                name="customer_name"
                className="input input-bordered"
                defaultValue={initialJob?.customerName ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Customer Phone</label>
              <input
                name="customer_phone"
                className="input input-bordered"
                defaultValue={initialJob?.customerPhone ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-sm font-medium">Customer Email</label>
              <input
                name="customer_email"
                className="input input-bordered"
                defaultValue={initialJob?.customerEmail ?? ""}
              />
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------
           PROPERTY LOCATION
        --------------------------------------------------------- */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-md font-semibold">Property Location</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-sm font-medium">Street Address</label>
              <input
                name="customer_address_full"
                className="input input-bordered"
                defaultValue={initialJob?.customerAddress ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">City</label>
              <input
                name="customer_address_city"
                className="input input-bordered"
                defaultValue={initialJob?.customerCity ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">State</label>
              <input
                name="customer_address_state"
                className="input input-bordered"
                defaultValue={initialJob?.customerState ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">ZIP</label>
              <input
                name="customer_address_zip"
                className="input input-bordered"
                defaultValue={initialJob?.customerZip ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Subdivision</label>
              <input
                name="subdivision"
                className="input input-bordered"
                defaultValue={initialJob?.subdivision ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Tax/Folio Number</label>
              <input
                name="customer_tax_folio"
                className="input input-bordered"
                defaultValue={initialJob?.taxFolioNumber ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-sm font-medium">Legal Description</label>
              <textarea
                name="legal_description"
                className="textarea textarea-bordered"
                defaultValue={initialJob?.legalDescription ?? ""}
              />
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------
           JOB DESCRIPTION
        --------------------------------------------------------- */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-md font-semibold">Job Description</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Job Value</label>
              <input
                name="job_price_display"
                inputMode="decimal"
                className="input input-bordered"
                value={jobPrice}
                onChange={handlePriceChange}
              />
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-sm font-medium">
                Description of Improvement
              </label>
              <textarea
                name="desc_of_improvement"
                className="textarea textarea-bordered"
                defaultValue={initialJob?.description ?? ""}
              />
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------
           SAVE BUTTON (server action bound here)
        --------------------------------------------------------- */}
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            className="btn btn-primary"
            formAction={onSave}
          >
            {mode === "create" ? "Save & Preview" : "Update & Preview"}
          </button>
        </div>
      </form>

      {/* ---------------------------------------------------------
         TEMPLATE SIDE PANEL
      --------------------------------------------------------- */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Documents</h2>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowBrowser(true)}
          >
            Add Document
          </button>
        </div>

        {templates.length === 0 && (
          <p className="text-sm text-gray-500">
            No documents added yet. Use “Add Document” to select templates.
          </p>
        )}

        {templates.length > 0 && (
          <ul className="space-y-2">
            {templates.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded"
              >
                <span className="font-medium">{t.templateName}</span>
                <button
                  type="button"
                  className="text-red-600 text-xs font-semibold"
                  onClick={() => handleRemove(t.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showBrowser && (
        <FolderBrowserPanel
          mode="job"
          initialPath="templates"
          onClose={() => setShowBrowser(false)}
          onSelectFile={handleSelectTemplate}
        />
      )}
    </div>
  );
}
