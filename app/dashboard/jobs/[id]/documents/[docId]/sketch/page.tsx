"use client";

import SketchToolbar from "@/app/components/sketch/SketchToolbar";
import SketchCanvas from "@/app/components/sketch/SketchCanvas";

export default function SketchEditorPage() {
  return (
    <div className="w-full h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Top toolbar */}
      <SketchToolbar />

      {/* Main drawing canvas */}
      <div className="flex-1">
        <SketchCanvas />
      </div>
    </div>
  );
}
