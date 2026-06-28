// app/components/sketch/PolygonVertexEditor.tsx
"use client";

import React from "react";
import { Line, Circle } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";

import { useSketchStore, type SketchShape } from "@/app/store/sketchStore";

interface PolygonVertexEditorProps {
  shape: SketchShape;
}

const GRID_SIZE = 20;
const MERGE_THRESHOLD = 8;

export default function PolygonVertexEditor({ shape }: PolygonVertexEditorProps) {
  const updateShape = useSketchStore((s) => s.updateShape);
  const exitVertexEditMode = useSketchStore((s) => s.exitVertexEditMode);

  if (!shape.points || shape.points.length < 4) return null;

  const points = shape.points;

  const handleVertexDragMove = (
    e: KonvaEventObject<DragEvent>,
    index: number
  ) => {
    const node = e.target;
    let x = node.x();
    let y = node.y();

    // Snap to grid
    x = Math.round(x / GRID_SIZE) * GRID_SIZE;
    y = Math.round(y / GRID_SIZE) * GRID_SIZE;

    const newPoints = [...points];
    newPoints[index] = x;
    newPoints[index + 1] = y;

    // Merge with nearby vertices
    for (let i = 0; i < newPoints.length; i += 2) {
      if (i === index) continue;
      const vx = newPoints[i];
      const vy = newPoints[i + 1];

      const dx = vx - x;
      const dy = vy - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= MERGE_THRESHOLD) {
        newPoints[index] = vx;
        newPoints[index + 1] = vy;
        break;
      }
    }

    updateShape(shape.id, { points: newPoints });
  };

  const handleBackgroundClick = (e: KonvaEventObject<MouseEvent>) => {
    // If click is not on a vertex or polygon, exit vertex mode
    const target = e.target;
    const name = target.name();

    if (name !== "vertex-handle" && name !== "vertex-outline") {
      exitVertexEditMode();
    }
  };

  return (
    <>
      {/* Transparent background to detect click outside */}
      <Line
        points={[]}
        listening={true}
        onMouseDown={handleBackgroundClick}
      />

      {/* Polygon / triangle / line outline */}
      <Line
        points={points}
        stroke="#2563eb"
        strokeWidth={2}
        closed={shape.type !== "line"}
        name="vertex-outline"
      />

      {/* Vertex handles */}
      {points.map((_, i) => {
        if (i % 2 !== 0) return null;
        const x = points[i];
        const y = points[i + 1];

        return (
          <Circle
            key={i}
            x={x}
            y={y}
            radius={6}
            fill="white"
            stroke="#2563eb"
            strokeWidth={2}
            draggable
            name="vertex-handle"
            onDragMove={(e) => handleVertexDragMove(e, i)}
          />
        );
      })}
    </>
  );
}
