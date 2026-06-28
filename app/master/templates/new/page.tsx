"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FolderBrowserPanel from "../../../components/FolderBrowserPanel";

export default function NewTemplatePage() {
  const router = useRouter();

  const [showBrowser, setShowBrowser] = useState(true);

  // Track uploaded templates for batch mapping
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([]);

  const [outputType, setOutputType] = useState<"temp" | "permanent">("temp");

  /* ---------------------------------------------------------
     HANDLE UPLOAD COMPLETE (from FolderBrowserPanel)
  --------------------------------------------------------- */
  const handleUploadComplete = (fullPath: string) => {
    setUploadedPaths((prev) => [...prev, fullPath]);
  };

  /* ---------------------------------------------------------
     BATCH MAPPING
  --------------------------------------------------------- */
  const handleBatchMapping = () => {
    if (uploadedPaths.length === 0) return;

    const query = encodeURIComponent(uploadedPaths.join(","));
    router.push(`/master/templates/map/batch?paths=${query}`);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Upload New Templates</h1>

      <p className="text-gray-600">
        Upload multiple templates into <b>temp</b> or <b>permanent</b> folders.
        After uploading, you can map them all at once.
      </p>

      {/* Output type selector */}
      <div className="flex gap-4 items-center">
        <label className="font-medium">Template Output Type:</label>

        <select
          value={outputType}
          onChange={(e) =>
            setOutputType(e.target.value as "temp" | "permanent")
          }
          className="input w-48"
        >
          <option value="temp">Temporary (Regeneratable)</option>
          <option value="permanent">Permanent (Stored Per Job)</option>
        </select>
      </div>

      {/* Uploaded templates list */}
      {uploadedPaths.length > 0 && (
        <div className="border rounded p-4 bg-gray-50 space-y-3">
          <h2 className="font-semibold">Uploaded This Session</h2>

          <ul className="list-disc ml-6 text-sm">
            {uploadedPaths.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>

          <button
            onClick={handleBatchMapping}
            className="btn btn-primary mt-2"
          >
            Map All Templates ({uploadedPaths.length})
          </button>
        </div>
      )}

      {/* Folder Browser */}
      {showBrowser && (
        <FolderBrowserPanel
          mode="master"
          initialPath={`templates/${outputType}`}
          onClose={() => setShowBrowser(false)}
          onSelectFile={() => {}}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
}
