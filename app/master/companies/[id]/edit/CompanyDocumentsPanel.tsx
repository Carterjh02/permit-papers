"use client";

import { useState } from "react";
import FolderBrowserPanel from "@/app/components/FolderBrowserPanel";

export default function CompanyDocumentsPanel({ companyCode }: { companyCode: string }) {
  const [showBrowser, setShowBrowser] = useState(false);

  return (
    <div className="space-y-4">
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setShowBrowser(true)}
      >
        Upload Company Document
      </button>

      {showBrowser && (
        <FolderBrowserPanel
          mode="master"
          companyCode={companyCode}

          // Force the correct starting folder
          initialPath={`${companyCode}/documents`}

          // NEW — force FolderBrowserPanel to show the companies tree
          defaultTree="companies"

          onClose={() => setShowBrowser(false)}

          onUploadComplete={(path) => {
            console.log("Uploaded company doc:", path);
          }}

          onSelectFile={() => {}}
        />
      )}
    </div>
  );
}
