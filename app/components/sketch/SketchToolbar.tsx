"use client";

import { useSketchStore } from "@/app/store/sketchStore";

export default function SketchToolbar() {
  const tool = useSketchStore((s) => s.tool);
  const setTool = useSketchStore((s) => s.setTool);
  const undo = useSketchStore((s) => s.undo);
  const redo = useSketchStore((s) => s.redo);

  const tools = [
    { id: "pan", label: "Pan", icon: "🖐️" },
    { id: "select", label: "Select", icon: "➤" },
    { id: "line", label: "Line", icon: "／" },
    { id: "rectangle", label: "Rectangle", icon: "▭" },
    { id: "triangle", label: "Triangle", icon: "🔺" },
    { id: "polygon", label: "Polygon", icon: "⬠" },
    { id: "circle", label: "Circle", icon: "⚪" }, // placeholder
    { id: "arc", label: "Arc", icon: "◜" },       // placeholder
  ];

  return (
    <div className="flex items-center justify-between gap-4 p-2 border-b bg-white shadow-sm">
      <div className="flex gap-2">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            className={`flex items-center gap-1 px-3 py-1 rounded border text-sm ${
              tool === t.id ? "bg-blue-500 text-white border-blue-500" : "bg-gray-100 text-gray-800"
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}

        {/* More shapes dropdown placeholder */}
        <button
          className="flex items-center gap-1 px-3 py-1 rounded border bg-gray-100 text-gray-800 text-sm"
          type="button"
        >
          <span>▼</span>
          <span>More shapes</span>
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={undo}
          className="px-3 py-1 rounded border bg-gray-100 text-gray-800 text-sm"
          type="button"
        >
          ⟲ Undo
        </button>
        <button
          onClick={redo}
          className="px-3 py-1 rounded border bg-gray-100 text-gray-800 text-sm"
          type="button"
        >
          ⟳ Redo
        </button>
      </div>
    </div>
  );
}
