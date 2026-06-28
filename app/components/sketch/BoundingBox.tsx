"use client";

import React, { useMemo, useRef } from "react";
import { Rect, Circle } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";

import { useSketchStore, type SketchShape } from "@/app/store/sketchStore";
import ResizeHandle from "./ResizeHandle";
import PolygonVertexEditor from "./PolygonVertexEditor";

interface BoundingBoxProps {
  shape: SketchShape;
  padding?: number;
}

type HandlePosition =
  | "top-left"
  | "top"
  | "top-right"
  | "right"
  | "bottom-right"
  | "bottom"
  | "bottom-left"
  | "left";

export default function BoundingBox({ shape, padding = 4 }: BoundingBoxProps) {
  const updateShape = useSketchStore((s) => s.updateShape);
  const vertexEditShapeId = useSketchStore((s) => s.vertexEditShapeId);

  // -----------------------------
  // HOOKS MUST BE AT THE TOP
  // -----------------------------
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const originalShape = useRef<SketchShape | null>(null);
  const activeHandle = useRef<HandlePosition | null>(null);
  const isDraggingShape = useRef(false);

  // Rotation state
  const isRotating = useRef(false);
  const rotationStartAngle = useRef(0);

  // -----------------------------
  // Compute bounds
  // -----------------------------
  const bounds = useMemo(() => {
    if (
      shape.type === "rectangle" &&
      shape.x !== undefined &&
      shape.y !== undefined &&
      shape.width !== undefined &&
      shape.height !== undefined
    ) {
      return {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      };
    }

    if (shape.points && shape.points.length >= 4) {
      const xs: number[] = [];
      const ys: number[] = [];

      for (let i = 0; i < shape.points.length; i += 2) {
        xs.push(shape.points[i]);
        ys.push(shape.points[i + 1]);
      }

      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    }

    return null;
  }, [shape]);

  if (!bounds) return null;

  const padded = {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
  };

  const cx = padded.x + padded.width / 2;
  const cy = padded.y + padded.height / 2;

  // Rotation handle position
  const rotationHandleY = padded.y - 24;

  // -----------------------------
  // Vertex edit mode routing (AFTER HOOKS)
  // -----------------------------
  if (
    vertexEditShapeId === shape.id &&
    (shape.type === "polygon" ||
      shape.type === "triangle" ||
      shape.type === "line")
  ) {
    return <PolygonVertexEditor shape={shape} />;
  }

  // -----------------------------
  // Begin rotation (SNAPPING VERSION)
  // -----------------------------
  const beginRotation = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;

    isRotating.current = true;
    originalShape.current = { ...shape };

    const dx = pointer.x - cx;
    const dy = pointer.y - cy;

    rotationStartAngle.current = Math.atan2(dy, dx);

    e.cancelBubble = true;
  };

  // -----------------------------
  // Rotation snapping helper
  // -----------------------------
  const snapAngle = (degrees: number) => {
    const snapIncrement = 15;
    const threshold = 6;

    const snapped = Math.round(degrees / snapIncrement) * snapIncrement;

    if (Math.abs(snapped - degrees) <= threshold) {
      return snapped;
    }

    return degrees;
  };

  // -----------------------------
  // Rotation logic (with snapping)
  // -----------------------------
  const handleRotationMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isRotating.current || !originalShape.current) return;

    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;

    const dx = pointer.x - cx;
    const dy = pointer.y - cy;

    const currentAngle = Math.atan2(dy, dx);
    const delta = currentAngle - rotationStartAngle.current;

    let degrees = (delta * 180) / Math.PI;

    // Apply snapping
    degrees = snapAngle(degrees);

    const orig = originalShape.current;

    // RECTANGLE
    if (orig.type === "rectangle") {
      updateShape(orig.id, {
        rotation: (orig.rotation ?? 0) + degrees,
      });
    }

    // LINE — rotate endpoints
    if (orig.type === "line" && orig.points) {
      const newPoints: number[] = [];
      const rad = (degrees * Math.PI) / 180;

      for (let i = 0; i < orig.points.length; i += 2) {
        const px = orig.points[i];
        const py = orig.points[i + 1];

        const rx = cx + (px - cx) * Math.cos(rad) - (py - cy) * Math.sin(rad);
        const ry = cy + (px - cx) * Math.sin(rad) + (py - cy) * Math.cos(rad);

        newPoints.push(rx, ry);
      }

      updateShape(orig.id, { points: newPoints });
    }

    // POLYGON / TRIANGLE — rotate all vertices
    if ((orig.type === "triangle" || orig.type === "polygon") && orig.points) {
      const newPoints: number[] = [];
      const rad = (degrees * Math.PI) / 180;

      for (let i = 0; i < orig.points.length; i += 2) {
        const px = orig.points[i];
        const py = orig.points[i + 1];

        const rx = cx + (px - cx) * Math.cos(rad) - (py - cy) * Math.sin(rad);
        const ry = cy + (px - cx) * Math.sin(rad) + (py - cy) * Math.cos(rad);

        newPoints.push(rx, ry);
      }

      updateShape(orig.id, { points: newPoints });
    }
  };

  const endRotation = () => {
    isRotating.current = false;
    originalShape.current = null;
  };

  // -----------------------------
  // DRAG + RESIZE LOGIC CONTINUES IN PART 2
  // -----------------------------
  // -----------------------------
  // Existing drag + resize logic
  // -----------------------------
  const beginHandleDrag = (
    e: KonvaEventObject<MouseEvent>,
    position: HandlePosition
  ) => {
    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;

    dragStart.current = { x: pointer.x, y: pointer.y };
    originalShape.current = { ...shape };
    activeHandle.current = position;
    isDraggingShape.current = false;
    isRotating.current = false;

    e.cancelBubble = true;
  };

  const beginShapeDrag = (e: KonvaEventObject<MouseEvent>) => {
    if (activeHandle.current || isRotating.current) return;

    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;

    dragStart.current = { x: pointer.x, y: pointer.y };
    originalShape.current = { ...shape };
    isDraggingShape.current = true;

    e.cancelBubble = true;
  };

  const handleStageMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    // Rotation takes priority
    if (isRotating.current) return handleRotationMove(e);

    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;

    const dx = pointer.x - (dragStart.current?.x ?? 0);
    const dy = pointer.y - (dragStart.current?.y ?? 0);

    const orig = originalShape.current;
    if (!orig) return;

    // -----------------------------
    // DRAG SHAPE
    // -----------------------------
    if (isDraggingShape.current) {
      if (orig.type === "rectangle") {
        updateShape(orig.id, { x: orig.x! + dx, y: orig.y! + dy });
      }

      if (orig.type === "line" && orig.points) {
        const pts = orig.points;
        updateShape(orig.id, {
          points: [pts[0] + dx, pts[1] + dy, pts[2] + dx, pts[3] + dy],
        });
      }

      if ((orig.type === "triangle" || orig.type === "polygon") && orig.points) {
        const newPoints: number[] = [];
        for (let i = 0; i < orig.points.length; i += 2) {
          newPoints.push(orig.points[i] + dx, orig.points[i + 1] + dy);
        }
        updateShape(orig.id, { points: newPoints });
      }

      return;
    }

    // -----------------------------
    // RESIZE SHAPE
    // -----------------------------
    if (!activeHandle.current) return;

    const pos = activeHandle.current;

    // RECTANGLE
    if (
      orig.type === "rectangle" &&
      orig.x !== undefined &&
      orig.y !== undefined &&
      orig.width !== undefined &&
      orig.height !== undefined
    ) {
      let x = orig.x;
      let y = orig.y;
      let w = orig.width;
      let h = orig.height;

      if (pos.includes("right")) w = orig.width + dx;
      if (pos.includes("left")) {
        x = orig.x + dx;
        w = orig.width - dx;
      }
      if (pos.includes("bottom")) h = orig.height + dy;
      if (pos.includes("top")) {
        y = orig.y + dy;
        h = orig.height - dy;
      }

      updateShape(orig.id, { x, y, width: w, height: h });
    }

    // LINE
    if (orig.type === "line" && orig.points) {
      const [x1, y1, x2, y2] = orig.points;

      let nx1 = x1;
      let ny1 = y1;
      let nx2 = x2;
      let ny2 = y2;

      if (pos.includes("left")) {
        nx1 = x1 + dx;
        ny1 = y1 + dy;
      }
      if (pos.includes("right")) {
        nx2 = x2 + dx;
        ny2 = y2 + dy;
      }

      updateShape(orig.id, { points: [nx1, ny1, nx2, ny2] });
    }

    // POLYGON / TRIANGLE (uniform scale)
    if (
      (orig.type === "triangle" || orig.type === "polygon") &&
      orig.points &&
      orig.points.length >= 6
    ) {
      const scaleX = 1 + dx / (bounds.width || 1);
      const scaleY = 1 + dy / (bounds.height || 1);

      const cxShape = bounds.x + bounds.width / 2;
      const cyShape = bounds.y + bounds.height / 2;

      const newPoints: number[] = [];

      for (let i = 0; i < orig.points.length; i += 2) {
        const px = orig.points[i];
        const py = orig.points[i + 1];

        const rx = cxShape + (px - cxShape) * scaleX;
        const ry = cyShape + (py - cyShape) * scaleY;

        newPoints.push(rx, ry);
      }

      updateShape(orig.id, { points: newPoints });
    }
  };

  const endDrag = () => {
    dragStart.current = null;
    originalShape.current = null;
    activeHandle.current = null;
    isDraggingShape.current = false;
    isRotating.current = false;
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <>
      {/* Bounding rectangle */}
      <Rect
        x={padded.x}
        y={padded.y}
        width={padded.width}
        height={padded.height}
        stroke="#2563eb"
        strokeWidth={2}
        listening={true}
        perfectDrawEnabled
        onMouseDown={beginShapeDrag}
        onMouseMove={handleStageMouseMove}
        onMouseUp={endDrag}
      />

      {/* Rotation handle */}
      <Circle
        x={cx}
        y={rotationHandleY}
        radius={8}
        fill="white"
        stroke="#2563eb"
        strokeWidth={2}
        listening={true}
        onMouseDown={beginRotation}
        onMouseMove={handleStageMouseMove}
        onMouseUp={endRotation}
      />

      {/* Resize handles */}
      <ResizeHandle x={padded.x} y={padded.y} position="top-left" onMouseDown={(e) => beginHandleDrag(e, "top-left")} />
      <ResizeHandle x={padded.x + padded.width} y={padded.y} position="top-right" onMouseDown={(e) => beginHandleDrag(e, "top-right")} />
      <ResizeHandle x={padded.x + padded.width} y={padded.y + padded.height} position="bottom-right" onMouseDown={(e) => beginHandleDrag(e, "bottom-right")} />
      <ResizeHandle x={padded.x} y={padded.y + padded.height} position="bottom-left" onMouseDown={(e) => beginHandleDrag(e, "bottom-left")} />

      <ResizeHandle x={cx} y={padded.y} position="top" onMouseDown={(e) => beginHandleDrag(e, "top")} />
      <ResizeHandle x={padded.x + padded.width} y={cy} position="right" onMouseDown={(e) => beginHandleDrag(e, "right")} />
      <ResizeHandle x={cx} y={padded.y + padded.height} position="bottom" onMouseDown={(e) => beginHandleDrag(e, "bottom")} />
      <ResizeHandle x={padded.x} y={cy} position="left" onMouseDown={(e) => beginHandleDrag(e, "left")} />
    </>
  );
}
