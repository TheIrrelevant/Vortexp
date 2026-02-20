// src/canvas/CanvasEngine.ts
import { fabric, getCanvasDimensions, createGridPattern } from './fabricSetup';
import { nanoid } from 'nanoid';
import { useCanvasStore } from '../store/canvasStore';
import type { ToolType, Point, Shape, ShapeStyle } from '../types/canvas';

export class CanvasEngine {
  private canvas: any | null = null;
  private container: HTMLElement | null = null;
  private isDrawing = false;
  private startPoint: Point = { x: 0, y: 0 };
  private currentObject: any | null = null;
  private currentTool: ToolType = 'select';

  initialize(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container #${containerId} not found`);
      return;
    }

    this.container = container;
    
    // Container boyutuna göre canvas boyutu hesapla
    const { width, height } = getCanvasDimensions(containerId);
    
    // Create canvas element
    const canvasEl = document.createElement('canvas');
    canvasEl.id = 'vortexp-canvas';
    container.appendChild(canvasEl);

    // Initialize Fabric canvas
    this.canvas = new fabric.Canvas(canvasEl, {
      width,
      height,
      backgroundColor: '#2a2a2a',
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
      selection: true,
      selectionBorderColor: '#3B82F6',
      selectionColor: 'rgba(59, 130, 246, 0.1)',
      selectionLineWidth: 1
    });

    this.setupEventListeners();
    this.setupGrid();
  }

  private setupEventListeners(): void {
    if (!this.canvas) return;

    // Subscribe to tool changes
    useCanvasStore.subscribe((state) => {
      this.currentTool = state.currentTool;
      this.updateCanvasMode();
    });

    // Mouse events
    this.canvas.on('mouse:down', (e: any) => this.handleMouseDown(e));
    this.canvas.on('mouse:move', (e: any) => this.handleMouseMove(e));
    this.canvas.on('mouse:up', () => this.handleMouseUp());
    
    // Selection events
    this.canvas.on('selection:created', (e: any) => {
      const selected = e.selected?.[0];
      if (selected) {
        useCanvasStore.getState().selectShape(selected.get('id') as string);
      }
    });

    this.canvas.on('selection:cleared', () => {
      useCanvasStore.getState().selectShape(null);
    });

    this.canvas.on('selection:updated', (e: any) => {
      const selected = e.selected?.[0];
      if (selected) {
        useCanvasStore.getState().selectShape(selected.get('id') as string);
      }
    });

    // Object modification
    this.canvas.on('object:modified', (e: any) => {
      const obj = e.target;
      if (obj) {
        this.syncObjectToStore(obj);
      }
    });
  }

  private updateCanvasMode(): void {
    if (!this.canvas) return;
    
    if (this.currentTool === 'select') {
      this.canvas.selection = true;
      this.canvas.isDrawingMode = false;
    } else {
      this.canvas.selection = false;
      this.canvas.isDrawingMode = false;
      this.canvas.discardActiveObject();
    }
  }

  private setupGrid(): void {
    if (!this.canvas) return;

    const gridGroup = createGridPattern(this.canvas, 20);
    this.canvas.add(gridGroup);
    gridGroup.sendToBack();
  }

  private handleMouseDown(e: any): void {
    if (this.currentTool === 'select') return;

    const pointer = this.canvas!.getPointer(e.e);
    this.startPoint = { x: pointer.x, y: pointer.y };
    this.isDrawing = true;

    const toolConfig = useCanvasStore.getState().toolConfig;

    switch (this.currentTool) {
      case 'rectangle':
        this.currentObject = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: toolConfig.fill,
          stroke: toolConfig.stroke,
          strokeWidth: toolConfig.strokeWidth,
          opacity: toolConfig.opacity,
          selectable: false
        });
        break;

      case 'ellipse':
        this.currentObject = new fabric.Ellipse({
          left: pointer.x,
          top: pointer.y,
          rx: 0,
          ry: 0,
          fill: toolConfig.fill,
          stroke: toolConfig.stroke,
          strokeWidth: toolConfig.strokeWidth,
          opacity: toolConfig.opacity,
          selectable: false
        });
        break;

      case 'line':
        this.currentObject = new fabric.Line(
          [pointer.x, pointer.y, pointer.x, pointer.y],
          {
            stroke: toolConfig.stroke,
            strokeWidth: toolConfig.strokeWidth,
            opacity: toolConfig.opacity,
            selectable: false
          }
        );
        break;
    }

    if (this.currentObject) {
      this.currentObject.set('id', nanoid());
      this.canvas!.add(this.currentObject);
    }
  }

  private handleMouseMove(e: any): void {
    if (!this.isDrawing || !this.currentObject) return;

    const pointer = this.canvas!.getPointer(e.e);

    switch (this.currentTool) {
      case 'rectangle':
        const rect = this.currentObject;
        rect.set({
          width: Math.abs(pointer.x - this.startPoint.x),
          height: Math.abs(pointer.y - this.startPoint.y),
          left: Math.min(pointer.x, this.startPoint.x),
          top: Math.min(pointer.y, this.startPoint.y)
        });
        break;

      case 'ellipse':
        const ellipse = this.currentObject;
        ellipse.set({
          rx: Math.abs(pointer.x - this.startPoint.x) / 2,
          ry: Math.abs(pointer.y - this.startPoint.y) / 2,
          left: Math.min(pointer.x, this.startPoint.x),
          top: Math.min(pointer.y, this.startPoint.y)
        });
        break;

      case 'line':
        const line = this.currentObject;
        line.set({
          x2: pointer.x,
          y2: pointer.y
        });
        break;
    }

    this.canvas!.renderAll();
  }

  private handleMouseUp(): void {
    if (!this.isDrawing || !this.currentObject) return;

    this.isDrawing = false;
    this.currentObject.set({ selectable: true });
    
    // Sync to store
    this.syncObjectToStore(this.currentObject);
    
    this.currentObject = null;
    this.canvas!.renderAll();
  }

  private syncObjectToStore(obj: any): void {
    const id = obj.get('id') as string;
    if (!id) return;

    const store = useCanvasStore.getState();
    const existingShape = store.shapes.find((s) => s.id === id);

    if (!existingShape) {
      // Create new shape
      const shape = this.fabricObjectToShape(obj);
      if (shape) {
        store.addShape(shape);
      }
    } else {
      // Update existing
      const updates = this.fabricObjectToShapeUpdates(obj);
      store.updateShape(id, updates);
    }
  }

  private fabricObjectToShape(obj: any): Shape | null {
    const id = obj.get('id') as string;
    const style: ShapeStyle = {
      fill: obj.fill as string || '#000000',
      stroke: obj.stroke as string || '#000000',
      strokeWidth: obj.strokeWidth as number || 1,
      opacity: obj.opacity as number || 1
    };

    if (obj instanceof fabric.Rect) {
      return {
        id,
        type: 'rectangle',
        x: obj.left!,
        y: obj.top!,
        width: obj.width! * (obj.scaleX || 1),
        height: obj.height! * (obj.scaleY || 1),
        style
      };
    }

    if (obj instanceof fabric.Ellipse) {
      return {
        id,
        type: 'ellipse',
        x: obj.left! + (obj.rx || 0),
        y: obj.top! + (obj.ry || 0),
        rx: (obj.rx || 0) * (obj.scaleX || 1),
        ry: (obj.ry || 0) * (obj.scaleY || 1),
        style
      };
    }

    if (obj instanceof fabric.Line) {
      return {
        id,
        type: 'line',
        x: (obj as any).x1,
        y: (obj as any).y1,
        x2: (obj as any).x2,
        y2: (obj as any).y2,
        style
      };
    }

    return null;
  }

  private fabricObjectToShapeUpdates(obj: any): Partial<Shape> {
    const updates: Partial<Shape> = {};

    if (obj instanceof fabric.Rect) {
      updates.x = obj.left!;
      updates.y = obj.top!;
      (updates as any).width = obj.width! * (obj.scaleX || 1);
      (updates as any).height = obj.height! * (obj.scaleY || 1);
    }

    if (obj instanceof fabric.Ellipse) {
      updates.x = obj.left! + (obj.rx || 0);
      updates.y = obj.top! + (obj.ry || 0);
      (updates as any).rx = (obj.rx || 0) * (obj.scaleX || 1);
      (updates as any).ry = (obj.ry || 0) * (obj.scaleY || 1);
    }

    if (obj instanceof fabric.Line) {
      (updates as any).x = (obj as any).x1;
      (updates as any).y = (obj as any).y1;
      (updates as any).x2 = (obj as any).x2;
      (updates as any).y2 = (obj as any).y2;
    }

    updates.style = {
      fill: obj.fill as string || '#000000',
      stroke: obj.stroke as string || '#000000',
      strokeWidth: obj.strokeWidth as number || 1,
      opacity: obj.opacity as number || 1
    };

    return updates;
  }

  // Public methods
  exportToSVG(): string {
    if (!this.canvas) return '';
    return this.canvas.toSVG();
  }

  exportToPNG(): string {
    if (!this.canvas) return '';
    return this.canvas.toDataURL({
      format: 'png',
      quality: 1
    });
  }

  clear(): void {
    if (!this.canvas) return;
    this.canvas.clear();
    this.setupGrid();
    useCanvasStore.getState().clearCanvas();
  }

  deleteSelected(): void {
    if (!this.canvas) return;
    const activeObject = this.canvas.getActiveObject();
    if (activeObject) {
      const id = activeObject.get('id') as string;
      this.canvas.remove(activeObject);
      useCanvasStore.getState().deleteShape(id);
    }
  }

  zoomIn(): void {
    const store = useCanvasStore.getState();
    store.setZoom(store.zoom * 1.2);
    this.applyZoom();
  }

  zoomOut(): void {
    const store = useCanvasStore.getState();
    store.setZoom(store.zoom / 1.2);
    this.applyZoom();
  }

  resetZoom(): void {
    useCanvasStore.getState().setZoom(1);
    this.applyZoom();
  }

  private applyZoom(): void {
    if (!this.canvas) return;
    const zoom = useCanvasStore.getState().zoom;
    this.canvas.setZoom(zoom);
    this.canvas.renderAll();
  }

  destroy(): void {
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
    }
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

export const canvasEngine = new CanvasEngine();
