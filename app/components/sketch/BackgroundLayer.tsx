"use client";

import React from "react";
import { Image } from "react-konva";
import useImage from "use-image";
import { useSketchStore } from "@/app/store/sketchStore";

export default function BackgroundLayer() {
  const src = useSketchStore((s) => s.backgroundImage);

  const [img] = useImage(src || "", "anonymous");

  if (!src) return null;

  return (
    // eslint-disable-next-line jsx-a11y/alt-text
    <Image
      image={img}
      opacity={0.4}
      listening={false}
    />
  );
}
