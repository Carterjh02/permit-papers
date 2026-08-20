"use client";

const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
import { useState, useRef } from "react";
import FolderBrowserPanel from "@/app/components/FolderBrowserPanel";
import { useToast } from "@/app/components/ToastProvider";
import Image from "next/image";
import type { ParsedPAData } from "@/lib/propertyAppraiser/types";
import { detectCounty } from "@/lib/propertyAppraiser/detectCounty";
import { normalizeAddress } from "@/lib/propertyAppraiser/normalizeAddress";
import { savePADataAction } from "./serverActions";

/* ---------------------------------------------------------
   EditableField
--------------------------------------------------------- */
type JobFormState = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address_full: string;
  customer_address_street: string;
  customer_address_city: string;
  customer_address_state: string;
  customer_address_zip: string;
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
    <div className="border border-[var(--border-color)] rounded-md bg-[var(--card-bg)]">
      <div className="flex justify-between items-center px-3 py-2 bg-[var(--card-bg)] border-b border-[var(--border-color)]">
        <div>
          <strong>{label}:</strong>{" "}
          <span className="text-[var(--text-color)]">{ocrValue || "—"}</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-sm text-blue-500 hover:underline"
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
            className="w-full border border-[var(--border-color)] rounded p-2 bg-[var(--input-bg)] text-[var(--text-color)]"
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
  companyCode: string;
  initialJob?: {
    customerName?: string | null;
    customerPhone?: string | null;
    customerEmail?: string | null;
    customerAddress?: string | null;
    customerCity?: string | null;
    customerState?: string | null;
    customerZip?: string | null;
    legalDescription?: string | null;
    taxFolioNumber?: string | null;
    jobValue?: number | null;
    description?: string | null;
    snippetPath?: string | null;
    snippetSignedUrl?: string | null;
    companyId?: string;
    createdBy?: string;
    jobNumber?: number;
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
    publicUrl?: string | null;
    ocrText?: string;
    parsed?: {
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      folio?: string;
    };
    jobNumber: number;
    companyCode: string;
  }>;

}

interface PaSearchPayload {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  folio?: string;
  county?: string;
}

export default function JobFormClient({
  mode,
  jobId,
  companyCode,
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

  const [paSearchPayload, setPaSearchPayload] =
    useState<PaSearchPayload | null>(null);
  const [paResult, setPaResult] = useState<ParsedPAData | null>(null);

  const [jobMeta, setJobMeta] = useState({
    jobNumber: initialJob?.jobNumber ?? null,
    companyCode: companyCode,
  });


  function applyPaToForm(pa: ParsedPAData | null) {
    if (!pa) return;

  
    setForm((prev) => {
      const updated = { ...prev };
  
      // Owner Name
      if (pa.ownerName) {
        updated.customer_name = pa.ownerName;
      }
  
      // Street / City / ZIP
      if (pa.street) {
        updated.customer_address_street = pa.street;
      }
      if (pa.city) {
        updated.customer_address_city = pa.city;
      }
  
      // Florida is always the state
      updated.customer_address_state = "FL";
  
      if (pa.zip) {
        updated.customer_address_zip = pa.zip;
      }
  
      // Folio / Parcel ID
      if (pa.folio) {
        updated.customer_tax_folio = pa.folio;
      }
  
      // Legal Description
      if (pa.legalDescription) {
        updated.legal_description = pa.legalDescription.trim();
      }
  
      return updated;
    });
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

  const [companyDocs, setCompanyDocs] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [snippetUrl, setSnippetUrl] = useState<string | null>(
    initialJob?.snippetSignedUrl ?? null
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
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    folio?: string;
  } | null>(null);
  const [snippetExtraFields, setSnippetExtraFields] = useState({
    phone: "",
    email: "",
  });  
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [form, setForm] = useState({
    customer_name: initialJob?.customerName ?? "",
    customer_phone: initialJob?.customerPhone ?? "",
    customer_email: initialJob?.customerEmail ?? "",
    customer_address_street: initialJob?.customerAddress ?? "",
    customer_address_full: "",
    customer_address_city: initialJob?.customerCity ?? "",
    customer_address_state: initialJob?.customerState ?? "",
    customer_address_zip: initialJob?.customerZip ?? "",
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
  
      const { publicUrl, ocrText, parsed, jobNumber, companyCode } =
      await onUploadSnippet(id, file);

      setJobMeta(prev => ({
        ...prev,
        jobNumber,
        companyCode,
      }));
      
  
      // Always update snippet preview immediately
      setSnippetUrl(`${publicUrl}?t=${Date.now()}`);
  
      // Store OCR text + parsed fields
      setOcrText(ocrText ?? null);
      setOcrParsed(parsed ?? null);
  
      // Always open OCR modal when parsed exists
      if (parsed) {
        requestAnimationFrame(() => setShowOcrModal(true));
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
      p.replace(/\\/g, "/")
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
     COMPANY DOCUMENTS SELECTION
---------------------------------------------------------- */
const handleSelectCompanyDocs = async (paths: string[]) => {
  const cleanPaths = paths.map((p) => p.replace(/\\/g, "/"));

  await ensureJobExists();

  setCompanyDocs((prev) => {
    const next = [...prev];
    for (const p of cleanPaths){
      if (!next.includes(p)) next.push(p);
    }
    return next;
  });

  setShowBrowser(false);
}

  /* ---------------------------------------------------------
  OCR CONFIRMATION MODAL (Editable Fields)
--------------------------------------------------------- */
const applyOcrToForm = () => {
  if (!ocrParsed) return;

  setForm((prev) => {
    const updated = { ...prev };

    const applyField = (name: keyof typeof prev, ocrValue?: string) => {
      const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `[name="${name}"]`
      );

      const prevValue = prev[name] ?? "";
      const userTyped = el?.value ?? "";
      const trimmedUser = userTyped.trim();
      const trimmedPrev = String(prevValue).trim();
      const trimmedOcr = (ocrValue ?? "").trim();

      // Hierarchy:
      // 1. EditableField (userTyped different from prevValue and non-empty)
      // 2. OCR value (ocrValue)
      // 3. Previous form value (prevValue)
      if (trimmedUser !== "" && trimmedUser !== trimmedPrev) {
        // User edited this field in the modal → keep it
        updated[name] = userTyped;
      } else if (trimmedOcr !== "") {
        // No user edit → use OCR value
        updated[name] = ocrValue as string;
      } else {
        // No OCR value → keep previous form value
        updated[name] = prevValue;
      }
    };

    // Name & phone
    applyField("customer_name", ocrParsed.name);
    applyField("customer_phone", ocrParsed.phone);

    // Address fields — use correct field names
    applyField("customer_address_street", ocrParsed.address);
    applyField("customer_address_city", ocrParsed.city);
    applyField("customer_address_state", ocrParsed.state);
    applyField("customer_address_zip", ocrParsed.zip);

    return updated;
  });

  setShowOcrModal(false);
};

return (
  <>
    {/* ---------------------------------------------------------
        OCR MODAL
    --------------------------------------------------------- */}
    {showOcrModal && ocrParsed && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-[var(--card-bg)] p-6 rounded shadow-xl w-[500px] space-y-4 border border-[var(--border-color)]">
      <h2 className="text-lg font-semibold text-[var(--text-color)]">
        Confirm Extracted Information
      </h2>

      {ocrText && (
        <pre className="text-xs bg-[var(--input-bg)] p-2 rounded max-h-32 overflow-auto border border-[var(--border-color)] text-[var(--text-color)]">
          {ocrText}
        </pre>
      )}

      <div className="space-y-3 text-sm text-[var(--text-color)]">
        <EditableField
          label="Name"
          ocrValue={ocrParsed.name}
          name="customer_name"
          form={form}
          setForm={setForm}
        />
        <EditableField
          label="Phone"
          ocrValue={ocrParsed.phone}
          name="customer_phone"
          form={form}
          setForm={setForm}
        />
        <EditableField
          label="Address"
          ocrValue={ocrParsed.address}
          name="customer_address_street"
          form={form}
          setForm={setForm}
        />
        <EditableField
          label="City"
          ocrValue={ocrParsed.city}
          name="customer_address_city"
          form={form}
          setForm={setForm}
        />
        <EditableField
          label="State"
          ocrValue={ocrParsed.state}
          name="customer_address_state"
          form={form}
          setForm={setForm}
        />
        <EditableField
          label="ZIP"
          ocrValue={ocrParsed.zip}
          name="customer_address_zip"
          form={form}
          setForm={setForm}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          className="btn btn-primary"
          onClick={() => setShowOcrModal(false)}
        >
          Cancel
        </button>

        {/* Run PA Search Button */}
        <button
          className="btn btn-primary"
          onClick={async () => {
            console.log("🔵 [PA SEARCH] Button clicked");
            if (!ocrParsed) return;

            // Preserve snippet-only fields
            setSnippetExtraFields({
              phone: ocrParsed.phone ?? "",
              email: ocrParsed.email ?? "",
            });

            // Ensure job exists
            const id = localJobId ?? (await ensureJobExists());

            // Build address
            const finalAddress = normalizeAddress(
              form?.customer_address_street ||
                ocrParsed?.address ||
                paSearchPayload?.address ||
                ""
            );

            const finalCity =
              form?.customer_address_city ||
              ocrParsed?.city ||
              paSearchPayload?.city ||
              "";

            const finalState =
              form?.customer_address_state ||
              ocrParsed?.state ||
              paSearchPayload?.state ||
              "FL";

            const finalZip =
              form?.customer_address_zip ||
              ocrParsed?.zip ||
              paSearchPayload?.zip ||
              "";

            const initialCounty = detectCounty({
              address: ocrParsed.address ?? "",
              city: ocrParsed.city ?? "",
              state: ocrParsed.state ?? "",
              zip: ocrParsed.zip ?? "",
            });

            const finalCounty =
              initialCounty ||
              paSearchPayload?.county ||
              detectCounty({
                address: finalAddress,
                city: finalCity,
                state: finalState,
                zip: finalZip,
              });

            // CLOUD PA SEARCH
            let res;
            try {
              res = await fetch(
                "https://ednxswgrxrtamljupapf.supabase.co/functions/v1/pa-search",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                  },
                  body: JSON.stringify({
                    county: finalCounty,
                    address: finalAddress,
                    jobId: id,
                    jobNumber: jobMeta.jobNumber,
                    companyCode: jobMeta.companyCode,
                  }),
                }
              );
            } catch (err) {
              const message =
                err instanceof Error ? err.message : "Unknown error occurred";
            
              showToast("PA search failed: " + message);
              return;
            }

            const rawText = await res.text();
            let data;
            try {
              data = JSON.parse(rawText);
            } catch {
              showToast("PA search returned invalid JSON");
              return;
            }

            if (data.error) {
              showToast("PA search failed: " + data.error);
              return;
            }

            const saved = await savePADataAction(id, data);

            setPaResult(saved.parsed);

            //   IMPORTANT: Close ONLY OCR modal
            setShowOcrModal(false);

            //   IMPORTANT: Open PA Confirm modal independently
            setShowPaConfirm(true);
          }}
        >
          Run PA Search
        </button>

        <button className="btn btn-primary" onClick={applyOcrToForm}>
          Apply to Form
        </button>
      </div>
    </div>
  </div>
)}

    {/* ---------------------------------------------------------
        PROPERTY APPRAISER SEARCH MODAL (OUTSIDE FORM)
    --------------------------------------------------------- */}
    {/* ---------------------------------------------------------
    PROPERTY APPRAISER SEARCH MODAL (OUTSIDE FORM)
--------------------------------------------------------- */}
{showPaSearch && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-[var(--card-bg)] p-6 rounded shadow-xl w-[450px] space-y-4 border border-[var(--border-color)]">
      <h2 className="text-lg font-semibold text-[var(--text-color)]">
        Property Appraiser Search
      </h2>

      <p className="text-sm text-[var(--text-color)] opacity-80">
        Enter any information you have — or use the extracted snippet values.
      </p>

      <div className="space-y-3">
        <input
          id="pa_name"
          className="input w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
          value={paSearchPayload?.name ?? ""}
          onChange={(e) =>
            setPaSearchPayload((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Customer Name"
        />

        <input
          id="pa_address"
          className="input w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
          value={paSearchPayload?.address ?? ""}
          onChange={(e) =>
            setPaSearchPayload((prev) => ({ ...prev, address: e.target.value }))
          }
          placeholder="Address"
        />

        <input
          id="pa_city"
          className="input w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
          value={paSearchPayload?.city ?? ""}
          onChange={(e) =>
            setPaSearchPayload((prev) => ({ ...prev, city: e.target.value }))
          }
          placeholder="City"
        />

        <input
          id="pa_state"
          className="input w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
          value={paSearchPayload?.state ?? ""}
          onChange={(e) =>
            setPaSearchPayload((prev) => ({ ...prev, state: e.target.value }))
          }
          placeholder="State"
        />

        <input
          id="pa_zip"
          className="input w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
          value={paSearchPayload?.zip ?? ""}
          onChange={(e) =>
            setPaSearchPayload((prev) => ({ ...prev, zip: e.target.value }))
          }
          placeholder="ZIP"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          className="btn btn-primary"
          onClick={() => setShowPaSearch(false)}
        >
          Cancel
        </button>

        <button
          className="btn btn-primary"
          onClick={async () => {
            const { address, city, state, zip, county } = paSearchPayload ?? {};

            if (!address?.trim()) {
              showToast("Please enter an address before running PA search.");
              return;
            }
            if (!city?.trim()) {
              showToast("City is required.");
              return;
            }
            if (!zip?.trim()) {
              showToast("ZIP code is required.");
              return;
            }

            // Ensure job exists
            const id = localJobId ?? (await ensureJobExists());

            const finalAddress = normalizeAddress(address);
            const finalCounty =
              county ||
              detectCounty({
                address: finalAddress,
                city,
                state: state ?? "FL",
                zip,
              });

            // CLOUD PA SEARCH — ALWAYS
            const res = await fetch(
              "https://ednxswgrxrtamljupapf.supabase.co/functions/v1/pa-search",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                  county: finalCounty,
                  address: finalAddress,
                  jobId: id,
                  jobNumber: jobMeta.jobNumber,
                  companyCode: jobMeta.companyCode,
                }),
              }
            );

            const data = await res.json();

            if (data.error) {
              showToast("PA search failed: " + data.error);
              return;
            }

            // Save to server
            const saved = await savePADataAction(id, data);

            setPaResult(saved.parsed);

            // Close ONLY this modal
            setShowPaSearch(false);

            // Open PA Confirm modal
            setShowPaConfirm(true);
          }}
        >
          Search
        </button>
      </div>
    </div>
  </div>
)}

    {/* ---------------------------------------------------------
        PROPERTY APPRAISER CONFIRMATION MODAL (OUTSIDE FORM)
    --------------------------------------------------------- */}
    {showPaConfirm && paResult && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-[var(--card-bg)] p-6 rounded shadow-xl w-[500px] space-y-4 border border-[var(--border-color)]">
      <h2 className="text-lg font-semibold text-[var(--text-color)]">
        Confirm Property Appraiser Data
      </h2>

      <p className="text-sm text-[var(--text-color)] opacity-80">
        Review the extracted property appraiser information and apply it to the form.
      </p>

      <div className="space-y-3 text-sm text-[var(--text-color)]">
        <EditableField
          label="Owner Name"
          ocrValue={paResult.ownerName}
          name="customer_name"
          form={form}
          setForm={setForm}
        />

        <EditableField
          label="Street Address"
          ocrValue={paResult.street}
          name="customer_address_street"
          form={form}
          setForm={setForm}
        />

        <EditableField
          label="City"
          ocrValue={paResult.city}
          name="customer_address_city"
          form={form}
          setForm={setForm}
        />

        <EditableField
          label="ZIP Code"
          ocrValue={paResult.zip}
          name="customer_address_zip"
          form={form}
          setForm={setForm}
        />

        <EditableField
          label="Legal Description"
          ocrValue={paResult.legalDescription}
          name="legal_description"
          form={form}
          setForm={setForm}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          className="btn btn-primary"
          onClick={() => setShowPaConfirm(false)}
        >
          Cancel
        </button>

        <button
          className="btn btn-primary"
          onClick={() => {
            // Apply parsed PA data to form
            applyPaToForm(paResult);

            // Overwrite with snippet-only fields when they exist
            setForm((prev) => ({
              ...prev,
              customer_phone: snippetExtraFields.phone ?? prev.customer_phone,
              customer_email: snippetExtraFields.email ?? prev.customer_email,
            }));

            setShowPaConfirm(false);
          }}
        >
          Populate Form
        </button>
      </div>
    </div>
  </div>
)}

    {/* ---------------------------------------------------------
      FORM BINDS SERVER ACTION DIRECTLY
    --------------------------------------------------------- */}
    <div className="grid grid-cols-[2fr,1fr] gap-6">
      <form className="space-y-6 p-6 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-sm">
        {/* Hidden fields required for server action */}
        <input type="hidden" name="job_price" value={jobPrice} />
        <input
          type="hidden"
          name="template_paths"
          value={JSON.stringify(templates.map((t) => t.templatePath))}
        />
        <input
          type="hidden"
          name="company_document_paths"
          value={JSON.stringify(companyDocs)}
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
          <h3 className="text-md font-semibold text-[var(--text-color)]">Customer Snippet</h3>

          <div
            tabIndex={0}
            className="border-2 border-dashed border-[var(--border-color)] rounded-lg p-6 text-center transition-colors hover:bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-blue-300 relative"
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
            <p
              className="text-sm text-[var(--text-color)] opacity-80 underline decoration-dotted cursor-pointer inline-block"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Drag & drop, paste, or click to upload a snippet (PNG/JPEG)
            </p>

            {showPasteHint && (
              <div className="absolute left-1/2 -bottom-10 -translate-x-1/2 bg-[var(--card-bg)] text-[var(--text-color)] text-xs px-3 py-1 rounded shadow-md animate-fadeIn border border-[var(--border-color)]">
                Press Ctrl+V to paste an image
              </div>
            )}
          </div>

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

          {snippetUrl && (
            <div className="mt-4 space-y-3">
              <Image
                src={snippetUrl}
                alt="Snippet Preview"
                width={300}
                height={200}
                className="rounded border border-[var(--border-color)] object-contain"
                loader={({ src }) => src}
                unoptimized
              />

              <button
                type="button"
                className="btn btn-primary btn-sm"
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
          <h3 className="text-md font-semibold text-[var(--text-color)]">Property Appraiser Search</h3>

          <p className="text-sm text-[var(--text-color)] opacity-80">
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
          CUSTOMER INFORMATION
        --------------------------------------------------------- */}
        <div className="space-y-4 pt-2">
          <h3 className="text-md font-semibold text-[var(--text-color)]">Customer Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[var(--text-color)] opacity-80">Customer Name</label>
              <input
                name="customer_name"
                className="input w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
                value={form.customer_name}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    customer_name: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[var(--text-color)] opacity-80">Customer Phone</label>
              <input
                name="customer_phone"
                className="input w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
                value={form.customer_phone}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    customer_phone: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-sm font-medium text-[var(--text-color)] opacity-80">Customer Email</label>
              <input
                name="customer_email"
                className="input w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
                value={form.customer_email}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    customer_email: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------
          PROPERTY LOCATION
        --------------------------------------------------------- */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-md font-semibold text-[var(--text-color)]">Property Location</h3>
          <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--text-color)] opacity-80">Street Address</label>
              <input
                name="customer_address_street"
                className="input w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
                value={form.customer_address_street}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    customer_address_street: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[var(--text-color)] opacity-80">City</label>
              <input
                name="customer_address_city"
                className="input w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
                value={form.customer_address_city}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    customer_address_city: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[var(--text-color)] opacity-80">State</label>
              <input
                name="customer_address_state"
                className="input w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
                value={form.customer_address_state}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    customer_address_state: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[var(--text-color)] opacity-80">ZIP</label>
              <input
                name="customer_address_zip"
                className="input w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
                value={form.customer_address_zip}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    customer_address_zip: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[var(--text-color)] opacity-80">Tax/Folio Number</label>
              <input
                name="customer_tax_folio"
                className="input w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
                value={form.customer_tax_folio}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    customer_tax_folio: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-sm font-medium text-[var(--text-color)] opacity-80">Legal Description</label>
                <textarea
                  name="legal_description"
                  className="textarea bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
                  value={form.legal_description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      legal_description: e.target.value,
                    }))
                  }
                />
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------
          JOB DESCRIPTION
        --------------------------------------------------------- */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-md font-semibold text-[var(--text-color)]">Job Description</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[var(--text-color)] opacity-80">Job Value</label>
              <input
                name="job_price_display"
                inputMode="decimal"
                className="input w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
                value={jobPrice}
                onChange={handlePriceChange}
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-sm font-medium text-[var(--text-color)] opacity-80">Description of Improvement</label>
              <textarea
                name="desc_of_improvement"
                className="textarea bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)]"
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
      <div className="p-6 space-y-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-color)]">Documents</h2>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowBrowser(true)}
          >
            Add Document
          </button>
        </div>

        {templates.length === 0 && (
          <p className="text-sm text-[var(--text-color)] opacity-60">
            No documents added yet. Use “Add Document” to select templates.
          </p>
        )}

        {templates.length > 0 && (
          <ul className="space-y-2">
            {templates.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between text-sm bg-[var(--card-bg)] border border-[var(--border-color)] px-3 py-2 rounded"
              >
                <span className="font-medium">{t.templateName}</span>

                <button
                  type="button"
                  className="text-red-400 text-xs font-semibold"
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
        initialPath={`companies/${companyCode}/documents`}
        companyCode={companyCode}
        onClose={() => setShowBrowser(false)}
        onSelectFile={(paths) => {
          // Templates come from the templates bucket → they NEVER include "companies/"
          if (paths.some((p) => !p.startsWith(companyCode))) {
            handleSelectTemplate(paths);
          } else {
            handleSelectCompanyDocs(paths);
          }
        }}
      />
      )}
    </div>
    </>
  );
}
