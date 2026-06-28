"use client";

import React from "react";
import { Rect } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";

interface ResizeHandleProps {
  x: number;
  y: number;
  size?: number; // default 6
  position:
    | "top-left"
    | "top"
    | "top-right"
    | "right"
    | "bottom-right"
    | "bottom"
    | "bottom-left"
    | "left";
  onMouseDown?: (e: KonvaEventObject<MouseEvent>) => void;
}

const getCursorForPosition = (position: ResizeHandleProps["position"]) => {
  switch (position) {
    case "top-left":
    case "bottom-right":
      return "nwse-resize";
    case "top-right":
    case "bottom-left":
      return "nesw-resize";
    case "left":
    case "right":
      return "ew-resize";
    case "top":
    case "bottom":
      return "ns-resize";
    default:
      return "default";
  }
};

export default function ResizeHandle({
  x,
  y,
  size = 6,
  position,
  onMouseDown,
}: ResizeHandleProps) {
  const half = size / 2;

  const handleMouseEnter = (e: KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = getCursorForPosition(position);
  };

  const handleMouseLeave = (e: KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = "default";
  };

  return (
    <Rect
      x={x - half}
      y={y - half}
      width={size}
      height={size}
      fill="#2563eb"
      stroke="#2563eb"
      strokeWidth={1}
      listening={true}
      onMouseDown={onMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      perfectDrawEnabled
    />
  );
}
