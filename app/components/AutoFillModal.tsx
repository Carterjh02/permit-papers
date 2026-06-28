"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { ExtractedInfo } from "@/lib/types/ocr";

// -----------------------------
// Formatting Helpers
// -----------------------------
const toTitleCase = (str?: string) =>
  str
    ? str
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .replace(/\s+/g, " ")
        .trim()
    : "";

const formatState = (str?: string) =>
  str ? str.toUpperCase().trim() : "";

const formatZip = (str?: string) =>
  str ? str.trim() : "";

// -----------------------------
// Confidence Bar Component
// -----------------------------
const ConfidenceBar = ({ value }: { value?: number }) => {
  if (value == null) return null;

  const pct = Math.round(value * 100);

  let color = "bg-gray-300";
  if (pct >= 85) color = "bg-green-500";
  else if (pct >= 60) color = "bg-yellow-500";
  else color = "bg-red-500";

  return (
    <div className="w-full mt-1">
      <div className="h-2 w-full bg-gray-200 rounded">
        <div
          className={`h-2 rounded ${color}`}
          style={{ width: `${pct}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-600 mt-1">{pct}% confidence</p>
    </div>
  );
};

const lowConfidence = (value?: number) =>
  value != null && value < 0.5;

// -----------------------------
// Raw OCR Panel Component
// -----------------------------
function RawPanel({
  rawText,
  show,
  onToggle,
}: {
  rawText?: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mt-4">
      <button
        className="text-sm font-semibold text-gray-700 underline"
        onClick={onToggle}
      >
        {show ? "Hide Raw OCR Text" : "Show Raw OCR Text"}
      </button>

      {show && (
        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs whitespace-pre-wrap border border-gray-300">
          {rawText || "No raw OCR text available."}
        </pre>
      )}
    </div>
  );
}

// -----------------------------
// Main Modal Component
// -----------------------------
interface AutoFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  snippetUrl: string | null;
  extracted: ExtractedInfo;
  onApply: (data: ExtractedInfo) => void;
}

export default function AutoFillModal({
  isOpen,
  onClose,
  snippetUrl,
  extracted,
  onApply,
}: AutoFillModalProps) {
  const [loading, setLoading] = useState(false);

  // Local editable state
  const [form, setForm] = useState<ExtractedInfo>(() => extracted);

  // Track previous open state
  const wasOpen = useRef(false);

  // Reset form ONLY when modal transitions from closed → open
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      setForm(extracted);
    }
    wasOpen.current = isOpen;
  }, [isOpen, extracted]);

  // Track edited fields
  const [edited, setEdited] = useState<Record<string, boolean>>({});

  const markEdited = (key: keyof ExtractedInfo) => {
    setEdited((prev) => ({ ...prev, [key]: true }));
  };

  const resetField = (key: keyof ExtractedInfo) => {
    setForm((prev) => ({
      ...prev,
      [key]: extracted[key],
    }));
    setEdited((prev) => ({ ...prev, [key]: false }));
  };

  // Raw OCR panel state
  const [showRaw, setShowRaw] = useState(false);

  if (!isOpen) return null;

  const handleApply = async () => {
    setLoading(true);

    // Apply formatting before sending
    const formatted: ExtractedInfo = {
      ...form,
      name: toTitleCase(form.name),
      address: toTitleCase(form.address),
      city: toTitleCase(form.city),
      state: formatState(form.state),
      zip: formatZip(form.zip),
      subdivision: toTitleCase(form.subdivision),
    };

    await onApply(formatted);
    setLoading(false);
  };

  // -----------------------------
  // Field Component
  // -----------------------------
  const field = (
    key: keyof ExtractedInfo,
    label: string,
    confidence?: number
  ) => {
    const isEdited = edited[key];

    return (
      <div
        className={`flex flex-col p-2 rounded border ${
          isEdited
            ? "border-blue-400"
            : lowConfidence(confidence)
            ? "border-red-400"
            : "border-transparent"
        }`}
      >
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-gray-500">
            {label}
          </label>

          {isEdited && (
            <button
              type="button"
              className="text-xs text-blue-600 underline"
              onClick={() => resetField(key)}
            >
              Reset
            </button>
          )}
        </div>

        <input
          type="text"
          className="input input-bordered w-full mt-1"
          value={form[key] || ""}
          onChange={(e) => {
            markEdited(key);
            setForm((prev) => ({
              ...prev,
              [key]: e.target.value,
            }));
          }}
        />

        <ConfidenceBar value={confidence} />
      </div>
    );
  };

  // -----------------------------
  // Render Modal
  // -----------------------------
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[850px] max-h-[90vh] overflow-hidden flex">
        {/* Left: Snippet image */}
        <div className="w-1/2 bg-gray-100 p-4 flex items-center justify-center">
          {snippetUrl ? (
            <div className="relative w-[350px] h-[350px]">
              <Image
                src={snippetUrl}
                alt="Snippet"
                fill
                className="rounded shadow object-contain"
              />
            </div>
          ) : (
            <p className="text-sm text-gray-500">No snippet available</p>
          )}
        </div>

        {/* Right: Extracted fields */}
        <div className="w-1/2 p-6 space-y-4 overflow-y-auto">
          <h2 className="text-lg font-semibold">Review & Edit Extracted Information</h2>

          <div className="grid grid-cols-1 gap-3">
            {field("name", "Name", extracted.nameConfidence)}
            {field("address", "Address", extracted.addressConfidence)}
            {field("city", "City", extracted.cityConfidence)}
            {field("state", "State", extracted.stateConfidence)}
            {field("zip", "ZIP", extracted.zipConfidence)}
            {field("folio", "Folio", extracted.folioConfidence)}
            {field("subdivision", "Subdivision", extracted.subdivisionConfidence)}
          </div>

          {/* Raw OCR Panel */}
          <RawPanel
            rawText={extracted.rawText}
            show={showRaw}
            onToggle={() => setShowRaw((prev) => !prev)}
          />

          <div className="flex justify-end gap-3 mt-6">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>

            <button
              className="btn btn-primary"
              onClick={handleApply}
              disabled={loading}
            >
              {loading ? "Applying..." : "Apply to Job"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
