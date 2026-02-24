// src/canvas/FabricVectorNetwork.ts

import { fabric } from './fabricSetup';
import type { VectorNetwork, Vertex, Segment, Point } from '../types/vectorNetwork';
import { VectorNetworkEngine } from '../vector/VectorNetworkEngine';

/**
 * Fabric.js Vector Network Object
 *
 * Uses Vector Network instead of Fabric.js native path object.
 * This enables Figma-like bidirectional path editing.
 */
export class FabricVectorNetwork extends (fabric.Group as any) {
  private network: VectorNetwork;
  private engine: VectorNetworkEngine;
  private pathObject: any | null = null;
  private controlPointsGroup: any | null = null;
  private isEditing: boolean = false;

  constructor(network: VectorNetwork) {
    super([]);

    this.network = network;
    this.engine = new VectorNetworkEngine();
    this.engine.loadNetwork(network);

    this.render();
  }

  /**
   * Convert Vector Network to Fabric.js path and render
   */
  private render(): void {
    // First clean up old objects
    this.removeAll();

    // Create the path
    const pathData = this.engine.toSVGPath();
    
    if (pathData) {
      this.pathObject = new (fabric as any).Path(pathData, {
        fill: this.network.fill,
        stroke: this.network.stroke,
        strokeWidth: this.network.strokeWidth,
        opacity: this.network.opacity,
        originX: 'left',
        originY: 'top'
      });

      this.addWithUpdate(this.pathObject);
    }

    // Show control points in edit mode
    if (this.isEditing) {
      this.renderControlPoints();
    }
  }

  /**
   * Render control points and vertices
   */
  private renderControlPoints(): void {
    const objects: any[] = [];

    this.network.vertices.forEach(vertex => {
      // Vertex point
      const vertexCircle = new (fabric as any).Circle({
        left: vertex.x - 6,
        top: vertex.y - 6,
        radius: 6,
        fill: '#FFFFFF',
        stroke: '#3B82F6',
        strokeWidth: 2,
        selectable: false,
        evented: true,
        data: { type: 'vertex', id: vertex.id }
      });
      objects.push(vertexCircle);

      // Control point lines and handles
      if (vertex.controlIn) {
        const lineIn = new (fabric as any).Line(
          [vertex.x, vertex.y, vertex.controlIn.x, vertex.controlIn.y],
          {
            stroke: 'rgba(59, 130, 246, 0.5)',
            strokeWidth: 1,
            selectable: false,
            evented: false
          }
        );
        objects.push(lineIn);

        const cpIn = new (fabric as any).Circle({
          left: vertex.controlIn.x - 4,
          top: vertex.controlIn.y - 4,
          radius: 4,
          fill: '#3B82F6',
          stroke: '#FFFFFF',
          strokeWidth: 1,
          selectable: false,
          evented: true,
          data: { type: 'controlPoint', vertexId: vertex.id, controlType: 'in' }
        });
        objects.push(cpIn);
      }

      if (vertex.controlOut) {
        const lineOut = new (fabric as any).Line(
          [vertex.x, vertex.y, vertex.controlOut.x, vertex.controlOut.y],
          {
            stroke: 'rgba(59, 130, 246, 0.5)',
            strokeWidth: 1,
            selectable: false,
            evented: false
          }
        );
        objects.push(lineOut);

        const cpOut = new (fabric as any).Circle({
          left: vertex.controlOut.x - 4,
          top: vertex.controlOut.y - 4,
          radius: 4,
          fill: '#3B82F6',
          stroke: '#FFFFFF',
          strokeWidth: 1,
          selectable: false,
          evented: true,
          data: { type: 'controlPoint', vertexId: vertex.id, controlType: 'out' }
        });
        objects.push(cpOut);
      }
    });

    this.controlPointsGroup = new (fabric as any).Group(objects, {
      selectable: false,
      evented: true
    });

    this.addWithUpdate(this.controlPointsGroup);
  }

  /**
   * Toggle edit mode
   */
  setEditingMode(editing: boolean): void {
    this.isEditing = editing;
    this.render();
  }

  /**
   * Add vertex
   */
  addVertex(x: number, y: number, type: 'STRAIGHT' | 'MIRRORED' = 'MIRRORED'): Vertex {
    const vertex = this.engine.addVertex(x, y, type);
    this.syncNetworkFromEngine();
    this.render();
    return vertex;
  }

  /**
   * Add segment
   */
  addSegment(startVertexId: string, endVertexId: string): Segment | null {
    const segment = this.engine.addSegment(startVertexId, endVertexId);
    if (segment) {
      this.syncNetworkFromEngine();
      this.render();
    }
    return segment;
  }

  /**
   * Update vertex
   */
  updateVertex(vertexId: string, updates: Partial<Vertex>): void {
    this.engine.updateVertex(vertexId, updates);
    this.syncNetworkFromEngine();
    this.render();
  }

  /**
   * Delete vertex
   */
  deleteVertex(vertexId: string): void {
    this.engine.deleteVertex(vertexId);
    this.syncNetworkFromEngine();
    this.render();
  }

  /**
   * Move control point
   */
  moveControlPoint(vertexId: string, type: 'in' | 'out', position: Point): void {
    this.engine.moveControlPoint(vertexId, type, position);
    this.syncNetworkFromEngine();
    this.render();
  }

  /**
   * Close path
   */
  closePath(): void {
    this.engine.closePath();
    this.engine.updateRegions();
    this.syncNetworkFromEngine();
    this.render();
  }

  /**
   * Add point on segment
   */
  addPointOnSegment(segmentId: string, t: number): Vertex | null {
    const vertex = this.engine.addPointOnSegment(segmentId, t);
    if (vertex) {
      this.syncNetworkFromEngine();
      this.render();
    }
    return vertex;
  }

  /**
   * Get network
   */
  getNetwork(): VectorNetwork {
    return this.network;
  }

  /**
   * Set network
   */
  setNetwork(network: VectorNetwork): void {
    this.network = network;
    this.engine.loadNetwork(network);
    this.render();
  }

  /**
   * Get SVG path data
   */
  getPathData(): string {
    return this.engine.toSVGPath();
  }

  private syncNetworkFromEngine(): void {
    this.network = this.engine.getNetwork();
  }
}

