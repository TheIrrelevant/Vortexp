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
 * İnteraksiyonlar:
 * 1. Click → Düz nokta ekle
 * 2. Click + Drag → Bezier kontrol noktası ekle
 * 3. Shift + Click → 45° açıyla kısıtla
 * 4. Alt + Click → Köşe noktası (disconnected)
 * 5. Double-click → Path'i kapat
 * 6. Click on first point → Path'i kapat
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
   * Mouse down - Yeni nokta başlat
   */
  handleMouseDown(
    point: Point,
    modifiers: { shift: boolean; alt: boolean; ctrl: boolean }
  ): void {
    if (this.state.isClosed) {
      // Yeni path başlat
      this.startNewPath();
    }

    // İlk nokta mı?
    if (!this.state.currentVertexId) {
      this.startNewPath();
    }

    // Shift basılı ise 45° açıyla kısıtla
    const constrainedPoint = modifiers.shift
      ? this.constrainToAngle(point)
      : point;

    // Nokta ekle
    const vertex = this.engine.addVertex(
      constrainedPoint.x,
      constrainedPoint.y,
      modifiers.alt ? 'DISCONNECTED' : 'MIRRORED'
    );

    // Önceki noktaya bağla
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
   * Mouse move - Drag için kontrol noktası oluştur
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
      // Kontrol noktası oluştur
      const controlPoint: ControlPoint = {
        x: point.x,
        y: point.y
      };

      // Shift basılı ise açıyı kısıtla
      const constrainedCP = modifiers.shift
        ? this.constrainControlPoint(currentVertex, controlPoint)
        : controlPoint;

      // Kontrol noktasını ayarla
      this.engine.updateVertex(currentVertex.id, {
        controlOut: constrainedCP,
        type: modifiers.alt ? 'ASYMMETRIC' : 'MIRRORED'
      });

      this.state.tempControlPoint = constrainedCP;
    } else {
      // Preview segment göster
      this.updatePreviewSegment();
    }

    this.notifyUpdate();
  }

  /**
   * Mouse up - Drag bitir
   */
  handleMouseUp(): void {
    if (this.state.tempControlPoint) {
      this.state.tempControlPoint = null;
      this.notifyUpdate();
    }
  }

  /**
   * Double click - Path'i kapat
   */
  handleDoubleClick(): void {
    this.closePath();
  }

  /**
   * İlk noktaya tıklama - Path'i kapat
   */
  handleClickOnVertex(vertexId: string): void {
    const network = this.engine.getNetwork();

    // İlk vertex'e mi tıklandı?
    if (vertexId === network.vertices[0]?.id && network.vertices.length > 2) {
      // Path'i kapat
      if (this.state.currentVertexId) {
        this.engine.addSegment(this.state.currentVertexId, vertexId);
      }

      this.state.isClosed = true;
      this.engine.updateRegions();
      this.notifyUpdate();
    }
  }

  /**
   * Escape - İptal et
   */
  handleEscape(): void {
    if (this.state.isDrawing) {
      // Son noktayı sil
      if (this.state.currentVertexId) {
        this.engine.deleteVertex(this.state.currentVertexId);
      }

      this.state = this.getInitialState();
      this.notifyUpdate();
    }
  }

  // ==================== YARDIMCI METODLAR ====================

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

    // 45° aralıklarla kısıtla
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

    // 45° aralıklarla kısıtla
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
