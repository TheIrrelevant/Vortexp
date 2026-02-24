// src/canvas/CanvasEngine.ts

import { fabric } from './fabricSetup';
import { nanoid } from 'nanoid';
import { useCanvasStore, type ToolType, type Shape } from '../store/canvasStore';
import { advancedShapesEngine } from '../shapes/AdvancedShapesEngine';
import { VectorNetworkEngine } from '../vector/VectorNetworkEngine';
import { FabricVectorNetwork } from './FabricVectorNetwork';

/**
 * Full Canvas Engine - Figma Replica
 *
 * Integrated modules:
 * - All shape tools (rect, ellipse, line, polygon, star, arrow, text)
 * - Pen tool with Vector Networks
 * - Boolean operations
 * - Auto Layout
 * - Components
 * - Variables
 */
export class CanvasEngine {
  private canvas: any | null = null;
  private container: HTMLElement | null = null;
  private isDrawing = false;
  private startPoint = { x: 0, y: 0 };
  private currentObject: any = null;
  private currentTool: ToolType = 'select';

  // Drawing state
  private unsubscribe: (() => void) | null = null;

  // Pan state
  private isPanning = false;
  private panStart = { x: 0, y: 0 };
  private resizeObserver: ResizeObserver | null = null;

  // Pen tool state
  private currentVectorNetwork: FabricVectorNetwork | null = null;
  private vectorEngine!: VectorNetworkEngine;
  private lastVertexId: string | null = null;
  private isPenDrawing = false;

  initialize(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container #${containerId} not found`);
      return;
    }

    this.container = container;
    this.container.innerHTML = '';
    this.vectorEngine = new VectorNetworkEngine();

    const canvasEl = document.createElement('canvas');
    canvasEl.id = 'vortexp-canvas';
    container.appendChild(canvasEl);

    const rect = container.getBoundingClientRect();

    this.canvas = new (fabric as any).Canvas(canvasEl, {
      width: rect.width,
      height: rect.height,
      backgroundColor: '#1a1a1a',
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
      selection: true,
      selectionBorderColor: '#3B82F6',
      selectionColor: 'rgba(59, 130, 246, 0.1)',
      selectionLineWidth: 1
    });

    this.setupEventListeners();
    this.subscribeToStore();
    this.setupResizeObserver();
    this.canvas.renderAll();
  }

  private drawInfiniteGrid(ctx: CanvasRenderingContext2D): void {
    const zoom = this.canvas.getZoom();
    const vpt = this.canvas.viewportTransform;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const gridSize = 20;
    // Larger grid every 5 cells
    const majorEvery = 5;

    // Viewport bounds in scene coordinates
    const left = -vpt[4] / zoom;
    const top = -vpt[5] / zoom;
    const right = left + w / zoom;
    const bottom = top + h / zoom;

    const startX = Math.floor(left / gridSize) * gridSize;
    const startY = Math.floor(top / gridSize) * gridSize;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Minor grid
    ctx.strokeStyle = 'rgba(226, 231, 233, 0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x <= right; x += gridSize) {
      if (x % (gridSize * majorEvery) === 0) continue;
      const sx = (x - left) * zoom;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
    }
    for (let y = startY; y <= bottom; y += gridSize) {
      if (y % (gridSize * majorEvery) === 0) continue;
      const sy = (y - top) * zoom;
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
    }
    ctx.stroke();

    // Major grid
    ctx.strokeStyle = 'rgba(226, 231, 233, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const majorSize = gridSize * majorEvery;
    const majorStartX = Math.floor(left / majorSize) * majorSize;
    const majorStartY = Math.floor(top / majorSize) * majorSize;
    for (let x = majorStartX; x <= right; x += majorSize) {
      const sx = (x - left) * zoom;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
    }
    for (let y = majorStartY; y <= bottom; y += majorSize) {
      const sy = (y - top) * zoom;
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
    }
    ctx.stroke();

    // Origin crosshair
    const ox = (0 - left) * zoom;
    const oy = (0 - top) * zoom;
    if (ox >= -1 && ox <= w + 1 && oy >= -1 && oy <= h + 1) {
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox, 0); ctx.lineTo(ox, h);
      ctx.moveTo(0, oy); ctx.lineTo(w, oy);
      ctx.stroke();
    }

    ctx.restore();
  }

  private setupResizeObserver(): void {
    if (!this.container) return;
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (this.canvas && width > 0 && height > 0) {
          this.canvas.setDimensions({ width, height });
          this.canvas.renderAll();
        }
      }
    });
    this.resizeObserver.observe(this.container);
  }

  private setupEventListeners(): void {
    if (!this.canvas) return;

    // Draw infinite grid before objects render
    this.canvas.on('before:render', ({ ctx }: { ctx: CanvasRenderingContext2D }) => {
      const context = ctx || this.canvas.contextContainer || this.canvas.getContext?.();
      if (context) {
        this.canvas.clearContext(context);
        this.drawInfiniteGrid(context);
      }
    });

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
    this.canvas.defaultCursor = this.currentTool === 'hand' ? 'grab'
      : isSelectTool ? 'default' : 'crosshair';

    // Toggle object interactivity based on tool
    this.canvas.getObjects().forEach((obj: any) => {
      obj.selectable = isSelectTool;
      obj.evented = isSelectTool;
    });
    this.canvas.renderAll();
  }

  // ==================== MOUSE HANDLERS ====================

  private handleMouseDown(e: any): void {
    const evt = e.e as MouseEvent;

    // Pan with hand tool, middle mouse button, or space+click
    if (this.currentTool === 'hand' || evt.button === 1) {
      this.isPanning = true;
      this.panStart = { x: evt.clientX, y: evt.clientY };
      this.canvas.defaultCursor = 'grabbing';
      this.canvas.selection = false;
      return;
    }

    const pointer = e.scenePoint ?? this.canvas.getScenePoint(evt);
    this.startPoint = { x: pointer.x, y: pointer.y };

    if (this.currentTool === 'select') return;

    this.isDrawing = true;
    const store = useCanvasStore.getState();
    const config = store.toolConfig;

    switch (this.currentTool) {
      case 'rectangle':
        this.currentObject = new (fabric as any).Rect({
          left: pointer.x,
          top: pointer.y,
          originX: 'left',
          originY: 'top',
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
          originX: 'left',
          originY: 'top',
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
    const evt = e.e as MouseEvent;

    // Handle panning
    if (this.isPanning) {
      const vpt = this.canvas.viewportTransform;
      vpt[4] += evt.clientX - this.panStart.x;
      vpt[5] += evt.clientY - this.panStart.y;
      this.panStart = { x: evt.clientX, y: evt.clientY };
      this.canvas.setViewportTransform(vpt);
      return;
    }

    const pointer = e.scenePoint ?? this.canvas.getScenePoint(evt);

    // Pen tool has its own move handling
    if (this.currentTool === 'pen') {
      const isDragging = e.e && (e.e.buttons === 1);
      this.handlePenMove(pointer, isDragging);
      return;
    }

    if (!this.isDrawing) return;

    switch (this.currentTool) {
      case 'rectangle':
        if (this.currentObject) {
          const rw = Math.abs(pointer.x - this.startPoint.x);
          const rh = Math.abs(pointer.y - this.startPoint.y);
          const rl = Math.min(pointer.x, this.startPoint.x);
          const rt = Math.min(pointer.y, this.startPoint.y);
          this.currentObject.set({ left: rl, top: rt, width: rw, height: rh });
          this.currentObject.setCoords();
        }
        break;

      case 'ellipse':
        if (this.currentObject) {
          const ew = Math.abs(pointer.x - this.startPoint.x);
          const eh = Math.abs(pointer.y - this.startPoint.y);
          const el = Math.min(pointer.x, this.startPoint.x);
          const et = Math.min(pointer.y, this.startPoint.y);
          this.currentObject.set({ left: el, top: et, rx: ew / 2, ry: eh / 2 });
          this.currentObject.setCoords();
        }
        break;

      case 'line':
        if (this.currentObject) {
          this.currentObject.set({ x2: pointer.x, y2: pointer.y });
          this.currentObject.setCoords();
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
    // End panning
    if (this.isPanning) {
      this.isPanning = false;
      this.canvas.defaultCursor = this.currentTool === 'hand' ? 'grab' : 'default';
      const isSelectTool = this.currentTool === 'select' || this.currentTool === 'hand';
      this.canvas.selection = isSelectTool;
      return;
    }

    // Pen tool has its own up handling
    if (this.currentTool === 'pen') {
      this.handlePenUp();
      return;
    }

    if (!this.isDrawing) return;

    const pointer = e.scenePoint ?? this.canvas.getScenePoint(e.e);

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

    // Switch back to select tool after drawing (Figma behavior)
    if (this.currentTool !== 'select' && this.currentTool !== 'hand') {
      useCanvasStore.getState().setTool('select');
    }
  }

  // ==================== PEN TOOL ====================

  private handlePenDown(pointer: { x: number; y: number }): void {
    // Start a new vector network if none exists
    if (!this.currentVectorNetwork) {
      const network = this.vectorEngine.createEmptyNetwork();
      const config = useCanvasStore.getState().toolConfig;
      network.fill = config.fill;
      network.stroke = config.stroke;
      network.strokeWidth = config.strokeWidth;
      this.vectorEngine.loadNetwork(network);

      this.currentVectorNetwork = new FabricVectorNetwork(network);
      this.canvas.add(this.currentVectorNetwork);
    }

    // Add vertex
    const vertex = this.vectorEngine.addVertex(pointer.x, pointer.y, 'MIRRORED');

    // Connect to previous vertex
    if (this.lastVertexId) {
      this.vectorEngine.addSegment(this.lastVertexId, vertex.id);
    }

    this.lastVertexId = vertex.id;
    this.isPenDrawing = true;

    // Sync store pen state
    const store = useCanvasStore.getState();
    if (!store.penState.isDrawing) {
      store.startPenPath(pointer.x, pointer.y);
    } else {
      store.addPenVertex(pointer.x, pointer.y);
    }

    // Update visual
    this.currentVectorNetwork.setNetwork(this.vectorEngine.getNetwork());
    this.canvas.renderAll();
  }

  private handlePenMove(pointer: { x: number; y: number }, isDragging: boolean): void {
    if (!this.isPenDrawing || !this.lastVertexId) return;

    if (isDragging) {
      // Create control point by dragging
      this.vectorEngine.moveControlPoint(this.lastVertexId, 'out', pointer);

      if (this.currentVectorNetwork) {
        this.currentVectorNetwork.setNetwork(this.vectorEngine.getNetwork());
        this.canvas.renderAll();
      }
    }
  }

  private handlePenUp(): void {
    this.isPenDrawing = false;
  }

  closePenPath(): void {
    if (!this.currentVectorNetwork || !this.lastVertexId) return;

    const network = this.vectorEngine.getNetwork();
    const firstVertex = network.vertices[0];

    if (firstVertex && network.vertices.length > 2) {
      this.vectorEngine.addSegment(this.lastVertexId, firstVertex.id);
      this.vectorEngine.updateRegions();
      this.currentVectorNetwork.setNetwork(this.vectorEngine.getNetwork());
      this.canvas.renderAll();

      useCanvasStore.getState().closePenPath();
      this.currentVectorNetwork = null;
      this.lastVertexId = null;
    }
  }

  finishPenPath(): void {
    this.currentVectorNetwork = null;
    this.lastVertexId = null;
    this.isPenDrawing = false;

    const store = useCanvasStore.getState();
    store.penState.isDrawing = false;
    store.penState.currentPathId = null;
    store.penState.lastVertexId = null;
  }

  // ==================== VECTOR NETWORK EDITING ====================

  enterEditMode(object: any): void {
    if (object instanceof FabricVectorNetwork) {
      object.setEditingMode(true);
      this.canvas.renderAll();
    }
  }

  exitEditMode(object: any): void {
    if (object instanceof FabricVectorNetwork) {
      object.setEditingMode(false);
      this.canvas.renderAll();
    }
  }

  addPointToPath(object: any, segmentId: string, t: number): any {
    if (object instanceof FabricVectorNetwork) {
      return object.addPointOnSegment(segmentId, t);
    }
    return null;
  }

  deletePointFromPath(object: any, vertexId: string): void {
    if (object instanceof FabricVectorNetwork) {
      object.deleteVertex(vertexId);
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
    const evt = e.e as WheelEvent;
    const delta = evt.deltaY;
    const zoom = this.canvas.getZoom();

    let newZoom = delta > 0 ? zoom * 0.95 : zoom * 1.05;
    newZoom = Math.max(0.05, Math.min(20, newZoom));

    // Zoom to cursor position
    const point = new (fabric as any).Point(evt.offsetX, evt.offsetY);
    this.canvas.zoomToPoint(point, newZoom);
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
      this.canvas.bringObjectToFront(active);
    }
  }

  sendToBack(): void {
    const active = this.canvas.getActiveObject();
    if (active) {
      this.canvas.sendObjectToBack(active);
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
      if (id) {
        useCanvasStore.getState().deleteShape(id);
        this.canvas.remove(obj);
      }
    });
    this.canvas.discardActiveObject();
    this.canvas.renderAll();
  }

  clear(): void {
    this.canvas.clear();
    useCanvasStore.getState().clear();
    this.canvas.renderAll();
  }

  exportSVG(): string {
    return this.canvas.toSVG();
  }

  exportPNG(): string {
    return this.canvas.toDataURL({ format: 'png', quality: 1 });
  }

  zoomIn(): void {
    const current = this.canvas.getZoom();
    const newZoom = Math.min(20, current * 1.2);
    const center = new (fabric as any).Point(this.canvas.width / 2, this.canvas.height / 2);
    this.canvas.zoomToPoint(center, newZoom);
    useCanvasStore.getState().setZoom(newZoom);
  }

  zoomOut(): void {
    const current = this.canvas.getZoom();
    const newZoom = Math.max(0.05, current / 1.2);
    const center = new (fabric as any).Point(this.canvas.width / 2, this.canvas.height / 2);
    this.canvas.zoomToPoint(center, newZoom);
    useCanvasStore.getState().setZoom(newZoom);
  }

  resetZoom(): void {
    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    useCanvasStore.getState().setZoom(1);
  }

  destroy(): void {
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.unsubscribe) this.unsubscribe();
    if (this.canvas) this.canvas.dispose();
    if (this.container) this.container.innerHTML = '';
  }
}

export const canvasEngine = new CanvasEngine();
