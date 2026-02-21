// src/types/advancedShapes.ts

/**
 * Advanced Shape Types
 */

export interface PolygonShape {
  id: string;
  type: 'POLYGON';
  x: number;
  y: number;
  
  // Polygon properties
  sides: number;          // 3-60
  rotation: number;
  radius: number;
  
  // Star properties (optional)
  isStar: boolean;
  innerRadius?: number;   // For star
  
  // Style
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
}

export interface StarShape {
  id: string;
  type: 'STAR';
  x: number;
  y: number;
  
  // Star properties
  points: number;         // 3-60
  innerRadius: number;    // Percentage of outer radius
  outerRadius: number;
  rotation: number;
  
  // Style
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
}

export interface ArrowShape {
  id: string;
  type: 'ARROW';
  
  // Line properties
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  
  // Arrow head properties
  headType: 'none' | 'arrow' | 'triangle' | 'circle' | 'diamond';
  tailType: 'none' | 'arrow' | 'triangle' | 'circle' | 'diamond';
  headSize: number;
  tailSize: number;
  
  // Style
  stroke: string;
  strokeWidth: number;
  opacity: number;
}

export interface ArcShape {
  id: string;
  type: 'ARC';
  x: number;
  y: number;
  
  // Arc properties
  radius: number;
  startAngle: number;     // Degrees
  endAngle: number;       // Degrees
  
  // Style
  stroke: string;
  strokeWidth: number;
  opacity: number;
}
