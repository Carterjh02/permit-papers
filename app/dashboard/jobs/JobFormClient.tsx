"use client";

import { useState, useRef } from "react";
import FolderBrowserPanel from "@/app/components/FolderBrowserPanel";
import { useToast } from "@/app/components/ToastProvider";
import Image from "next/image";

/* ---------------------------------------------------------
   EditableField
--------------------------------------------------------- */
type JobFormState = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address_full: string;
  customer_address_city: string;
  customer_address_state: string;
  customer_address_zip: string;
  subdivision: string;
  customer_tax_folio: string;
  legal_description: string;
};

const EditableField = ({
  label,
  ocrValue,
  name,
  form,
  setForm,
}: {
  label: string;
  ocrValue?: string;
  name: keyof JobFormState;
  form: JobFormState;
  setForm: React.Dispatch<React.SetStateAction<JobFormState>>;
}) => {
  const [open, setOpen] = useState(false);
  const [manualValue, setManualValue] = useState(form[name] ?? "");

  return (
    <div className="border rounded-md">
      <div className="flex justify-between items-center px-3 py-2 bg-gray-50">
        <div>
          <strong>{label}:</strong>{" "}
          <span className="text-gray-700">{ocrValue || "—"}</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-sm text-blue-600 hover:underline"
        >
          {open ? "Close" : "Edit"}
        </button>
      </div>

      {open && (
        <div className="p-3">
          <input
            type="text"
            name={name}
            value={manualValue}
            onChange={(e) => {
              const v = e.target.value;
              setManualValue(v);

              setForm((prev) => ({
                ...prev,
                [name]: v,
              }));
            }}
            placeholder={`Enter ${label.toLowerCase()}`}
            className="w-full border rounded p-2"
          />
        </div>
      )}
    </div>
  );
};

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
  onAddTemplate?: (paths: string[]) => Promise<void> | void;
  onRemoveTemplate?: (jobDocumentId: string) => Promise<void> | void;
  onCreateMinimalJob: (
    companyId: string,
    createdBy: string
  ) => Promise<{ id: string }>;
  onUploadSnippet: (
    jobId: string,
    file: File
  ) => Promise<{
    publicUrl: string;
    ocrText?: string;
    parsed?: {
      name?: string;
      phone?: string; 
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      folio?: string;
      subdivision?: string;
    };
  }>;
}

interface PaSearchPayload {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  folio?: string;
  subdivision?: string;
}

interface PaResult {
  ownerName?: string;
  siteAddress?: string;
  mailingAddress?: string;
  legalDescription?: string;
  folio?: string;
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
     LOCAL JOB ID 
  --------------------------------------------------------- */
  const [localJobId, setLocalJobId] = useState(jobId ?? null);
  const [showPasteHint, setShowPasteHint] = useState(false);
  
  const [showPaSearch, setShowPaSearch] = useState(false);
  const [showPaConfirm, setShowPaConfirm] = useState(false);
  
  const [paSearchPayload, setPaSearchPayload] = useState<PaSearchPayload | null>(null);
  const [paResult, setPaResult] = useState<PaResult | null>(null);

  function runPaSearch(payload: PaSearchPayload | null) {
    console.log("Running PA search with:", payload);
  
    // TEMP MOCK RESULT
    setPaResult({
      ownerName: "John Doe",
      siteAddress: "123 Main St",
      mailingAddress: "PO Box 456",
      legalDescription: "LOT 12 BLK 3",
      folio: "1234-5678",
    });
  }
  
  function applyPaToForm(result: PaResult | null) {
    if (!result) return;
  
    console.log("Applying PA result to form:", result);
  
    // TODO: Map PA result into your job form fields
  }

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

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      ? `$ ${new Intl.NumberFormat("en-US").format(initialJob.jobValue)}`
      : ""
  );

  const formatWithCommas = (value: string) => {
    const numeric = value.replace(/[^\d.]/g, "");
    if (!numeric) return "";
    const parts = numeric.split(".");
    parts[0] = Number(parts[0]).toLocaleString("en-US");
    return `$ ${parts.join(".")}`;
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setJobPrice(formatWithCommas(raw));
  };

  /* ---------------------------------------------------------
     OCR STATE
  --------------------------------------------------------- */
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [ocrParsed, setOcrParsed] = useState<{
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    folio?: string;
    subdivision?: string;
  } | null>(null);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [form, setForm] = useState({
    customer_name: initialJob?.customerName ?? "",
    customer_phone: initialJob?.customerPhone ?? "",
    customer_email: initialJob?.customerEmail ?? "",
    customer_address_full: initialJob?.customerAddress ?? "",
    customer_address_city: initialJob?.customerCity ?? "",
    customer_address_state: initialJob?.customerState ?? "",
    customer_address_zip: initialJob?.customerZip ?? "",
    subdivision: initialJob?.subdivision ?? "",
    customer_tax_folio: initialJob?.taxFolioNumber ?? "",
    legal_description: initialJob?.legalDescription ?? "",
  });

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
        </div>,
        { duration: 3000 }
      );

      const { publicUrl, ocrText, parsed } = await onUploadSnippet(id, file);

      // add cache-busting so preview updates
      setSnippetUrl(`${publicUrl}?t=${Date.now()}`);

      setOcrText(ocrText ?? null);
      setOcrParsed(parsed ?? null);

      if (parsed) {
        setOcrParsed(parsed);
        requestAnimationFrame(() => setShowOcrModal(true));
      } else {
        setOcrParsed(null);
      }

      showToast(
        <div className="text-sm font-medium text-green-700">
          Snippet uploaded successfully.
        </div>,
        { duration: 3000 }
      );
    } catch (err) {
      console.error(err);
      showToast(
        <div className="text-sm font-medium text-red-700">
          Failed to upload snippet.
        </div>,
        { duration: 3000 }
      );
    }
  };

  /* ---------------------------------------------------------
     TEMPLATE SELECTION
  --------------------------------------------------------- */
  const handleSelectTemplate = async (paths: string[]) => {
    const cleanPaths = paths.map((p) =>
      p.replace(/\\/g, "/").replace(/^templates\//, "")
    );

    await ensureJobExists();

    if (onAddTemplate) {
      await onAddTemplate(cleanPaths);
    }

    setTemplates((prev) => {
      const next = [...prev];
      for (const p of cleanPaths) {
        if (next.some((t) => t.templatePath === p)) continue;
        const fileName = p.split("/").pop() || p;
        next.push({
          id: crypto.randomUUID(),
          templateName: fileName,
          templatePath: p,
        });
      }
      return next;
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
  OCR CONFIRMATION MODAL (Editable Fields)
--------------------------------------------------------- */
const applyOcrToForm = () => {
  if (!ocrParsed) return;

  setForm((prev) => ({
    ...prev,
    customer_name: prev.customer_name || ocrParsed.name || "",
    customer_phone: prev.customer_phone || ocrParsed.phone || "",
    customer_address_full: prev.customer_address_full || ocrParsed.address || "",
    customer_address_city: prev.customer_address_city || ocrParsed.city || "",
    customer_address_state: prev.customer_address_state || ocrParsed.state || "",
    customer_address_zip: prev.customer_address_zip || ocrParsed.zip || "",
    subdivision: prev.subdivision || ocrParsed.subdivision || "",
    customer_tax_folio: prev.customer_tax_folio || ocrParsed.folio || "",
  }));

  setShowOcrModal(false);
};

return (
  <>
    {/* ---------------------------------------------------------
        OCR MODAL (MUST BE OUTSIDE THE GRID)
    --------------------------------------------------------- */}
    {showOcrModal && ocrParsed && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow-xl w-[500px] space-y-4">
          <h2 className="text-lg font-semibold">Confirm Extracted Information</h2>

          {ocrText && (
            <pre className="text-xs bg-gray-100 p-2 rounded max-h-32 overflow-auto">
              {ocrText}
            </pre>
          )}

          <div className="space-y-3 text-sm">
            <EditableField label="Name" ocrValue={ocrParsed.name} name="customer_name" form={form} setForm={setForm} />
            <EditableField label="Phone" ocrValue={ocrParsed.phone} name="customer_phone" form={form} setForm={setForm} />
            <EditableField label="Address" ocrValue={ocrParsed.address} name="customer_address_full" form={form} setForm={setForm} />
            <EditableField label="City" ocrValue={ocrParsed.city} name="customer_address_city" form={form} setForm={setForm} />
            <EditableField label="State" ocrValue={ocrParsed.state} name="customer_address_state" form={form} setForm={setForm} />
            <EditableField label="ZIP" ocrValue={ocrParsed.zip} name="customer_address_zip" form={form} setForm={setForm} />
            <EditableField label="Subdivision" ocrValue={ocrParsed.subdivision} name="subdivision" form={form} setForm={setForm} />
            <EditableField label="Folio" ocrValue={ocrParsed.folio} name="customer_tax_folio" form={form} setForm={setForm} />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button className="btn btn-secondary" onClick={() => setShowOcrModal(false)}>
              Cancel
            </button>

            <button className="btn btn-primary" onClick={applyOcrToForm}>
              Apply to Form
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ---------------------------------------------------------
      FORM BINDS SERVER ACTION DIRECTLY
  --------------------------------------------------------- */}
  <div className="grid grid-cols-[2fr,1fr] gap-6">
    <form className="space-y-6 card p-6">
      {/* Hidden fields required for server action */}
      <input type="hidden" name="job_price" value={jobPrice} />
      <input
        type="hidden"
        name="template_paths"
        value={JSON.stringify(templates.map((t) => t.templatePath))}
      />
      {localJobId && (
        <input type="hidden" name="job_id" value={localJobId} />
      )}
      {initialJob?.companyId && (
        <input
          type="hidden"
          name="company_id"
          value={initialJob.companyId}
        />
      )}
      <input
        type="hidden"
        name="description"
        value={initialJob?.description ?? ""}
      />

{/* ---------------------------------------------------------
  SNIPPET UPLOAD
--------------------------------------------------------- */}
<div className="space-y-4 pb-6 border-b">
<h3 className="text-md font-semibold">Customer Snippet</h3>

{/* DRAG + DROP + PASTE AREA */}
<div
  tabIndex={0}
  className="border-2 border-dashed rounded-lg p-6 text-center transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 relative"
  onFocus={() => setShowPasteHint(true)}
  onBlur={() => setShowPasteHint(false)}
  onDragOver={(e) => {
    e.preventDefault();
    e.stopPropagation();
  }}
  onDrop={(e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleSnippetUpload(file);
  }}
  onPaste={(e) => {
    if (document.activeElement !== e.currentTarget) return;
    e.preventDefault();

    if (e.clipboardData.files?.length > 0) {
      const file = e.clipboardData.files[0];
      if (file) handleSnippetUpload(file);
      return;
    }

    const item = Array.from(e.clipboardData.items).find((i) =>
      i.type.startsWith("image/")
    );
    if (item) {
      const file = item.getAsFile();
      if (file) handleSnippetUpload(file);
    }
  }}
>
  {/* CLICKABLE TEXT (opens file picker) */}
  <p
    className="text-sm text-gray-600 underline decoration-dotted cursor-pointer inline-block"
    onClick={(e) => {
      e.stopPropagation();
      fileInputRef.current?.click();
    }}
  >
    Drag & drop, paste, or click to upload a snippet (PNG/JPEG)
  </p>

  {/* POP-UP MESSAGE WHEN FOCUSED */}
  {showPasteHint && (
    <div className="absolute left-1/2 -bottom-10 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded shadow-md animate-fadeIn">
      Press Ctrl+V to paste an image
    </div>
  )}
</div>

{/* HIDDEN FILE INPUT */}
<input
  ref={fileInputRef}
  type="file"
  accept="image/png, image/jpeg"
  className="hidden"
  onChange={(e) => {
    const file = e.target.files?.[0] ?? null;
    if (file) handleSnippetUpload(file);
  }}
/>

{/* PREVIEW + REMOVE */}
{snippetUrl && (
  <div className="mt-4 space-y-3">
    <Image
      src={snippetUrl}
      alt="Snippet Preview"
      width={300}
      height={200}
      className="rounded border object-contain"
    />

    <button
      type="button"
      className="btn btn-secondary btn-sm"
      onClick={() => setSnippetUrl(null)}
    >
      Remove Snippet
    </button>
  </div>
)}
</div>

{/* ---------------------------------------------------------
  PROPERTY APPRAISER SEARCH (MANUAL)
--------------------------------------------------------- */}
<div className="space-y-4 pb-6 border-b">
<h3 className="text-md font-semibold">Property Appraiser Search</h3>

<p className="text-sm text-gray-600">
  Search the county property appraiser using customer name, address, folio, or subdivision.
</p>

<button
  type="button"
  className="btn btn-primary btn-sm"
  onClick={() => {
    setPaSearchPayload(null);
    setShowPaSearch(true);
  }}
>
  Search Property Appraiser
</button>
</div>

{/* ---------------------------------------------------------
    PROPERTY APPRAISER SEARCH MODAL (SHARED)
--------------------------------------------------------- */}
{showPaSearch && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded shadow-xl w-[450px] space-y-4">
      <h2 className="text-lg font-semibold">Property Appraiser Search</h2>

      <p className="text-sm text-gray-600">
        Enter any information you have — or use the extracted snippet values.
      </p>

      <div className="space-y-3">
        <input className="input input-bordered w-full" defaultValue={paSearchPayload?.name ?? ""} placeholder="Customer Name" />
        <input className="input input-bordered w-full" defaultValue={paSearchPayload?.address ?? ""} placeholder="Address" />
        <input className="input input-bordered w-full" defaultValue={paSearchPayload?.city ?? ""} placeholder="City" />
        <input className="input input-bordered w-full" defaultValue={paSearchPayload?.state ?? ""} placeholder="State" />
        <input className="input input-bordered w-full" defaultValue={paSearchPayload?.zip ?? ""} placeholder="ZIP" />
        <input className="input input-bordered w-full" placeholder="Folio / Parcel Number" />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button className="btn btn-secondary" onClick={() => setShowPaSearch(false)}>
          Cancel
        </button>

        <button className="btn btn-primary" onClick={() => {
          runPaSearch(paSearchPayload);
          setShowPaSearch(false);
          setShowPaConfirm(true);
        }}>
          Search
        </button>
      </div>
    </div>
  </div>
)}

{/* ---------------------------------------------------------
    PROPERTY APPRAISER CONFIRMATION MODAL
--------------------------------------------------------- */}
{showPaConfirm && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded shadow-xl w-[500px] space-y-4">
      <h2 className="text-lg font-semibold">Confirm Property Appraiser Data</h2>

      <p className="text-sm text-gray-600">
        Review the extracted property appraiser information.
      </p>

      <div className="space-y-3">
        <input className="input input-bordered w-full" defaultValue={paResult?.ownerName ?? ""} placeholder="Owner Name" />
        <input className="input input-bordered w-full" defaultValue={paResult?.siteAddress ?? ""} placeholder="Site Address" />
        <input className="input input-bordered w-full" defaultValue={paResult?.mailingAddress ?? ""} placeholder="Mailing Address" />
        <input className="input input-bordered w-full" defaultValue={paResult?.legalDescription ?? ""} placeholder="Legal Description" />
        <input className="input input-bordered w-full" defaultValue={paResult?.folio ?? ""} placeholder="Folio / Parcel Number" />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button className="btn btn-secondary" onClick={() => setShowPaConfirm(false)}>
          Cancel
        </button>

        <button className="btn btn-primary" onClick={() => {
          applyPaToForm(paResult);
          setShowPaConfirm(false);
        }}>
          Populate Form
        </button>
      </div>
    </div>
  </div>
)}

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
                value={form.customer_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, customer_name: e.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Customer Phone</label>
              <input
                name="customer_phone"
                className="input input-bordered"
                value={form.customer_phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, customer_phone: e.target.value }))
                }
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
                value={form.customer_address_full}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, customer_address_full: e.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">City</label>
              <input
              name="customer_address_city"
              className="input input-bordered"
              value={form.customer_address_city}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, customer_address_city: e.target.value }))
              }
            />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">State</label>
              <input
              name="customer_address_state"
              className="input input-bordered"
              value={form.customer_address_state}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, customer_address_state: e.target.value }))
              }
            />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">ZIP</label>
              <input
              name="customer_address_zip"
              className="input input-bordered"
              value={form.customer_address_zip}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, customer_address_zip: e.target.value }))
              }
            />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Subdivision</label>
              <input
                name="subdivision"
                className="input input-bordered"
                value={form.subdivision}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, subdivision: e.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Tax/Folio Number</label>
              <input
                name="customer_tax_folio"
                className="input input-bordered"
                value={form.customer_tax_folio}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, customer_tax_folio: e.target.value }))
                }
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
              <label className="text-sm font-medium">Description of Improvement</label>
              <textarea
                name="desc_of_improvement"
                className="textarea textarea-bordered"
                defaultValue={initialJob?.description ?? ""}
              />
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------
           SAVE BUTTON
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
          initialPath=""
          onClose={() => setShowBrowser(false)}
          onSelectFile={(paths) => handleSelectTemplate(paths)}
        />
      )}
    </div>
    </>
  );
}
