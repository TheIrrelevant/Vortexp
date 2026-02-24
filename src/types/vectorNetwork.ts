// src/types/vectorNetwork.ts

/**
 * Figma Vector Networks - 1:1 Implementation
 *
 * Difference from SVG Paths:
 * - SVG: Unidirectional path (A → B → C → D)
 * - Vector Network: Multi-directional graph (A ↔ B ↔ C, A ↔ D)
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
  controlIn?: ControlPoint;   // Incoming curve control point
  controlOut?: ControlPoint;  // Outgoing curve control point

  // Control point type
  type: ControlPointType;

  // Connected segments
  connectedSegments: string[];
}

export interface Segment {
  id: string;
  startVertexId: string;
  endVertexId: string;
  
  // Segment-specific control points (different from vertex control points)
  controlStart?: ControlPoint;
  controlEnd?: ControlPoint;
}

export interface Region {
  id: string;
  windingRule: 'NONZERO' | 'EVENODD';
  
  // Closed paths (loops)
  loops: string[][];  // Each loop consists of vertex IDs
}

export interface VectorNetwork {
  id: string;
  vertices: Vertex[];
  segments: Segment[];
  regions: Region[];
  
  // Style
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

// Bezier curve calculation
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
