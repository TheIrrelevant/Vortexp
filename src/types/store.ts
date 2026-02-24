// Shared type definitions for Vortexp canvas store

export type ToolType =
  | 'select'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'polygon'
  | 'star'
  | 'arrow'
  | 'pen'
  | 'text'
  | 'hand';

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
  controlIn?: ControlPoint;
  controlOut?: ControlPoint;
  type: ControlPointType;
}

export interface Segment {
  id: string;
  startVertexId: string;
  endVertexId: string;
}

export interface VectorPath {
  id: string;
  type: 'vector';
  vertices: Vertex[];
  segments: Segment[];
  closed: boolean;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
}

export interface Shape {
  id: string;
  name: string;
  type: 'rectangle' | 'ellipse' | 'line' | 'polygon' | 'star' | 'arrow' | 'vector' | 'text' | 'frame' | 'group' | 'component' | 'instance';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation: number;

  // Style
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;

  // Shape-specific
  rx?: number;  // corner radius
  ry?: number;
  sides?: number;  // polygon
  points?: number;  // star
  innerRadius?: number;  // star

  // Vector path
  vectorPath?: VectorPath;

  // Text
  text?: string;
  fontSize?: number;
  fontFamily?: string;

  // Hierarchy
  parentId: string | null;
  children: string[];
  locked: boolean;
  visible: boolean;

  // Auto Layout
  autoLayout?: AutoLayoutConfig;

  // Component
  componentId?: string;  // For instances
  isComponent?: boolean;
  overrides?: Record<string, any>;
}

export interface AutoLayoutConfig {
  enabled: boolean;
  direction: 'horizontal' | 'vertical';
  primaryAxisAlign: 'min' | 'center' | 'max' | 'space-between';
  counterAxisAlign: 'min' | 'center' | 'max' | 'stretch';
  gap: number;
  padding: { top: number; right: number; bottom: number; left: number };
  wrap: boolean;
}

export interface Variable {
  id: string;
  name: string;
  type: 'color' | 'number' | 'string';
  values: Record<string, any>;
  scopes: string[];
}

export interface VariableCollection {
  id: string;
  name: string;
  modes: { id: string; name: string }[];
  activeModeId: string;
  variables: string[];
}
