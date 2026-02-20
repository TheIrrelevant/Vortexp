// src/types/canvas.ts
export type ToolType = 'select' | 'rectangle' | 'ellipse' | 'line' | 'pen';

export interface Point {
  x: number;
  y: number;
}

export interface ShapeStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
}

export interface BaseShape {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  style: ShapeStyle;
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  width: number;
  height: number;
  rx?: number;
  ry?: number;
}

export interface EllipseShape extends BaseShape {
  type: 'ellipse';
  rx: number;
  ry: number;
}

export interface LineShape extends BaseShape {
  type: 'line';
  x2: number;
  y2: number;
}

export type Shape = RectangleShape | EllipseShape | LineShape;

export interface CanvasState {
  shapes: Shape[];
  selectedId: string | null;
  currentTool: ToolType;
  isDrawing: boolean;
  zoom: number;
  pan: Point;
}

export interface ToolConfig {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
}
