"use client";

import React from "react";
import { Line } from "react-konva";

interface GridLayerProps {
  width: number;
  height: number;
  size?: number; // grid spacing (default 20px)
}

export default function GridLayer({ width, height, size = 20 }: GridLayerProps) {
  const lines: React.ReactNode[] = [];

  // Vertical grid lines
  for (let x = 0; x <= width; x += size) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke="#e5e5e5"
        strokeWidth={1}
        listening={false}
      />
    );
  }

  // Horizontal grid lines
  for (let y = 0; y <= height; y += size) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke="#e5e5e5"
        strokeWidth={1}
        listening={false}
      />
    );
  }

  return <>{lines}</>;
}
