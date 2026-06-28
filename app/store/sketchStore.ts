import { create } from "zustand";

export type SketchShapeType =
  | "rectangle"
  | "triangle"
  | "line"
  | "polygon"
  | "circle"
  | "arc";

export type SketchShape = {
  id: string;
  type: SketchShapeType;

  // Basic geometry
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  points?: number[];

  // Visuals
  stroke?: string;
  strokeWidth?: number;
  rotation?: number;

  // Future-proofing
  layerId?: string;
  groupId?: string;
};

interface SketchState {
  shapes: SketchShape[];
  zoom: number;
  tool: string;
  backgroundImage: string | null;

  // Selection
  selectedShapeId: string | null;

  // Vertex edit mode
  vertexEditShapeId: string | null;
  enterVertexEditMode: (id: string) => void;
  exitVertexEditMode: () => void;

  // Undo/Redo stacks (shape history only)
  past: SketchShape[][];
  future: SketchShape[][];

  // Tool / view
  setTool: (tool: string) => void;
  setZoom: (zoom: number) => void;
  setBackgroundImage: (src: string) => void;

  // Selection
  setSelectedShape: (id: string | null) => void;
  clearSelection: () => void;

  // Shape operations
  addShape: (shape: SketchShape) => void;
  updateShape: (id: string, updates: Partial<SketchShape>) => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
}

export const useSketchStore = create<SketchState>((set, get) => ({
  shapes: [],
  zoom: 1,
  tool: "select",
  backgroundImage: null,

  selectedShapeId: null,

  // -----------------------------
  // Vertex edit mode
  // -----------------------------
  vertexEditShapeId: null,

  enterVertexEditMode: (id) =>
    set({
      vertexEditShapeId: id,
    }),

  exitVertexEditMode: () =>
    set({
      vertexEditShapeId: null,
    }),

  past: [],
  future: [],

  // -----------------------------
  // Tool / view
  // -----------------------------
  setTool: (tool) => set({ tool }),
  setZoom: (zoom) => set({ zoom }),
  setBackgroundImage: (src) => set({ backgroundImage: src }),

  // -----------------------------
  // Selection
  // -----------------------------
  setSelectedShape: (id) => set({ selectedShapeId: id }),
  clearSelection: () => set({ selectedShapeId: null }),

  // -----------------------------
  // Shape operations
  // -----------------------------
  addShape: (shape) => {
    const { shapes, past } = get();

    set({
      past: [...past, shapes],
      shapes: [...shapes, shape],
      future: [],
    });
  },

  updateShape: (id, updates) => {
    const { shapes, past } = get();

    const newShapes = shapes.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );

    set({
      past: [...past, shapes],
      shapes: newShapes,
      future: [],
    });
  },

  // -----------------------------
  // Undo / Redo
  // -----------------------------
  undo: () => {
    const { past, shapes, future } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    set({
      shapes: previous,
      past: newPast,
      future: [shapes, ...future],
    });
  },

  redo: () => {
    const { past, shapes, future } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      shapes: next,
      past: [...past, shapes],
      future: newFuture,
    });
  },
}));
