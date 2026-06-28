"use client";

import { useRouter } from "next/navigation";

interface Props {
  companyId: string;
}

export default function EnterPortalButton({ companyId }: Props) {
  const router = useRouter();

  async function handleEnter() {
    await fetch("/api/master/set-active-company", {
      method: "POST",
      body: JSON.stringify({ companyId }),
    });

    router.push("/dashboard");
  }

  return (
    <button
      onClick={handleEnter}
      className="px-3 py-1 bg-green-600 text-white rounded text-sm"
    >
      Enter Portal
    </button>
  );
}
