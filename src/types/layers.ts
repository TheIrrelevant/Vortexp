// src/types/layers.ts

/**
 * Layers Panel Types
 */

export interface LayerNode {
  id: string;
  name: string;
  type: LayerType;
  
  // Hierarchy
  parentId: string | null;
  children: LayerNode[];
  
  // Visibility
  visible: boolean;
  locked: boolean;
  
  // Selection
  selected: boolean;
  
  // Depth for indentation
  depth: number;
  
  // Icon
  icon: string;
}

export type LayerType = 
  | 'FRAME'
  | 'GROUP'
  | 'COMPONENT'
  | 'INSTANCE'
  | 'RECTANGLE'
  | 'ELLIPSE'
  | 'VECTOR'
  | 'TEXT'
  | 'LINE'
  | 'BOOLEAN_OPERATION';

export interface LayerTreeState {
  layers: LayerNode[];
  selectedIds: string[];
  expandedIds: string[];
  draggedId: string | null;
  dropTargetId: string | null;
  dropPosition: 'before' | 'after' | 'inside';
}

/**
 * Layer Operations
 */
export type LayerOperation = 
  | 'rename'
  | 'delete'
  | 'duplicate'
  | 'group'
  | 'ungroup'
  | 'bringToFront'
  | 'sendToBack'
  | 'bringForward'
  | 'sendBackward'
  | 'lock'
  | 'unlock'
  | 'hide'
  | 'show';
