// src/vector/VectorNetworkEngine.ts

import { nanoid } from 'nanoid';
import type {
  VectorNetwork,
  Vertex,
  Segment,
  Point,
  ControlPoint,
  ControlPointType,
  BezierCurve,
  PathCommand
} from '../types/vectorNetwork';

/**
 * Figma Vector Networks Engine - 1:1 Implementation
 *
 * Key differences from SVG paths:
 * 1. SVG paths are unidirectional, Vector Networks are bidirectional
 * 2. Vertices can connect to multiple segments
 * 3. Control points can be independent from vertices
 */
export class VectorNetworkEngine {
  private network: VectorNetwork;

  constructor() {
    this.network = this.createEmptyNetwork();
  }

  // ==================== NETWORK MANAGEMENT ====================

  createEmptyNetwork(): VectorNetwork {
    return {
      id: nanoid(),
      vertices: [],
      segments: [],
      regions: [],
      fill: '#3B82F6',
      stroke: '#F9FEFF',
      strokeWidth: 2,
      opacity: 1,
      x: 0,
      y: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1
    };
  }

  loadNetwork(network: VectorNetwork): void {
    this.network = network;
  }

  getNetwork(): VectorNetwork {
    return this.network;
  }

  // ==================== VERTEX OPERATIONS ====================

  addVertex(
    x: number,
    y: number,
    type: ControlPointType = 'STRAIGHT',
    controlIn?: ControlPoint,
    controlOut?: ControlPoint
  ): Vertex {
    const vertex: Vertex = {
      id: nanoid(),
      x,
      y,
      type,
      controlIn,
      controlOut,
      connectedSegments: []
    };

    this.network.vertices.push(vertex);
    return vertex;
  }

  updateVertex(id: string, updates: Partial<Vertex>): Vertex | null {
    const vertex = this.findVertex(id);
    if (!vertex) return null;

    Object.assign(vertex, updates);

    // Update control points when control point type changes
    if (updates.type) {
      this.updateControlPointsByType(vertex);
    }

    return vertex;
  }

  deleteVertex(id: string): void {
    const vertex = this.findVertex(id);
    if (!vertex) return;

    // Delete all connected segments
    vertex.connectedSegments.forEach(segmentId => {
      this.deleteSegment(segmentId);
    });

    // Delete the vertex
    this.network.vertices = this.network.vertices.filter(v => v.id !== id);

    // Update regions
    this.updateRegions();
  }

  findVertex(id: string): Vertex | undefined {
    return this.network.vertices.find(v => v.id === id);
  }

  // ==================== SEGMENT OPERATIONS ====================

  addSegment(
    startVertexId: string,
    endVertexId: string,
    controlStart?: ControlPoint,
    controlEnd?: ControlPoint
  ): Segment | null {
    const startVertex = this.findVertex(startVertexId);
    const endVertex = this.findVertex(endVertexId);

    if (!startVertex || !endVertex) return null;

    const segment: Segment = {
      id: nanoid(),
      startVertexId,
      endVertexId,
      controlStart,
      controlEnd
    };

    this.network.segments.push(segment);

    // Connect segment to vertices
    startVertex.connectedSegments.push(segment.id);
    endVertex.connectedSegments.push(segment.id);

    return segment;
  }

  updateSegment(id: string, updates: Partial<Segment>): Segment | null {
    const segment = this.findSegment(id);
    if (!segment) return null;

    Object.assign(segment, updates);
    return segment;
  }

  deleteSegment(id: string): void {
    const segment = this.findSegment(id);
    if (!segment) return;

    // Remove connection from vertices
    const startVertex = this.findVertex(segment.startVertexId);
    const endVertex = this.findVertex(segment.endVertexId);

    if (startVertex) {
      startVertex.connectedSegments = startVertex.connectedSegments.filter(s => s !== id);
    }
    if (endVertex) {
      endVertex.connectedSegments = endVertex.connectedSegments.filter(s => s !== id);
    }

    // Delete the segment
    this.network.segments = this.network.segments.filter(s => s.id !== id);
  }

  findSegment(id: string): Segment | undefined {
    return this.network.segments.find(s => s.id === id);
  }

  getSegmentsForVertex(vertexId: string): Segment[] {
    return this.network.segments.filter(
      s => s.startVertexId === vertexId || s.endVertexId === vertexId
    );
  }

  // ==================== CONTROL POINT OPERATIONS ====================

  /**
   * Update control points based on control point type
   *
   * STRAIGHT: No control points (straight line)
   * MIRRORED: In and out same angle and distance (symmetric)
   * ASYMMETRIC: In and out same angle, different distance
   * DISCONNECTED: In and out completely independent
   */
  updateControlPointsByType(vertex: Vertex): void {
    switch (vertex.type) {
      case 'STRAIGHT':
        vertex.controlIn = undefined;
        vertex.controlOut = undefined;
        break;

      case 'MIRRORED':
        if (vertex.controlIn) {
          // Mirror the outgoing control point from the incoming one
          const dx = vertex.controlIn.x - vertex.x;
          const dy = vertex.controlIn.y - vertex.y;
          vertex.controlOut = {
            x: vertex.x - dx,
            y: vertex.y - dy
          };
        }
        break;

      case 'ASYMMETRIC':
        // Keep the same angle but allow independent distances
        if (vertex.controlIn && vertex.controlOut) {
          const angleIn = Math.atan2(
            vertex.controlIn.y - vertex.y,
            vertex.controlIn.x - vertex.x
          );
          const distanceOut = Math.sqrt(
            Math.pow(vertex.controlOut.x - vertex.x, 2) +
            Math.pow(vertex.controlOut.y - vertex.y, 2)
          );
          vertex.controlOut = {
            x: vertex.x + Math.cos(angleIn + Math.PI) * distanceOut,
            y: vertex.y + Math.sin(angleIn + Math.PI) * distanceOut
          };
        }
        break;

      case 'DISCONNECTED':
        // Do nothing - completely independent
        break;
    }
  }

  moveControlPoint(
    vertexId: string,
    controlType: 'in' | 'out',
    position: Point
  ): void {
    const vertex = this.findVertex(vertexId);
    if (!vertex) return;

    if (controlType === 'in') {
      vertex.controlIn = position;
    } else {
      vertex.controlOut = position;
    }

    // If type is MIRRORED or ASYMMETRIC, update the other control point
    if (vertex.type === 'MIRRORED') {
      const dx = position.x - vertex.x;
      const dy = position.y - vertex.y;
      if (controlType === 'in') {
        vertex.controlOut = {
          x: vertex.x - dx,
          y: vertex.y - dy
        };
      } else {
        vertex.controlIn = {
          x: vertex.x - dx,
          y: vertex.y - dy
        };
      }
    }
  }

  // ==================== PATH OPERATIONS ====================

  /**
   * Add a point on a segment (t = 0..1)
   */
  addPointOnSegment(segmentId: string, t: number): Vertex | null {
    const segment = this.findSegment(segmentId);
    if (!segment) return null;

    const startVertex = this.findVertex(segment.startVertexId);
    const endVertex = this.findVertex(segment.endVertexId);
    if (!startVertex || !endVertex) return null;

    // Calculate the point on the Bezier curve
    const curve = this.getBezierCurve(segment);
    const newPoint = this.calculateBezierPoint(curve, t);

    // Create new vertex
    const newVertex = this.addVertex(
      newPoint.x,
      newPoint.y,
      'MIRRORED'
    );

    // Delete the original segment
    this.deleteSegment(segmentId);

    // Create two new segments
    this.addSegment(startVertex.id, newVertex.id);
    this.addSegment(newVertex.id, endVertex.id);

    return newVertex;
  }

  /**
   * Close the path (create segment from last vertex to first vertex)
   */
  closePath(): Segment | null {
    if (this.network.vertices.length < 2) return null;

    const firstVertex = this.network.vertices[0];
    const lastVertex = this.network.vertices[this.network.vertices.length - 1];

    // Check if already closed
    const existingSegment = this.network.segments.find(
      s => (s.startVertexId === lastVertex.id && s.endVertexId === firstVertex.id) ||
           (s.startVertexId === firstVertex.id && s.endVertexId === lastVertex.id)
    );

    if (existingSegment) return null;

    return this.addSegment(lastVertex.id, firstVertex.id);
  }

  // ==================== BEZIER CALCULATIONS ====================

  getBezierCurve(segment: Segment): BezierCurve {
    const startVertex = this.findVertex(segment.startVertexId)!;
    const endVertex = this.findVertex(segment.endVertexId)!;

    return {
      p0: { x: startVertex.x, y: startVertex.y },
      p1: segment.controlStart || startVertex.controlOut || { x: startVertex.x, y: startVertex.y },
      p2: segment.controlEnd || endVertex.controlIn || { x: endVertex.x, y: endVertex.y },
      p3: { x: endVertex.x, y: endVertex.y }
    };
  }

  /**
   * Calculate a point on a cubic Bezier curve
   * B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
   */
  calculateBezierPoint(curve: BezierCurve, t: number): Point {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    return {
      x: uuu * curve.p0.x + 3 * uu * t * curve.p1.x + 3 * u * tt * curve.p2.x + ttt * curve.p3.x,
      y: uuu * curve.p0.y + 3 * uu * t * curve.p1.y + 3 * u * tt * curve.p2.y + ttt * curve.p3.y
    };
  }

  /**
   * Bezier curve derivative (tangent)
   */
  calculateBezierTangent(curve: BezierCurve, t: number): Point {
    const u = 1 - t;
    const uu = u * u;
    const tt = t * t;

    return {
      x: 3 * uu * (curve.p1.x - curve.p0.x) + 6 * u * t * (curve.p2.x - curve.p1.x) + 3 * tt * (curve.p3.x - curve.p2.x),
      y: 3 * uu * (curve.p1.y - curve.p0.y) + 6 * u * t * (curve.p2.y - curve.p1.y) + 3 * tt * (curve.p3.y - curve.p2.y)
    };
  }

  // ==================== SVG EXPORT ====================

  /**
   * Convert Vector Network to SVG path data
   */
  toSVGPath(): string {
    const commands = this.generatePathCommands();
    return commands.map(cmd => this.pathCommandToString(cmd)).join(' ');
  }

  private generatePathCommands(): PathCommand[] {
    const commands: PathCommand[] = [];

    // Create path for each region
    this.network.regions.forEach(region => {
      region.loops.forEach(loop => {
        if (loop.length === 0) return;

        // Move to first vertex
        const firstVertex = this.findVertex(loop[0]);
        if (!firstVertex) return;

        commands.push({ type: 'M', x: firstVertex.x, y: firstVertex.y });

        // Loop through vertices
        for (let i = 0; i < loop.length; i++) {
          const currentId = loop[i];
          const nextId = loop[(i + 1) % loop.length];

          const segment = this.network.segments.find(
            s => (s.startVertexId === currentId && s.endVertexId === nextId) ||
                 (s.startVertexId === nextId && s.endVertexId === currentId)
          );

          if (!segment) {
            // Direct line
            const nextVertex = this.findVertex(nextId);
            if (nextVertex) {
              commands.push({ type: 'L', x: nextVertex.x, y: nextVertex.y });
            }
          } else {
            // Bezier curve or line
            const isReversed = segment.endVertexId === currentId;
            const startVertex = this.findVertex(isReversed ? segment.endVertexId : segment.startVertexId)!;
            const endVertex = this.findVertex(isReversed ? segment.startVertexId : segment.endVertexId)!;

            const ctrlStart = isReversed ? segment.controlEnd : segment.controlStart;
            const ctrlEnd = isReversed ? segment.controlStart : segment.controlEnd;

            const cp1 = ctrlStart || (isReversed ? startVertex.controlIn : startVertex.controlOut);
            const cp2 = ctrlEnd || (isReversed ? endVertex.controlOut : endVertex.controlIn);

            if (cp1 && cp2) {
              // Cubic Bezier
              commands.push({
                type: 'C',
                x1: cp1.x,
                y1: cp1.y,
                x2: cp2.x,
                y2: cp2.y,
                x: endVertex.x,
                y: endVertex.y
              });
            } else {
              // Straight line
              commands.push({ type: 'L', x: endVertex.x, y: endVertex.y });
            }
          }
        }

        // Close path
        commands.push({ type: 'Z' });
      });
    });

    return commands;
  }

  private pathCommandToString(cmd: PathCommand): string {
    switch (cmd.type) {
      case 'M':
        return `M ${cmd.x} ${cmd.y}`;
      case 'L':
        return `L ${cmd.x} ${cmd.y}`;
      case 'C':
        return `C ${cmd.x1} ${cmd.y1}, ${cmd.x2} ${cmd.y2}, ${cmd.x} ${cmd.y}`;
      case 'Q':
        return `Q ${cmd.x1} ${cmd.y1}, ${cmd.x} ${cmd.y}`;
      case 'Z':
        return 'Z';
    }
  }

  // ==================== REGION MANAGEMENT ====================

  updateRegions(): void {
    // Simple implementation: find closed paths
    const loops = this.findLoops();
    
    this.network.regions = [{
      id: nanoid(),
      windingRule: 'NONZERO',
      loops: loops
    }];
  }

  private findLoops(): string[][] {
    const loops: string[][] = [];
    const visited = new Set<string>();

    // Find closed paths using DFS
    this.network.vertices.forEach(vertex => {
      if (visited.has(vertex.id)) return;

      const loop = this.findLoopFromVertex(vertex.id, visited);
      if (loop.length > 2) {
        loops.push(loop);
      }
    });

    return loops;
  }

  private findLoopFromVertex(startId: string, visited: Set<string>): string[] {
    const path: string[] = [];
    let current = startId;

    while (true) {
      if (visited.has(current)) break;

      visited.add(current);
      path.push(current);

      // Find the next vertex
      const segments = this.getSegmentsForVertex(current);
      let foundNext = false;

      for (const segment of segments) {
        const nextId = segment.startVertexId === current ? segment.endVertexId : segment.startVertexId;

        if (nextId === startId && path.length > 2) {
          // Loop completed
          return path;
        }

        if (!visited.has(nextId)) {
          current = nextId;
          foundNext = true;
          break;
        }
      }

      if (!foundNext) break;
    }

    return path;
  }

  // ==================== TRANSFORM ====================

  move(dx: number, dy: number): void {
    this.network.x += dx;
    this.network.y += dy;
  }

  scale(sx: number, sy: number): void {
    this.network.scaleX *= sx;
    this.network.scaleY *= sy;

    // Scale all vertices
    this.network.vertices.forEach(vertex => {
      vertex.x *= sx;
      vertex.y *= sy;

      if (vertex.controlIn) {
        vertex.controlIn.x *= sx;
        vertex.controlIn.y *= sy;
      }

      if (vertex.controlOut) {
        vertex.controlOut.x *= sx;
        vertex.controlOut.y *= sy;
      }
    });
  }

  rotate(angle: number): void {
    this.network.rotation += angle;

    // Rotate all vertices
    const rad = angle * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    this.network.vertices.forEach(vertex => {
      const x = vertex.x * cos - vertex.y * sin;
      const y = vertex.x * sin + vertex.y * cos;
      vertex.x = x;
      vertex.y = y;
    });
  }
}

export const vectorNetworkEngine = new VectorNetworkEngine();
