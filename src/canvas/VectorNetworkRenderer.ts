// src/canvas/VectorNetworkRenderer.ts

import type {
  VectorNetwork,
  Vertex,
  Segment
} from '../types/vectorNetwork';

/**
 * Figma Vector Network Renderer - Canvas 2D Rendering
 * 
 * Fabric.js yerine native Canvas 2D API kullanıyoruz
 * çünkü Vector Networks için daha fazla kontrol gerekiyor.
 */
export class VectorNetworkRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  /**
   * Vector Network'ü canvas'a çiz
   */
  render(network: VectorNetwork): void {
    this.ctx.save();

    // Transform uygula
    this.applyTransform(network);

    // Fill regions
    this.renderFill(network);

    // Stroke paths
    this.renderStroke(network);

    this.ctx.restore();
  }

  /**
   * Vertex'leri ve kontrol noktalarını göster (edit mode)
   */
  renderEditMode(
    network: VectorNetwork,
    selectedVertexIds: string[],
    hoveredVertexId: string | null
  ): void {
    // Vertex'leri çiz
    network.vertices.forEach(vertex => {
      const isSelected = selectedVertexIds.includes(vertex.id);
      const isHovered = hoveredVertexId === vertex.id;

      this.renderVertex(vertex, isSelected, isHovered);
    });

    // Kontrol noktalarını çiz
    network.vertices.forEach(vertex => {
      this.renderControlPoints(vertex, selectedVertexIds.includes(vertex.id));
    });
  }

  // ==================== FILL & STROKE ====================

  private renderFill(network: VectorNetwork): void {
    if (network.fill === 'none' || network.fill === 'transparent') return;

    this.ctx.fillStyle = network.fill;
    this.ctx.globalAlpha = network.opacity;

    // Her region için path oluştur
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

    // Her segment için çiz
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
      // Quadratic Bezier (tek kontrol noktası)
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

    // Kontrol noktası varsa farklı göster
    if (vertex.controlIn || vertex.controlOut) {
      // İç içe daire
      this.ctx.beginPath();
      this.ctx.arc(vertex.x, vertex.y, size - 3, 0, Math.PI * 2);
      this.ctx.fillStyle = '#1F2937';
      this.ctx.fill();
    }
  }

  private renderControlPoints(vertex: Vertex, isSelected: boolean): void {
    if (!vertex.controlIn && !vertex.controlOut) return;

    // Kontrol noktası çizgileri
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
   * Belirli bir noktadaki vertex'i bul
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
   * Belirli bir noktadaki kontrol noktasını bul
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
   * Belirli bir noktadaki segment'i bul
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
    // Basit line segment için closest point
    // Bezier için daha karmaşık algoritma gerek

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
