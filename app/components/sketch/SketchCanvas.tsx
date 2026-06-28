"use client";

import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer } from "react-konva";
import type { Stage as StageType } from "konva/lib/Stage";
import type { KonvaEventObject } from "konva/lib/Node";

import {
  useSketchStore,
  type SketchShape,
} from "@/app/store/sketchStore";

import GridLayer from "./GridLayer";
import BackgroundLayer from "./BackgroundLayer";

import RectangleShape from "./shapes/RectangleShape";
import TriangleShape from "./shapes/TriangleShape";
import LineShape from "./shapes/LineShape";
import PolygonShape from "./shapes/PolygonShape";
import BoundingBox from "./BoundingBox";

// -----------------------------
// Snapping helpers
// -----------------------------

const GRID_SIZE = 20;
const SNAP_RADIUS = 10;

const snapToGrid = (value: number, grid = GRID_SIZE) =>
  Math.round(value / grid) * grid;

const snapToAngle = (dx: number, dy: number) => {
  const angle = Math.atan2(dy, dx);
  const snapAngles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI];
  let closest = snapAngles[0];

  for (const a of snapAngles) {
    if (Math.abs(angle - a) < Math.abs(angle - closest)) {
      closest = a;
    }
  }

  const length = Math.sqrt(dx * dx + dy * dy);
  return {
    dx: Math.cos(closest) * length,
    dy: Math.sin(closest) * length,
  };
};

const snapToPoints = (x: number, y: number, shapes: SketchShape[]) => {
  for (const s of shapes) {
    if (s.points) {
      for (let i = 0; i < s.points.length; i += 2) {
        const px = s.points[i];
        const py = s.points[i + 1];
        if (Math.hypot(x - px, y - py) < SNAP_RADIUS) {
          return { x: px, y: py };
        }
      }
    }
    if (s.x !== undefined && s.y !== undefined) {
      if (Math.hypot(x - s.x, y - s.y) < SNAP_RADIUS) {
        return { x: s.x, y: s.y };
      }
    }
  }
  return null;
};

const getCursorForTool = (tool: string) => {
  if (tool === "pan") return "grab";
  if (
    tool === "line" ||
    tool === "rectangle" ||
    tool === "triangle" ||
    tool === "polygon" ||
    tool === "circle" ||
    tool === "arc"
  ) {
    return "crosshair";
  }
  if (tool === "select") return "default";
  return "default";
};

// -----------------------------
// Component
// -----------------------------

export default function SketchCanvas() {
  const stageRef = useRef<StageType | null>(null);

  const zoom = useSketchStore((s) => s.zoom);
  const shapes = useSketchStore((s) => s.shapes);
  const tool = useSketchStore((s) => s.tool);
  const addShape = useSketchStore((s) => s.addShape);
  const updateShape = useSketchStore((s) => s.updateShape);
  const undo = useSketchStore((s) => s.undo);
  const redo = useSketchStore((s) => s.redo);
  const clearSelection = useSketchStore((s) => s.clearSelection);

  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight - 50,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const isDrawing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const currentShapeId = useRef<string | null>(null);

  const polygonActive = useRef(false);
  const polygonPoints = useRef<number[]>([]);

  const getPointer = () => {
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!pointer) return null;

    let x = pointer.x;
    let y = pointer.y;

    // 1) Snap to existing vertices first
    const snapPoint = snapToPoints(x, y, shapes);
    if (snapPoint) {
      x = snapPoint.x;
      y = snapPoint.y;
    } else {
      // 2) Then snap to grid
      x = snapToGrid(x);
      y = snapToGrid(y);
    }

    return { x, y };
  };

  // -----------------------------
  // Canvas click (for deselection)
  // -----------------------------

  const handleStageMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const clickedOnEmpty = e.target === stage;

    if (clickedOnEmpty && tool === "select") {
      clearSelection();
    }

    // Then delegate to drawing logic
    handleMouseDown();
  };

  // -----------------------------
  // Mouse Down (drawing)
  // -----------------------------

  const handleMouseDown = () => {
    const pointer = getPointer();
    if (!pointer) return;

    // PAN tool: let Stage handle dragging, no drawing
    if (tool === "pan") {
      return;
    }

    // SELECT tool: no drawing (selection will be handled in shape components later)
    if (tool === "select") {
      return;
    }

    // RECTANGLE
    if (tool === "rectangle") {
      isDrawing.current = true;
      startPos.current = pointer;

      const id = crypto.randomUUID();
      currentShapeId.current = id;

      addShape({
        id,
        type: "rectangle",
        x: pointer.x,
        y: pointer.y,
        width: 0,
        height: 0,
        stroke: "black",
        strokeWidth: 2,
        rotation: 0,
      });
    }

    // TRIANGLE
    if (tool === "triangle") {
      isDrawing.current = true;
      startPos.current = pointer;

      const id = crypto.randomUUID();
      currentShapeId.current = id;

      addShape({
        id,
        type: "triangle",
        points: [
          pointer.x,
          pointer.y,
          pointer.x,
          pointer.y,
          pointer.x,
          pointer.y,
        ],
        stroke: "black",
        strokeWidth: 2,
        rotation: 0,
      });
    }

    // LINE
    if (tool === "line") {
      isDrawing.current = true;
      startPos.current = pointer;

      const id = crypto.randomUUID();
      currentShapeId.current = id;

      addShape({
        id,
        type: "line",
        points: [pointer.x, pointer.y, pointer.x, pointer.y],
        stroke: "black",
        strokeWidth: 2,
        rotation: 0,
      });
    }

    // POLYGON
    if (tool === "polygon") {
      if (!polygonActive.current) {
        polygonActive.current = true;
        polygonPoints.current = [pointer.x, pointer.y];

        const id = crypto.randomUUID();
        currentShapeId.current = id;

        addShape({
          id,
          type: "polygon",
          points: polygonPoints.current,
          stroke: "black",
          strokeWidth: 2,
          rotation: 0,
        });
      } else {
        polygonPoints.current.push(pointer.x, pointer.y);
        updateShape(currentShapeId.current!, {
          points: [...polygonPoints.current],
        });
      }
    }

    // Circle / Arc: will be implemented later
  };

  // -----------------------------
  // Mouse Move (drawing)
  // -----------------------------

  const handleMouseMove = () => {
    const pointer = getPointer();
    if (!pointer) return;

    const { x: x1, y: y1 } = startPos.current;
    let { x: x2, y: y2 } = pointer;

    // PAN tool: let Stage handle dragging
    if (tool === "pan") {
      return;
    }

    // RECTANGLE
    if (tool === "rectangle" && isDrawing.current) {
      updateShape(currentShapeId.current!, {
        width: x2 - x1,
        height: y2 - y1,
      });
    }

    // TRIANGLE
    if (tool === "triangle" && isDrawing.current) {
      const mx = (x1 + x2) / 2;
      const my = y1 - Math.abs(x2 - x1) * 0.5;

      updateShape(currentShapeId.current!, {
        points: [x1, y1, x2, y2, mx, my],
      });
    }

    // LINE (angle snapping last)
    if (tool === "line" && isDrawing.current) {
      const { dx, dy } = snapToAngle(x2 - x1, y2 - y1);
      x2 = x1 + dx;
      y2 = y1 + dy;

      updateShape(currentShapeId.current!, {
        points: [x1, y1, x2, y2],
      });
    }

    // POLYGON (live preview with angle snapping on last segment)
    if (tool === "polygon" && polygonActive.current) {
      const pts = [...polygonPoints.current];
      const lastX = pts[pts.length - 2];
      const lastY = pts[pts.length - 1];

      const { dx, dy } = snapToAngle(x2 - lastX, y2 - lastY);
      const px = lastX + dx;
      const py = lastY + dy;

      const preview = [...pts, px, py];
      updateShape(currentShapeId.current!, { points: preview });
    }
  };

  // -----------------------------
  // Mouse Up
  // -----------------------------

  const handleMouseUp = () => {
    if (tool === "polygon") return;

    isDrawing.current = false;
    currentShapeId.current = null;
  };

  // -----------------------------
  // Double Click (finish polygon)
  // -----------------------------

  const handleDoubleClick = () => {
    if (tool === "polygon" && polygonActive.current) {
      polygonActive.current = false;
      polygonPoints.current = [];
      currentShapeId.current = null;
    }
  };

  if (size.width === 0) return null;

  const cursor = getCursorForTool(tool);

  // -----------------------------
  // Render
  // -----------------------------

  return (
    <div
      className="w-full h-full overflow-hidden"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.ctrlKey && e.key === "z") undo();
        if (e.ctrlKey && e.key === "y") redo();
      }}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        scaleX={zoom}
        scaleY={zoom}
        draggable={tool === "pan"}
        style={{ backgroundColor: "#fafafa", cursor }}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDblClick={handleDoubleClick}
      >
        {/* Grid */}
        <Layer listening={false}>
          <GridLayer width={size.width} height={size.height} size={GRID_SIZE} />
        </Layer>
  
        {/* Background image */}
        <Layer listening={false}>
          <BackgroundLayer />
        </Layer>
  
        {/* Shapes */}
        <Layer>
          {shapes.map((shape) => {
            if (shape.type === "rectangle") {
              return <RectangleShape key={shape.id} shape={shape} />;
            }
  
            if (shape.type === "triangle") {
              return <TriangleShape key={shape.id} shape={shape} />;
            }
  
            if (shape.type === "line") {
              return <LineShape key={shape.id} shape={shape} />;
            }
  
            if (shape.type === "polygon") {
              return <PolygonShape key={shape.id} shape={shape} />;
            }
  
            return null;
          })}
        </Layer>
  
        {/* Bounding Box (always above shapes) */}
        <Layer listening={false}>
          {(() => {
            const selectedShapeId = useSketchStore.getState().selectedShapeId;
            if (!selectedShapeId) return null;
  
            const selectedShape = shapes.find(
              (s) => s.id === selectedShapeId
            );
            if (!selectedShape) return null;
  
            return <BoundingBox shape={selectedShape} />;
          })()}
        </Layer>
      </Stage>
    </div>
  );  
}
