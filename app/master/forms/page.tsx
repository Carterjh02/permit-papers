// app/master/forms/page.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

type SessionUser = {
  id: string;
  username: string;
  role: "master" | "admin" | "user";
  companyId: string | null;
};

export default function MasterFormsPage() {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [county, setCounty] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [formType, setFormType] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus("Please select a file");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", name);
    fd.append("county", county);
    fd.append("municipality", municipality);
    fd.append("formType", formType);
    if (description) fd.append("description", description);

    setStatus("Uploading...");

    const res = await fetch("/api/forms/upload", {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      setStatus("Upload failed");
      return;
    }

    setStatus("Uploaded successfully");
    setFile(null);
    setName("");
    setCounty("");
    setMunicipality("");
    setFormType("");
    setDescription("");
  };

  if (!session) return <div className="p-6">Please sign in</div>;
  if (!user || user.role !== "master") return <div className="p-6">Forbidden</div>;

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Upload Form Template</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Form Name</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Palm Beach County NOC"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">County</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            placeholder="Palm Beach"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Municipality</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={municipality}
            onChange={(e) => setMunicipality(e.target.value)}
            placeholder="Boca Raton"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Form Type</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={formType}
            onChange={(e) => setFormType(e.target.value)}
            placeholder="noc, permit_application, electrical, etc."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            className="border rounded px-2 py-1 w-full"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">PDF File</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
        >
          Upload
        </button>

        {status && <div className="text-sm mt-2">{status}</div>}
      </form>
    </div>
  );
}
