// src/store/fullCanvasStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';

// ==================== TYPES ====================

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

// ==================== STORE ====================

interface CanvasStore {
  // Canvas state
  tool: ToolType;
  shapes: Shape[];
  selectedIds: string[];
  hoveredId: string | null;
  
  // Zoom & Pan
  zoom: number;
  panX: number;
  panY: number;
  
  // Tool config
  toolConfig: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
  };
  
  // Variables
  variableCollections: VariableCollection[];
  variables: Record<string, Variable>;
  
  // Pen tool state
  penState: {
    isDrawing: boolean;
    currentPathId: string | null;
    lastVertexId: string | null;
  };
  
  // Actions
  setTool: (tool: ToolType) => void;
  updateToolConfig: (config: Partial<CanvasStore['toolConfig']>) => void;
  
  addShape: (shape: Shape) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  deleteSelected: () => void;
  
  selectShape: (id: string | null, additive?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  
  moveShape: (id: string, dx: number, dy: number) => void;
  resizeShape: (id: string, width: number, height: number) => void;
  
  // Pen tool
  startPenPath: (x: number, y: number) => string;
  addPenVertex: (x: number, y: number) => string;
  closePenPath: () => void;
  
  // Layers
  reorderShape: (id: string, newIndex: number) => void;
  groupShapes: (ids: string[]) => string;
  ungroupShape: (id: string) => void;
  
  // Auto Layout
  setAutoLayout: (id: string, config: AutoLayoutConfig) => void;
  
  // Variables
  createVariable: (collectionId: string, name: string, type: 'color' | 'number' | 'string', value: any) => string;
  setVariableValue: (variableId: string, modeId: string, value: any) => void;
  switchMode: (collectionId: string, modeId: string) => void;
  
  clear: () => void;
}

export const useCanvasStore = create<CanvasStore>()(
  immer((set, get) => ({
    // Initial state
    tool: 'select',
    shapes: [],
    selectedIds: [],
    hoveredId: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    toolConfig: {
      fill: '#3B82F6',
      stroke: '#F9FEFF',
      strokeWidth: 2,
      opacity: 1
    },
    variableCollections: [],
    variables: {},
    penState: {
      isDrawing: false,
      currentPathId: null,
      lastVertexId: null
    },
    
    // Tool actions
    setTool: (tool) => set((state) => {
      state.tool = tool;
      state.penState.isDrawing = false;
      state.penState.currentPathId = null;
      state.penState.lastVertexId = null;
    }),
    
    updateToolConfig: (config) => set((state) => {
      Object.assign(state.toolConfig, config);
    }),
    
    // Shape actions
    addShape: (shape) => set((state) => {
      state.shapes.push(shape);
    }),
    
    updateShape: (id, updates) => set((state) => {
      const shape = state.shapes.find(s => s.id === id);
      if (shape) {
        Object.assign(shape, updates);
      }
    }),
    
    deleteShape: (id) => set((state) => {
      state.shapes = state.shapes.filter(s => s.id !== id && s.parentId !== id);
      state.selectedIds = state.selectedIds.filter(sid => sid !== id);
    }),
    
    deleteSelected: () => set((state) => {
      state.shapes = state.shapes.filter(s => !state.selectedIds.includes(s.id));
      state.selectedIds = [];
    }),
    
    // Selection
    selectShape: (id, additive = false) => set((state) => {
      if (id === null) {
        state.selectedIds = [];
      } else if (additive) {
        if (state.selectedIds.includes(id)) {
          state.selectedIds = state.selectedIds.filter(sid => sid !== id);
        } else {
          state.selectedIds.push(id);
        }
      } else {
        state.selectedIds = [id];
      }
    }),
    
    selectAll: () => set((state) => {
      state.selectedIds = state.shapes.map(s => s.id);
    }),
    
    clearSelection: () => set((state) => {
      state.selectedIds = [];
    }),
    
    // Zoom & Pan
    setZoom: (zoom) => set((state) => {
      state.zoom = Math.max(0.1, Math.min(10, zoom));
    }),
    
    setPan: (x, y) => set((state) => {
      state.panX = x;
      state.panY = y;
    }),
    
    // Transform
    moveShape: (id, dx, dy) => set((state) => {
      const shape = state.shapes.find(s => s.id === id);
      if (shape) {
        shape.x += dx;
        shape.y += dy;
      }
    }),
    
    resizeShape: (id, width, height) => set((state) => {
      const shape = state.shapes.find(s => s.id === id);
      if (shape) {
        shape.width = width;
        shape.height = height;
      }
    }),
    
    // Pen tool
    startPenPath: (x, y) => {
      const id = nanoid();
      const vertexId = nanoid();
      
      set((state) => {
        state.shapes.push({
          id,
          name: 'Path',
          type: 'vector',
          x: 0,
          y: 0,
          rotation: 0,
          fill: state.toolConfig.fill,
          stroke: state.toolConfig.stroke,
          strokeWidth: state.toolConfig.strokeWidth,
          opacity: state.toolConfig.opacity,
          parentId: null,
          children: [],
          locked: false,
          visible: true,
          vectorPath: {
            id: nanoid(),
            type: 'vector',
            vertices: [{
              id: vertexId,
              x, y,
              type: 'MIRRORED'
            }],
            segments: [],
            closed: false,
            fill: state.toolConfig.fill,
            stroke: state.toolConfig.stroke,
            strokeWidth: state.toolConfig.strokeWidth,
            opacity: state.toolConfig.opacity
          }
        });
        
        state.penState.isDrawing = true;
        state.penState.currentPathId = id;
        state.penState.lastVertexId = vertexId;
        state.selectedIds = [id];
      });
      
      return id;
    },
    
    addPenVertex: (x, y) => {
      const vertexId = nanoid();
      
      set((state) => {
        const shape = state.shapes.find(s => s.id === state.penState.currentPathId);
        if (!shape?.vectorPath) return;
        
        const newVertex: Vertex = {
          id: vertexId,
          x, y,
          type: 'MIRRORED'
        };
        
        shape.vectorPath.vertices.push(newVertex);
        
        if (state.penState.lastVertexId) {
          shape.vectorPath.segments.push({
            id: nanoid(),
            startVertexId: state.penState.lastVertexId,
            endVertexId: vertexId
          });
        }
        
        state.penState.lastVertexId = vertexId;
      });
      
      return vertexId;
    },
    
    closePenPath: () => set((state) => {
      const shape = state.shapes.find(s => s.id === state.penState.currentPathId);
      if (!shape?.vectorPath) return;
      
      const vertices = shape.vectorPath.vertices;
      if (vertices.length > 2) {
        shape.vectorPath.closed = true;
        shape.vectorPath.segments.push({
          id: nanoid(),
          startVertexId: vertices[vertices.length - 1].id,
          endVertexId: vertices[0].id
        });
      }
      
      state.penState.isDrawing = false;
      state.penState.currentPathId = null;
      state.penState.lastVertexId = null;
    }),
    
    // Layers
    reorderShape: (id, newIndex) => set((state) => {
      const index = state.shapes.findIndex(s => s.id === id);
      if (index === -1) return;
      
      const [shape] = state.shapes.splice(index, 1);
      state.shapes.splice(newIndex, 0, shape);
    }),
    
    groupShapes: (ids) => {
      const groupId = nanoid();
      
      set((state) => {
        const shapes = state.shapes.filter(s => ids.includes(s.id));
        
        state.shapes.push({
          id: groupId,
          name: 'Group',
          type: 'group',
          x: Math.min(...shapes.map(s => s.x)),
          y: Math.min(...shapes.map(s => s.y)),
          rotation: 0,
          fill: 'transparent',
          stroke: 'transparent',
          strokeWidth: 0,
          opacity: 1,
          parentId: null,
          children: ids,
          locked: false,
          visible: true
        });
        
        shapes.forEach(s => {
          s.parentId = groupId;
        });
        
        state.selectedIds = [groupId];
      });
      
      return groupId;
    },
    
    ungroupShape: (id) => set((state) => {
      const shape = state.shapes.find(s => s.id === id);
      if (!shape || shape.type !== 'group') return;
      
      shape.children.forEach(childId => {
        const child = state.shapes.find(s => s.id === childId);
        if (child) {
          child.parentId = null;
        }
      });
      
      state.shapes = state.shapes.filter(s => s.id !== id);
      state.selectedIds = shape.children;
    }),
    
    // Auto Layout
    setAutoLayout: (id, config) => set((state) => {
      const shape = state.shapes.find(s => s.id === id);
      if (shape) {
        shape.autoLayout = config;
      }
    }),
    
    // Variables
    createVariable: (collectionId, name, type, value) => {
      const id = nanoid();
      
      set((state) => {
        state.variables[id] = {
          id,
          name,
          type,
          values: {},
          scopes: []
        };
        
        const collection = state.variableCollections.find(c => c.id === collectionId);
        if (collection) {
          collection.modes.forEach(mode => {
            state.variables[id].values[mode.id] = value;
          });
          collection.variables.push(id);
        }
      });
      
      return id;
    },
    
    setVariableValue: (variableId, modeId, value) => set((state) => {
      const variable = state.variables[variableId];
      if (variable) {
        variable.values[modeId] = value;
      }
    }),
    
    switchMode: (collectionId, modeId) => set((state) => {
      const collection = state.variableCollections.find(c => c.id === collectionId);
      if (collection) {
        collection.activeModeId = modeId;
      }
    }),
    
    clear: () => set((state) => {
      state.shapes = [];
      state.selectedIds = [];
      state.penState = {
        isDrawing: false,
        currentPathId: null,
        lastVertexId: null
      };
    })
  }))
);
