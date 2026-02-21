// src/types/vectorNetwork.ts

/**
 * Figma Vector Networks - 1:1 Implementation
 * 
 * SVG Path'ten farkı:
 * - SVG: Tek yönlü path (A → B → C → D)
 * - Vector Network: Çok yönlü graf (A ↔ B ↔ C, A ↔ D)
 */

export type ControlPointType = 'STRAIGHT' | 'MIRRORED' | 'ASYMMETRIC' | 'DISCONNECTED';

export interface Point {
  x: number;
  y: number;
}

export interface ControlPoint {
  x: number;
  y: number;
}

export interface Vertex {
  id: string;
  x: number;
  y: number;
  
  // Bezier control points
  controlIn?: ControlPoint;   // Gelen eğri control point
  controlOut?: ControlPoint;  // Giden eğri control point
  
  // Control point tipi
  type: ControlPointType;
  
  // Bağlı olduğu segment'ler
  connectedSegments: string[];
}

export interface Segment {
  id: string;
  startVertexId: string;
  endVertexId: string;
  
  // Segment'e özel control points (vertex'lerden farklı)
  controlStart?: ControlPoint;
  controlEnd?: ControlPoint;
}

export interface Region {
  id: string;
  windingRule: 'NONZERO' | 'EVENODD';
  
  // Kapalı path'ler (loop'lar)
  loops: string[][];  // Her loop vertex ID'lerinden oluşur
}

export interface VectorNetwork {
  id: string;
  vertices: Vertex[];
  segments: Segment[];
  regions: Region[];
  
  // Stil
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  
  // Transform
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

// Bezier curve hesaplama için
export interface BezierCurve {
  p0: Point;  // Start point
  p1: Point;  // Control point 1
  p2: Point;  // Control point 2
  p3: Point;  // End point
}

// Pen tool state
export interface PenToolState {
  isDrawing: boolean;
  currentVertexId: string | null;
  previewSegment: Segment | null;
  isClosed: boolean;
  tempControlPoint: ControlPoint | null;
}

// Editing state
export interface EditingState {
  selectedVertexIds: string[];
  selectedSegmentIds: string[];
  hoveredVertexId: string | null;
  hoveredSegmentId: string | null;
  isDraggingControlPoint: boolean;
  activeControlPointType: 'in' | 'out' | null;
}

// Path command for SVG export
export type PathCommand = 
  | { type: 'M'; x: number; y: number }
  | { type: 'L'; x: number; y: number }
  | { type: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { type: 'Q'; x1: number; y1: number; x: number; y: number }
  | { type: 'Z' };
