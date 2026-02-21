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
 * Önemli farklar:
 * 1. SVG path tek yönlüdür, Vector Network çift yönlüdür
 * 2. Vertex'ler birden fazla segment'e bağlanabilir
 * 3. Kontrol noktaları vertex'ten bağımsız olabilir
 */
export class VectorNetworkEngine {
  private network: VectorNetwork;

  constructor() {
    this.network = this.createEmptyNetwork();
  }

  // ==================== NETWORK YÖNETİMİ ====================

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

  // ==================== VERTEX İŞLEMLERİ ====================

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

    // Kontrol noktası tipi değiştiğinde control point'leri güncelle
    if (updates.type) {
      this.updateControlPointsByType(vertex);
    }

    return vertex;
  }

  deleteVertex(id: string): void {
    const vertex = this.findVertex(id);
    if (!vertex) return;

    // Bağlı tüm segment'leri sil
    vertex.connectedSegments.forEach(segmentId => {
      this.deleteSegment(segmentId);
    });

    // Vertex'i sil
    this.network.vertices = this.network.vertices.filter(v => v.id !== id);

    // Region'ları güncelle
    this.updateRegions();
  }

  findVertex(id: string): Vertex | undefined {
    return this.network.vertices.find(v => v.id === id);
  }

  // ==================== SEGMENT İŞLEMLERİ ====================

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

    // Vertex'lere segment'i bağla
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

    // Vertex'lerden bağlantıyı kaldır
    const startVertex = this.findVertex(segment.startVertexId);
    const endVertex = this.findVertex(segment.endVertexId);

    if (startVertex) {
      startVertex.connectedSegments = startVertex.connectedSegments.filter(s => s !== id);
    }
    if (endVertex) {
      endVertex.connectedSegments = endVertex.connectedSegments.filter(s => s !== id);
    }

    // Segment'i sil
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

  // ==================== CONTROL POINT İŞLEMLERİ ====================

  /**
   * Kontrol noktası tipine göre control point'leri güncelle
   * 
   * STRAIGHT: Kontrol noktası yok (düz çizgi)
   * MIRRORED: Gelen ve giden aynı açı ve mesafede (simetrik)
   * ASYMMETRIC: Gelen ve giden aynı açı, farklı mesafe
   * DISCONNECTED: Gelen ve giden tamamen bağımsız
   */
  updateControlPointsByType(vertex: Vertex): void {
    switch (vertex.type) {
      case 'STRAIGHT':
        vertex.controlIn = undefined;
        vertex.controlOut = undefined;
        break;

      case 'MIRRORED':
        if (vertex.controlIn) {
          // Giden kontrol noktasını gelenin ayna görüntüsü yap
          const dx = vertex.controlIn.x - vertex.x;
          const dy = vertex.controlIn.y - vertex.y;
          vertex.controlOut = {
            x: vertex.x - dx,
            y: vertex.y - dy
          };
        }
        break;

      case 'ASYMMETRIC':
        // Aynı açıyı koru ama mesafeleri bağımsız bırak
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
        // Hiçbir şey yapma - tamamen bağımsız
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

    // Tip MIRRORED veya ASYMMETRIC ise diğerini de güncelle
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

  // ==================== PATH İŞLEMLERİ ====================

  /**
   * Segment üzerinde nokta ekle (t = 0..1)
   */
  addPointOnSegment(segmentId: string, t: number): Vertex | null {
    const segment = this.findSegment(segmentId);
    if (!segment) return null;

    const startVertex = this.findVertex(segment.startVertexId);
    const endVertex = this.findVertex(segment.endVertexId);
    if (!startVertex || !endVertex) return null;

    // Bezier eğrisi üzerinde noktayı hesapla
    const curve = this.getBezierCurve(segment);
    const newPoint = this.calculateBezierPoint(curve, t);

    // Yeni vertex oluştur
    const newVertex = this.addVertex(
      newPoint.x,
      newPoint.y,
      'MIRRORED'
    );

    // Orijinal segment'i sil
    this.deleteSegment(segmentId);

    // İki yeni segment oluştur
    this.addSegment(startVertex.id, newVertex.id);
    this.addSegment(newVertex.id, endVertex.id);

    return newVertex;
  }

  /**
   * Path'i kapat (son vertex'ten ilk vertex'e segment oluştur)
   */
  closePath(): Segment | null {
    if (this.network.vertices.length < 2) return null;

    const firstVertex = this.network.vertices[0];
    const lastVertex = this.network.vertices[this.network.vertices.length - 1];

    // Zaten kapalı mı kontrol et
    const existingSegment = this.network.segments.find(
      s => (s.startVertexId === lastVertex.id && s.endVertexId === firstVertex.id) ||
           (s.startVertexId === firstVertex.id && s.endVertexId === lastVertex.id)
    );

    if (existingSegment) return null;

    return this.addSegment(lastVertex.id, firstVertex.id);
  }

  // ==================== BEZIER HESAPLAMALARI ====================

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
   * Cubic Bezier eğrisi üzerinde nokta hesapla
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
   * Bezier eğrisinin türevi (teğet)
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
   * Vector Network'ü SVG path data'ya dönüştür
   */
  toSVGPath(): string {
    const commands = this.generatePathCommands();
    return commands.map(cmd => this.pathCommandToString(cmd)).join(' ');
  }

  private generatePathCommands(): PathCommand[] {
    const commands: PathCommand[] = [];

    // Her region için path oluştur
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

  // ==================== REGION YÖNETİMİ ====================

  updateRegions(): void {
    // Basit implementation: Kapalı path'leri bul
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

    // DFS ile kapalı path'leri bul
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

      // Sonraki vertex'i bul
      const segments = this.getSegmentsForVertex(current);
      let foundNext = false;

      for (const segment of segments) {
        const nextId = segment.startVertexId === current ? segment.endVertexId : segment.startVertexId;

        if (nextId === startId && path.length > 2) {
          // Loop tamamlandı
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

    // Tüm vertex'leri scale et
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

    // Tüm vertex'leri rotate et
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
