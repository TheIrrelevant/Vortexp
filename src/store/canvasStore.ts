// src/store/canvasStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CanvasState, ToolType, Shape, ShapeStyle } from '../types/canvas';

interface CanvasStore extends CanvasState {
  // Actions
  setCurrentTool: (tool: ToolType) => void;
  addShape: (shape: Shape) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  selectShape: (id: string | null) => void;
  setIsDrawing: (drawing: boolean) => void;
  updateShapeStyle: (id: string, style: Partial<ShapeStyle>) => void;
  clearCanvas: () => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  
  // Tool config
  toolConfig: ShapeStyle;
  updateToolConfig: (config: Partial<ShapeStyle>) => void;
}

export const useCanvasStore = create<CanvasStore>()(
  immer((set) => ({
    // Initial state
    shapes: [],
    selectedId: null,
    currentTool: 'select',
    isDrawing: false,
    zoom: 1,
    pan: { x: 0, y: 0 },
    toolConfig: {
      fill: '#3B82F6',
      stroke: '#F9FEFF',
      strokeWidth: 2,
      opacity: 1
    },

    // Actions
    setCurrentTool: (tool) => set((state) => {
      state.currentTool = tool;
    }),

    addShape: (shape) => set((state) => {
      state.shapes.push(shape);
    }),

    updateShape: (id, updates) => set((state) => {
      const shape = state.shapes.find((s) => s.id === id);
      if (shape) {
        Object.assign(shape, updates);
      }
    }),

    deleteShape: (id) => set((state) => {
      state.shapes = state.shapes.filter((s) => s.id !== id);
      if (state.selectedId === id) {
        state.selectedId = null;
      }
    }),

    selectShape: (id) => set((state) => {
      state.selectedId = id;
    }),

    setIsDrawing: (drawing) => set((state) => {
      state.isDrawing = drawing;
    }),

    updateShapeStyle: (id, style) => set((state) => {
      const shape = state.shapes.find((s) => s.id === id);
      if (shape) {
        Object.assign(shape.style, style);
      }
    }),

    clearCanvas: () => set((state) => {
      state.shapes = [];
      state.selectedId = null;
    }),

    setZoom: (zoom) => set((state) => {
      state.zoom = Math.max(0.1, Math.min(5, zoom));
    }),

    setPan: (pan) => set((state) => {
      state.pan = pan;
    }),

    updateToolConfig: (config) => set((state) => {
      Object.assign(state.toolConfig, config);
    })
  }))
);
