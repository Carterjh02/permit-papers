"use client";

import { Suspense } from "react";
import PrintJobPageInner from "./PrintJobPageInner";

export default function PrintJobPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Loading…</div>}>
      <PrintJobPageInner />
    </Suspense>
  );
}
