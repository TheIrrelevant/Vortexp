// src/canvas/VectorNetworkRenderer.ts

import type {
  VectorNetwork,
  Vertex,
  Segment
} from '../types/vectorNetwork';

/**
 * Figma Vector Network Renderer - Canvas 2D Rendering
 *
 * Uses native Canvas 2D API instead of Fabric.js
 * because Vector Networks need more rendering control.
 */
export class VectorNetworkRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  /**
   * Draw Vector Network on canvas
   */
  render(network: VectorNetwork): void {
    this.ctx.save();

    // Apply transform
    this.applyTransform(network);

    // Fill regions
    this.renderFill(network);

    // Stroke paths
    this.renderStroke(network);

    this.ctx.restore();
  }

  /**
   * Show vertices and control points (edit mode)
   */
  renderEditMode(
    network: VectorNetwork,
    selectedVertexIds: string[],
    hoveredVertexId: string | null
  ): void {
    // Draw vertices
    network.vertices.forEach(vertex => {
      const isSelected = selectedVertexIds.includes(vertex.id);
      const isHovered = hoveredVertexId === vertex.id;

      this.renderVertex(vertex, isSelected, isHovered);
    });

    // Draw control points
    network.vertices.forEach(vertex => {
      this.renderControlPoints(vertex, selectedVertexIds.includes(vertex.id));
    });
  }

  // ==================== FILL & STROKE ====================

  private renderFill(network: VectorNetwork): void {
    if (network.fill === 'none' || network.fill === 'transparent') return;

    this.ctx.fillStyle = network.fill;
    this.ctx.globalAlpha = network.opacity;

    // Create path for each region
    network.regions.forEach(region => {
      region.loops.forEach(loop => {
        this.renderLoop(network, loop);
      });
    });

    this.ctx.globalAlpha = 1;
  }

  private renderStroke(network: VectorNetwork): void {
    if (network.stroke === 'none' || network.stroke === 'transparent') return;

    this.ctx.strokeStyle = network.stroke;
    this.ctx.lineWidth = network.strokeWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.globalAlpha = network.opacity;

    // Draw each segment
    network.segments.forEach(segment => {
      this.renderSegment(network, segment);
    });

    this.ctx.globalAlpha = 1;
  }

  private renderLoop(network: VectorNetwork, loop: string[]): void {
    if (loop.length === 0) return;

    this.ctx.beginPath();

    const firstVertex = network.vertices.find(v => v.id === loop[0]);
    if (!firstVertex) return;

    this.ctx.moveTo(firstVertex.x, firstVertex.y);

    for (let i = 0; i < loop.length; i++) {
      const currentId = loop[i];
      const nextId = loop[(i + 1) % loop.length];

      const segment = network.segments.find(
        s => (s.startVertexId === currentId && s.endVertexId === nextId) ||
             (s.startVertexId === nextId && s.endVertexId === currentId)
      );

      if (!segment) {
        // Direct line
        const nextVertex = network.vertices.find(v => v.id === nextId);
        if (nextVertex) {
          this.ctx.lineTo(nextVertex.x, nextVertex.y);
        }
      } else {
        this.renderSegmentPath(network, segment);
      }
    }

    this.ctx.closePath();
    this.ctx.fill();
  }

  private renderSegment(network: VectorNetwork, segment: Segment): void {
    this.ctx.beginPath();
    this.renderSegmentPath(network, segment);
    this.ctx.stroke();
  }

  private renderSegmentPath(network: VectorNetwork, segment: Segment): void {
    const startVertex = network.vertices.find(v => v.id === segment.startVertexId);
    const endVertex = network.vertices.find(v => v.id === segment.endVertexId);

    if (!startVertex || !endVertex) return;

    const isReversed = false; // Direction handling
    const cp1 = segment.controlStart || (isReversed ? startVertex.controlIn : startVertex.controlOut);
    const cp2 = segment.controlEnd || (isReversed ? endVertex.controlOut : endVertex.controlIn);

    if (cp1 && cp2) {
      // Cubic Bezier
      this.ctx.bezierCurveTo(
        cp1.x, cp1.y,
        cp2.x, cp2.y,
        endVertex.x, endVertex.y
      );
    } else if (cp1 || cp2) {
      // Quadratic Bezier (single control point)
      const cp = cp1 || cp2!;
      this.ctx.quadraticCurveTo(cp.x, cp.y, endVertex.x, endVertex.y);
    } else {
      // Straight line
      this.ctx.lineTo(endVertex.x, endVertex.y);
    }
  }

  // ==================== VERTEX RENDERING ====================

  private renderVertex(
    vertex: Vertex,
    isSelected: boolean,
    isHovered: boolean
  ): void {
    const size = isHovered ? 10 : (isSelected ? 8 : 6);

    // Outer circle
    this.ctx.beginPath();
    this.ctx.arc(vertex.x, vertex.y, size, 0, Math.PI * 2);

    // Fill
    if (isSelected) {
      this.ctx.fillStyle = '#3B82F6';
    } else if (isHovered) {
      this.ctx.fillStyle = '#60A5FA';
    } else {
      this.ctx.fillStyle = '#FFFFFF';
    }
    this.ctx.fill();

    // Border
    this.ctx.strokeStyle = '#1F2937';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Show differently if has control points
    if (vertex.controlIn || vertex.controlOut) {
      // Inner circle
      this.ctx.beginPath();
      this.ctx.arc(vertex.x, vertex.y, size - 3, 0, Math.PI * 2);
      this.ctx.fillStyle = '#1F2937';
      this.ctx.fill();
    }
  }

  private renderControlPoints(vertex: Vertex, isSelected: boolean): void {
    if (!vertex.controlIn && !vertex.controlOut) return;

    // Control point lines
    this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    this.ctx.lineWidth = 1;

    if (vertex.controlIn) {
      this.ctx.beginPath();
      this.ctx.moveTo(vertex.x, vertex.y);
      this.ctx.lineTo(vertex.controlIn.x, vertex.controlIn.y);
      this.ctx.stroke();

      this.renderControlPointHandle(vertex.controlIn, isSelected);
    }

    if (vertex.controlOut) {
      this.ctx.beginPath();
      this.ctx.moveTo(vertex.x, vertex.y);
      this.ctx.lineTo(vertex.controlOut.x, vertex.controlOut.y);
      this.ctx.stroke();

      this.renderControlPointHandle(vertex.controlOut, isSelected);
    }
  }

  private renderControlPointHandle(point: { x: number; y: number }, isSelected: boolean): void {
    const size = 5;

    this.ctx.beginPath();
    this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);

    this.ctx.fillStyle = isSelected ? '#3B82F6' : '#FFFFFF';
    this.ctx.fill();

    this.ctx.strokeStyle = '#1F2937';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
  }

  // ==================== TRANSFORM ====================

  private applyTransform(network: VectorNetwork): void {
    this.ctx.translate(network.x, network.y);
    this.ctx.rotate(network.rotation * Math.PI / 180);
    this.ctx.scale(network.scaleX, network.scaleY);
  }

  // ==================== HIT TESTING ====================

  /**
   * Find vertex at a given point
   */
  hitTestVertex(
    network: VectorNetwork,
    point: { x: number; y: number },
    threshold: number = 10
  ): Vertex | null {
    for (const vertex of network.vertices) {
      const distance = Math.sqrt(
        Math.pow(vertex.x - point.x, 2) +
        Math.pow(vertex.y - point.y, 2)
      );

      if (distance <= threshold) {
        return vertex;
      }
    }

    return null;
  }

  /**
   * Find control point at a given point
   */
  hitTestControlPoint(
    network: VectorNetwork,
    point: { x: number; y: number }
  ): { vertex: Vertex; type: 'in' | 'out' } | null {
    for (const vertex of network.vertices) {
      if (vertex.controlIn) {
        const distance = Math.sqrt(
          Math.pow(vertex.controlIn.x - point.x, 2) +
          Math.pow(vertex.controlIn.y - point.y, 2)
        );

        if (distance <= 8) {
          return { vertex, type: 'in' };
        }
      }

      if (vertex.controlOut) {
        const distance = Math.sqrt(
          Math.pow(vertex.controlOut.x - point.x, 2) +
          Math.pow(vertex.controlOut.y - point.y, 2)
        );

        if (distance <= 8) {
          return { vertex, type: 'out' };
        }
      }
    }

    return null;
  }

  /**
   * Find segment at a given point
   */
  hitTestSegment(
    network: VectorNetwork,
    point: { x: number; y: number }
  ): { segment: Segment; t: number } | null {
    for (const segment of network.segments) {
      const t = this.findClosestPointOnSegment(network, segment, point);

      if (t !== null) {
        return { segment, t };
      }
    }

    return null;
  }

  private findClosestPointOnSegment(
    network: VectorNetwork,
    segment: Segment,
    point: { x: number; y: number }
  ): number | null {
    // Closest point for simple line segment
    // More complex algorithm needed for Bezier

    const startVertex = network.vertices.find(v => v.id === segment.startVertexId);
    const endVertex = network.vertices.find(v => v.id === segment.endVertexId);

    if (!startVertex || !endVertex) return null;

    // Line parametrization
    const dx = endVertex.x - startVertex.x;
    const dy = endVertex.y - startVertex.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) return null;

    let t = ((point.x - startVertex.x) * dx + (point.y - startVertex.y) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));

    const closestX = startVertex.x + t * dx;
    const closestY = startVertex.y + t * dy;

    const distance = Math.sqrt(
      Math.pow(point.x - closestX, 2) +
      Math.pow(point.y - closestY, 2)
    );

    return distance < 5 ? t : null;
  }
}
