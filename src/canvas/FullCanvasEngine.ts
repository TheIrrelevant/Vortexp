// src/canvas/FullCanvasEngine.ts

import { fabric } from './fabricSetup';
import { nanoid } from 'nanoid';
import { useCanvasStore, type ToolType, type Shape } from '../store/fullCanvasStore';
import { advancedShapesEngine } from '../shapes/AdvancedShapesEngine';
import { booleanOperationsEngine } from '../boolean/BooleanOperationsEngine';
import { autoLayoutEngine } from '../autolayout/AutoLayoutEngine';

/**
 * Full Canvas Engine - Figma Replica
 * 
 * Entegre:
 * - Tüm shape tools
 * - Pen tool (Vector Networks)
 * - Boolean operations
 * - Auto Layout
 * - Components
 * - Variables
 */
export class FullCanvasEngine {
  private canvas: any | null = null;
  private container: HTMLElement | null = null;
  private isDrawing = false;
  private startPoint = { x: 0, y: 0 };
  private currentObject: any = null;
  private currentTool: ToolType = 'select';
  
  // Drawing state
  private unsubscribe: (() => void) | null = null;

  initialize(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container #${containerId} not found`);
      return;
    }

    this.container = container;
    this.container.innerHTML = '';
    
    const canvasEl = document.createElement('canvas');
    canvasEl.id = 'vortexp-canvas';
    container.appendChild(canvasEl);

    const rect = container.getBoundingClientRect();
    
    this.canvas = new (fabric as any).Canvas(canvasEl, {
      width: rect.width - 40,
      height: rect.height - 40,
      backgroundColor: '#2a2a2a',
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
      selection: true,
      selectionBorderColor: '#3B82F6',
      selectionColor: 'rgba(59, 130, 246, 0.1)',
      selectionLineWidth: 1
    });

    this.setupGrid();
    this.setupEventListeners();
    this.subscribeToStore();
  }

  private setupGrid(): void {
    const gridSize = 20;
    const lines: any[] = [];
    const width = this.canvas.width;
    const height = this.canvas.height;

    for (let x = 0; x <= width; x += gridSize) {
      lines.push(new (fabric as any).Line([x, 0, x, height], {
        stroke: '#E2E7E9',
        strokeWidth: 0.5,
        opacity: 0.1,
        selectable: false,
        evented: false
      }));
    }

    for (let y = 0; y <= height; y += gridSize) {
      lines.push(new (fabric as any).Line([0, y, width, y], {
        stroke: '#E2E7E9',
        strokeWidth: 0.5,
        opacity: 0.1,
        selectable: false,
        evented: false
      }));
    }

    const gridGroup = new (fabric as any).Group(lines, {
      selectable: false,
      evented: false,
      data: { isGrid: true }
    });

    this.canvas.add(gridGroup);
    gridGroup.sendToBack();
  }

  private setupEventListeners(): void {
    if (!this.canvas) return;

    // Mouse events
    this.canvas.on('mouse:down', (e: any) => this.handleMouseDown(e));
    this.canvas.on('mouse:move', (e: any) => this.handleMouseMove(e));
    this.canvas.on('mouse:up', (e: any) => this.handleMouseUp(e));
    this.canvas.on('mouse:wheel', (e: any) => this.handleWheel(e));
    
    // Selection events
    this.canvas.on('selection:created', (e: any) => this.handleSelection(e));
    this.canvas.on('selection:updated', (e: any) => this.handleSelection(e));
    this.canvas.on('selection:cleared', () => this.handleSelectionClear());
    
    // Object events
    this.canvas.on('object:modified', (e: any) => this.handleObjectModified(e));
    this.canvas.on('object:moved', (e: any) => this.handleObjectMoved(e));
    this.canvas.on('object:scaled', (e: any) => this.handleObjectScaled(e));
  }

  private subscribeToStore(): void {
    this.unsubscribe = useCanvasStore.subscribe((state, prevState) => {
      // Tool changed
      if (state.tool !== prevState.tool) {
        this.currentTool = state.tool;
        this.updateCanvasMode();
      }
      
      // Selection changed from store
      if (state.selectedIds !== prevState.selectedIds) {
        this.syncSelectionFromStore(state.selectedIds);
      }
    });
  }

  private updateCanvasMode(): void {
    if (!this.canvas) return;
    
    const isSelectTool = this.currentTool === 'select' || this.currentTool === 'hand';
    this.canvas.selection = isSelectTool;
    this.canvas.defaultCursor = this.currentTool === 'hand' ? 'grab' : 'default';
  }

  // ==================== MOUSE HANDLERS ====================

  private handleMouseDown(e: any): void {
    const pointer = this.canvas.getPointer(e.e);
    this.startPoint = { x: pointer.x, y: pointer.y };

    if (this.currentTool === 'hand') {
      this.canvas.defaultCursor = 'grabbing';
      return;
    }

    if (this.currentTool === 'select') return;

    this.isDrawing = true;
    const store = useCanvasStore.getState();
    const config = store.toolConfig;

    switch (this.currentTool) {
      case 'rectangle':
        this.currentObject = new (fabric as any).Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: config.fill,
          stroke: config.stroke,
          strokeWidth: config.strokeWidth,
          opacity: config.opacity,
          selectable: false,
          data: { shapeType: 'rectangle' }
        });
        break;

      case 'ellipse':
        this.currentObject = new (fabric as any).Ellipse({
          left: pointer.x,
          top: pointer.y,
          rx: 0,
          ry: 0,
          fill: config.fill,
          stroke: config.stroke,
          strokeWidth: config.strokeWidth,
          opacity: config.opacity,
          selectable: false,
          data: { shapeType: 'ellipse' }
        });
        break;

      case 'line':
        this.currentObject = new (fabric as any).Line(
          [pointer.x, pointer.y, pointer.x, pointer.y],
          {
            stroke: config.stroke,
            strokeWidth: config.strokeWidth,
            opacity: config.opacity,
            selectable: false,
            data: { shapeType: 'line' }
          }
        );
        break;

      case 'polygon':
        this.currentObject = advancedShapesEngine.createPolygon(
          pointer.x, pointer.y, 0, 6,
          { ...config, rotation: 0 }
        );
        this.currentObject.set({ selectable: false, data: { shapeType: 'polygon' } });
        break;

      case 'star':
        this.currentObject = advancedShapesEngine.createStar(
          pointer.x, pointer.y, 0, 0, 5,
          { ...config, rotation: 0 }
        );
        this.currentObject.set({ selectable: false, data: { shapeType: 'star' } });
        break;

      case 'arrow':
        // Arrow will be created on mouse up
        break;

      case 'pen':
        this.handlePenDown(pointer);
        return;

      case 'text':
        this.createText(pointer.x, pointer.y);
        return;
    }

    if (this.currentObject) {
      this.canvas.add(this.currentObject);
    }
  }

  private handleMouseMove(e: any): void {
    if (!this.isDrawing) return;

    const pointer = this.canvas.getPointer(e.e);

    switch (this.currentTool) {
      case 'rectangle':
        if (this.currentObject) {
          this.currentObject.set({
            width: Math.abs(pointer.x - this.startPoint.x),
            height: Math.abs(pointer.y - this.startPoint.y),
            left: Math.min(pointer.x, this.startPoint.x),
            top: Math.min(pointer.y, this.startPoint.y)
          });
        }
        break;

      case 'ellipse':
        if (this.currentObject) {
          const rx = Math.abs(pointer.x - this.startPoint.x) / 2;
          const ry = Math.abs(pointer.y - this.startPoint.y) / 2;
          this.currentObject.set({
            rx, ry,
            left: Math.min(pointer.x, this.startPoint.x),
            top: Math.min(pointer.y, this.startPoint.y)
          });
        }
        break;

      case 'line':
        if (this.currentObject) {
          this.currentObject.set({ x2: pointer.x, y2: pointer.y });
        }
        break;

      case 'polygon':
      case 'star':
        if (this.currentObject) {
          const radius = Math.sqrt(
            Math.pow(pointer.x - this.startPoint.x, 2) +
            Math.pow(pointer.y - this.startPoint.y, 2)
          );
          // Re-create with new radius
          const config = useCanvasStore.getState().toolConfig;
          this.canvas.remove(this.currentObject);
          if (this.currentTool === 'polygon') {
            this.currentObject = advancedShapesEngine.createPolygon(
              this.startPoint.x, this.startPoint.y, radius, 6, config
            );
          } else {
            this.currentObject = advancedShapesEngine.createStar(
              this.startPoint.x, this.startPoint.y, radius, radius * 0.4, 5, config
            );
          }
          this.currentObject.set({ selectable: false });
          this.canvas.add(this.currentObject);
        }
        break;
    }

    this.canvas.renderAll();
  }

  private handleMouseUp(e: any): void {
    if (!this.isDrawing) return;

    const pointer = this.canvas.getPointer(e.e);

    if (this.currentTool === 'arrow') {
      this.createArrow(this.startPoint.x, this.startPoint.y, pointer.x, pointer.y);
    } else if (this.currentObject) {
      this.currentObject.set({ selectable: true });
      
      // Add to store
      const shape = this.objectToShape(this.currentObject);
      if (shape) {
        useCanvasStore.getState().addShape(shape);
        useCanvasStore.getState().selectShape(shape.id);
      }
    }

    this.isDrawing = false;
    this.currentObject = null;
    this.canvas.renderAll();
  }

  // ==================== PEN TOOL ====================

  private handlePenDown(pointer: { x: number; y: number }): void {
    const store = useCanvasStore.getState();
    const penState = store.penState;

    if (!penState.isDrawing) {
      // Start new path
      store.startPenPath(pointer.x, pointer.y);
    } else {
      // Add vertex
      store.addPenVertex(pointer.x, pointer.y);
    }
  }

  // ==================== SHAPE CREATION ====================

  private createText(x: number, y: number): void {
    const config = useCanvasStore.getState().toolConfig;
    
    const textObj = new (fabric as any).IText('Text', {
      left: x,
      top: y,
      fill: config.fill,
      fontFamily: 'Arial',
      fontSize: 16,
      selectable: true,
      data: { shapeType: 'text' }
    });

    this.canvas.add(textObj);
    this.canvas.setActiveObject(textObj);
    textObj.enterEditing();

    const shape = this.objectToShape(textObj);
    if (shape) {
      shape.text = 'Text';
      shape.fontSize = 16;
      shape.fontFamily = 'Arial';
      useCanvasStore.getState().addShape(shape);
      useCanvasStore.getState().selectShape(shape.id);
    }
  }

  private createArrow(x1: number, y1: number, x2: number, y2: number): void {
    const config = useCanvasStore.getState().toolConfig;
    
    const arrowObj = advancedShapesEngine.createArrow(x1, y1, x2, y2, {
      stroke: config.stroke,
      strokeWidth: config.strokeWidth,
      opacity: config.opacity,
      headType: 'arrow'
    });

    arrowObj.set({ data: { shapeType: 'arrow' } });
    this.canvas.add(arrowObj);

    const shape = this.objectToShape(arrowObj);
    if (shape) {
      useCanvasStore.getState().addShape(shape);
      useCanvasStore.getState().selectShape(shape.id);
    }
  }

  // ==================== OBJECT TO SHAPE ====================

  private objectToShape(obj: any): Shape | null {
    const id = nanoid();
    const shapeType = obj.data?.shapeType || 'rectangle';
    
    const base: Shape = {
      id,
      name: `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} ${id.slice(0, 4)}`,
      type: shapeType as any,
      x: obj.left || 0,
      y: obj.top || 0,
      rotation: obj.angle || 0,
      fill: obj.fill || '#3B82F6',
      stroke: obj.stroke || '#F9FEFF',
      strokeWidth: obj.strokeWidth || 2,
      opacity: obj.opacity || 1,
      parentId: null,
      children: [],
      locked: false,
      visible: true
    };

    if (shapeType === 'rectangle') {
      base.width = obj.width * (obj.scaleX || 1);
      base.height = obj.height * (obj.scaleY || 1);
      base.rx = obj.rx || 0;
    } else if (shapeType === 'ellipse') {
      base.width = (obj.rx || 0) * 2;
      base.height = (obj.ry || 0) * 2;
    } else if (shapeType === 'line') {
      base.width = Math.abs((obj.x2 || 0) - (obj.x1 || 0));
      base.height = Math.abs((obj.y2 || 0) - (obj.y1 || 0));
    }

    obj.set('id', id);
    return base;
  }

  // ==================== EVENT HANDLERS ====================

  private handleSelection(e: any): void {
    const selected = e.selected || [];
    const ids = selected.map((obj: any) => obj.get('id')).filter(Boolean);
    
    if (ids.length > 0) {
      useCanvasStore.getState().selectShape(ids[0]);
    }
  }

  private handleSelectionClear(): void {
    useCanvasStore.getState().clearSelection();
  }

  private handleObjectModified(e: any): void {
    const obj = e.target;
    if (!obj) return;

    const id = obj.get('id');
    if (!id) return;

    const updates: Partial<Shape> = {
      x: obj.left,
      y: obj.top,
      rotation: obj.angle,
      width: obj.width * (obj.scaleX || 1),
      height: obj.height * (obj.scaleY || 1),
      fill: obj.fill,
      stroke: obj.stroke,
      strokeWidth: obj.strokeWidth,
      opacity: obj.opacity
    };

    useCanvasStore.getState().updateShape(id, updates);
  }

  private handleObjectMoved(e: any): void {
    // Handled by object:modified
  }

  private handleObjectScaled(e: any): void {
    // Handled by object:modified
  }

  private handleWheel(e: any): void {
    e.e.preventDefault();
    const delta = e.e.deltaY;
    const zoom = this.canvas.getZoom();
    
    let newZoom = delta > 0 ? zoom * 0.9 : zoom * 1.1;
    newZoom = Math.max(0.1, Math.min(10, newZoom));
    
    this.canvas.setZoom(newZoom);
    useCanvasStore.getState().setZoom(newZoom);
  }

  private syncSelectionFromStore(selectedIds: string[]): void {
    if (!this.canvas) return;

    const currentSelection = this.canvas.getActiveObjects().map((o: any) => o.get('id'));
    
    if (JSON.stringify(currentSelection) !== JSON.stringify(selectedIds)) {
      this.canvas.discardActiveObject();
      
      if (selectedIds.length > 0) {
        const objects = selectedIds
          .map(id => this.canvas.getObjects().find((o: any) => o.get('id') === id))
          .filter(Boolean);
        
        if (objects.length === 1) {
          this.canvas.setActiveObject(objects[0]);
        } else if (objects.length > 1) {
          const selection = new (fabric as any).ActiveSelection(objects, { canvas: this.canvas });
          this.canvas.setActiveObject(selection);
        }
      }
      
      this.canvas.renderAll();
    }
  }

  // ==================== PUBLIC METHODS ====================

  bringToFront(): void {
    const active = this.canvas.getActiveObject();
    if (active) {
      active.bringToFront();
    }
  }

  sendToBack(): void {
    const active = this.canvas.getActiveObject();
    if (active) {
      active.sendToBack();
      // Keep grid at back
      const grid = this.canvas.getObjects().find((o: any) => o.data?.isGrid);
      if (grid) grid.sendToBack();
    }
  }

  group(): void {
    const activeSelection = this.canvas.getActiveObject();
    if (activeSelection?.type === 'activeSelection') {
      const group = activeSelection.toGroup();
      const ids = group.getObjects().map((o: any) => o.get('id'));
      useCanvasStore.getState().groupShapes(ids);
      this.canvas.renderAll();
    }
  }

  ungroup(): void {
    const active = this.canvas.getActiveObject();
    if (active?.type === 'group') {
      const id = active.get('id');
      const items = active.toActiveSelection();
      useCanvasStore.getState().ungroupShape(id);
      this.canvas.renderAll();
    }
  }

  deleteSelected(): void {
    const activeObjects = this.canvas.getActiveObjects();
    activeObjects.forEach((obj: any) => {
      const id = obj.get('id');
      if (id && !obj.data?.isGrid) {
        useCanvasStore.getState().deleteShape(id);
        this.canvas.remove(obj);
      }
    });
    this.canvas.discardActiveObject();
    this.canvas.renderAll();
  }

  clear(): void {
    this.canvas.clear();
    this.setupGrid();
    useCanvasStore.getState().clear();
  }

  exportSVG(): string {
    return this.canvas.toSVG();
  }

  exportPNG(): string {
    return this.canvas.toDataURL({ format: 'png', quality: 1 });
  }

  zoomIn(): void {
    const current = this.canvas.getZoom();
    this.canvas.setZoom(current * 1.2);
    useCanvasStore.getState().setZoom(current * 1.2);
  }

  zoomOut(): void {
    const current = this.canvas.getZoom();
    this.canvas.setZoom(current / 1.2);
    useCanvasStore.getState().setZoom(current / 1.2);
  }

  resetZoom(): void {
    this.canvas.setZoom(1);
    this.canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
    useCanvasStore.getState().setZoom(1);
  }

  destroy(): void {
    if (this.unsubscribe) this.unsubscribe();
    if (this.canvas) this.canvas.dispose();
    if (this.container) this.container.innerHTML = '';
  }
}

export const fullCanvasEngine = new FullCanvasEngine();
