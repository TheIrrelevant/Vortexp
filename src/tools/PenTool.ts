// src/tools/PenTool.ts

import type {
  VectorNetwork,
  Vertex,
  Point,
  ControlPoint,
  PenToolState
} from '../types/vectorNetwork';
import { VectorNetworkEngine } from '../vector/VectorNetworkEngine';

/**
 * Figma Pen Tool - 1:1 Implementation
 *
 * Interactions:
 * 1. Click → Add straight point
 * 2. Click + Drag → Add Bezier control point
 * 3. Shift + Click → Constrain to 45° angles
 * 4. Alt + Click → Corner point (disconnected)
 * 5. Double-click → Close path
 * 6. Click on first point → Close path
 */
export class PenTool {
  private engine: VectorNetworkEngine;
  private state: PenToolState;
  private onClickCallback: ((network: VectorNetwork) => void) | null = null;

  constructor() {
    this.engine = new VectorNetworkEngine();
    this.state = this.getInitialState();
  }

  private getInitialState(): PenToolState {
    return {
      isDrawing: false,
      currentVertexId: null,
      previewSegment: null,
      isClosed: false,
      tempControlPoint: null
    };
  }

  // ==================== EVENT HANDLERS ====================

  /**
   * Mouse down - Start new point
   */
  handleMouseDown(
    point: Point,
    modifiers: { shift: boolean; alt: boolean; ctrl: boolean }
  ): void {
    if (this.state.isClosed) {
      // Start new path
      this.startNewPath();
    }

    // Is this the first point?
    if (!this.state.currentVertexId) {
      this.startNewPath();
    }

    // Constrain to 45° angles if Shift is held
    const constrainedPoint = modifiers.shift
      ? this.constrainToAngle(point)
      : point;

    // Add point
    const vertex = this.engine.addVertex(
      constrainedPoint.x,
      constrainedPoint.y,
      modifiers.alt ? 'DISCONNECTED' : 'MIRRORED'
    );

    // Connect to previous point
    if (this.state.currentVertexId) {
      const segment = this.engine.addSegment(
        this.state.currentVertexId,
        vertex.id
      );

      if (segment) {
        this.state.previewSegment = segment;
      }
    }

    this.state.currentVertexId = vertex.id;
    this.state.isDrawing = true;
    this.state.tempControlPoint = null;

    // Callback
    this.notifyUpdate();
  }

  /**
   * Mouse move - Create control point for drag
   */
  handleMouseMove(
    point: Point,
    isDragging: boolean,
    modifiers: { shift: boolean; alt: boolean }
  ): void {
    if (!this.state.currentVertexId) return;

    const currentVertex = this.engine.findVertex(this.state.currentVertexId);
    if (!currentVertex) return;

    if (isDragging) {
      // Create control point
      const controlPoint: ControlPoint = {
        x: point.x,
        y: point.y
      };

      // Constrain angle if Shift is held
      const constrainedCP = modifiers.shift
        ? this.constrainControlPoint(currentVertex, controlPoint)
        : controlPoint;

      // Set the control point
      this.engine.updateVertex(currentVertex.id, {
        controlOut: constrainedCP,
        type: modifiers.alt ? 'ASYMMETRIC' : 'MIRRORED'
      });

      this.state.tempControlPoint = constrainedCP;
    } else {
      // Show preview segment
      this.updatePreviewSegment();
    }

    this.notifyUpdate();
  }

  /**
   * Mouse up - Finish drag
   */
  handleMouseUp(): void {
    if (this.state.tempControlPoint) {
      this.state.tempControlPoint = null;
      this.notifyUpdate();
    }
  }

  /**
   * Double click - Close path
   */
  handleDoubleClick(): void {
    this.closePath();
  }

  /**
   * Click on first point - Close path
   */
  handleClickOnVertex(vertexId: string): void {
    const network = this.engine.getNetwork();

    // Was the first vertex clicked?
    if (vertexId === network.vertices[0]?.id && network.vertices.length > 2) {
      // Close path
      if (this.state.currentVertexId) {
        this.engine.addSegment(this.state.currentVertexId, vertexId);
      }

      this.state.isClosed = true;
      this.engine.updateRegions();
      this.notifyUpdate();
    }
  }

  /**
   * Escape - Cancel
   */
  handleEscape(): void {
    if (this.state.isDrawing) {
      // Delete the last point
      if (this.state.currentVertexId) {
        this.engine.deleteVertex(this.state.currentVertexId);
      }

      this.state = this.getInitialState();
      this.notifyUpdate();
    }
  }

  // ==================== HELPER METHODS ====================

  private startNewPath(): void {
    this.engine.loadNetwork(this.engine.createEmptyNetwork());
    this.state = this.getInitialState();
  }

  private closePath(): void {
    const segment = this.engine.closePath();
    if (segment) {
      this.state.isClosed = true;
      this.engine.updateRegions();
      this.notifyUpdate();
    }
  }

  private constrainToAngle(point: Point): Point {
    const network = this.engine.getNetwork();
    const lastVertex = network.vertices[network.vertices.length - 1];

    if (!lastVertex) return point;

    const dx = point.x - lastVertex.x;
    const dy = point.y - lastVertex.y;
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Constrain to 45° intervals
    const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);

    return {
      x: lastVertex.x + Math.cos(snappedAngle) * distance,
      y: lastVertex.y + Math.sin(snappedAngle) * distance
    };
  }

  private constrainControlPoint(
    vertex: Vertex,
    controlPoint: ControlPoint
  ): ControlPoint {
    const dx = controlPoint.x - vertex.x;
    const dy = controlPoint.y - vertex.y;
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Constrain to 45° intervals
    const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);

    return {
      x: vertex.x + Math.cos(snappedAngle) * distance,
      y: vertex.y + Math.sin(snappedAngle) * distance
    };
  }

  private updatePreviewSegment(): void {
    if (!this.state.currentVertexId) return;
  }

  // ==================== CALLBACK ====================

  onUpdate(callback: (network: VectorNetwork) => void): void {
    this.onClickCallback = callback;
  }

  private notifyUpdate(): void {
    if (this.onClickCallback) {
      this.onClickCallback(this.engine.getNetwork());
    }
  }

  // ==================== GETTERS ====================

  getState(): PenToolState {
    return this.state;
  }

  getCurrentNetwork(): VectorNetwork {
    return this.engine.getNetwork();
  }

  getSVGPath(): string {
    return this.engine.toSVGPath();
  }
}

export const penTool = new PenTool();
