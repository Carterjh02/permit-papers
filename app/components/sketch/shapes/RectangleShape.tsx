// app/components/sketch/shapes/RectangleShape.tsx
"use client";

import React, { useMemo } from "react";
import { Rect } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";

import {
  useSketchStore,
  type SketchShape,
} from "@/app/store/sketchStore";

interface RectangleShapeProps {
  shape: SketchShape;
}

/**
 * RectangleShape
 *
 * Responsibilities:
 * - Render a rectangle with precise geometry.
 * - Integrate with global selection state (single-select).
 * - Highlight when selected (blue stroke, slightly thicker).
 * - Respect current tool (only selectable when tool === "select").
 * - Prepare for future dragging / bounding box / handles.
 */
export default function RectangleShape({ shape }: RectangleShapeProps) {
  const tool = useSketchStore((s) => s.tool);
  const selectedShapeId = useSketchStore((s) => s.selectedShapeId);
  const setSelectedShape = useSketchStore((s) => s.setSelectedShape);

  // Determine selection state FIRST (before any early returns)
  const isSelected = selectedShapeId === shape.id;

  // Compute stroke styling (safe to use hooks here)
  const { strokeColor, strokeWidth } = useMemo(() => {
    const baseStroke = shape.stroke || "black";
    const baseWidth = shape.strokeWidth ?? 2;

    if (!isSelected) {
      return {
        strokeColor: baseStroke,
        strokeWidth: baseWidth,
      };
    }

    // Selected: blue outline, slightly thicker
    return {
      strokeColor: "#2563eb", // Tailwind blue-600
      strokeWidth: baseWidth + 1,
    };
  }, [isSelected, shape.stroke, shape.strokeWidth]);

  // Cursor logic
  const cursor = useMemo(() => {
    if (tool === "select" && isSelected) return "move";
    if (tool === "select") return "pointer";
    return "crosshair";
  }, [tool, isSelected]);

  // Selection handler
  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (tool !== "select") return;

    // Prevent Stage from interpreting this as a click on empty space
    e.cancelBubble = true;

    setSelectedShape(shape.id);
  };

  // EARLY RETURN — safe now because all hooks are above this line
  if (
    shape.x === undefined ||
    shape.y === undefined ||
    shape.width === undefined ||
    shape.height === undefined
  ) {
    return null;
  }

  return (
    <Rect
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      fill="transparent"
      listening={true}
      onMouseDown={handleMouseDown}
      perfectDrawEnabled
      // Cursor styling
      onMouseEnter={(e) => {
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = cursor;
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = "default";
      }}
    />
  );
}
