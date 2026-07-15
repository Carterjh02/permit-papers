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
  const sessionData = useSession();
  const session = sessionData?.data;
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
        {/* your existing form fields */}
        {status && <div className="text-sm mt-2">{status}</div>}
      </form>
    </div>
  );
}
