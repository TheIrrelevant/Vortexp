// src/types/boolean.ts

/**
 * Figma Boolean Operations - 1:1 Implementation
 * 
 * Boolean operations combine shapes using set operations.
 * Unlike traditional path operations, Figma's booleans are live - 
 * they update when source shapes change.
 */

export type BooleanOperationType = 'UNION' | 'SUBTRACT' | 'INTERSECT' | 'EXCLUDE';

export interface BooleanOperationResult {
  type: BooleanOperationType;
  inputPaths: PathData[];
  outputPath: PathData;
  isLive: boolean;
}

export interface PathData {
  points: Point2D[];
  closed: boolean;
  fillRule: 'nonzero' | 'evenodd';
}

export interface Point2D {
  x: number;
  y: number;
  
  // Bezier control points (optional)
  cp1In?: Point2D;
  cp1Out?: Point2D;
  cp2In?: Point2D;
  cp2Out?: Point2D;
}

/**
 * Boolean Operation Node - Figma File Format
 */
export interface BooleanOperationNode {
  id: string;
  type: 'BOOLEAN_OPERATION';
  booleanOperation: BooleanOperationType;
  
  // Input shapes (children)
  children: string[];
  
  // Result path
  pathData?: PathData;
  
  // Style
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  
  // Transform
  x: number;
  y: number;
  rotation: number;
}

/**
 * Visual representation of boolean operation
 */
export const BOOLEAN_OPERATION_ICONS: Record<BooleanOperationType, string> = {
  UNION: '⋃',
  SUBTRACT: '−',
  INTERSECT: '∩',
  EXCLUDE: '⊕'
};

export const BOOLEAN_OPERATION_LABELS: Record<BooleanOperationType, string> = {
  UNION: 'Union',
  SUBTRACT: 'Subtract',
  INTERSECT: 'Intersect', 
  EXCLUDE: 'Exclude'
};
