"use client";

import { Suspense } from "react";
import TemplateMappingPageInner from "./TemplateMappingPageInner";

export default function TemplateMappingPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading…</div>}>
      <TemplateMappingPageInner />
    </Suspense>
  );
}
