// src/layers/LayersEngine.ts

import type { LayerNode, LayerType } from '../types/layers';

/**
 * Layers Panel Engine
 * 
 * Manages layer hierarchy, visibility, locking, and ordering.
 */
export class LayersEngine {
  /**
   * Build layer tree from canvas objects
   */
  buildLayerTree(objects: any[]): LayerNode[] {
    return objects.map(obj => this.objectToLayer(obj, 0)).flat();
  }

  private objectToLayer(obj: any, depth: number): LayerNode {
    const type = this.getObjectType(obj);
    
    return {
      id: obj.id,
      name: obj.name || this.getDefaultName(type),
      type,
      parentId: null,
      children: obj.objects ? obj.objects.map((child: any) => this.objectToLayer(child, depth + 1)) : [],
      visible: obj.visible !== false,
      locked: obj.locked || obj.selectable === false,
      selected: false,
      depth,
      icon: this.getLayerIcon(type)
    };
  }

  private getObjectType(obj: any): LayerType {
    if (obj.type === 'rect') return 'RECTANGLE';
    if (obj.type === 'ellipse') return 'ELLIPSE';
    if (obj.type === 'line') return 'LINE';
    if (obj.type === 'path' || obj.type === 'vector') return 'VECTOR';
    if (obj.type === 'i-text' || obj.type === 'text') return 'TEXT';
    if (obj.type === 'group') return 'GROUP';
    if (obj.isComponent) return 'COMPONENT';
    if (obj.isInstance) return 'INSTANCE';
    return 'FRAME';
  }

  private getDefaultName(type: LayerType): string {
    const names: Record<LayerType, string> = {
      FRAME: 'Frame',
      GROUP: 'Group',
      COMPONENT: 'Component',
      INSTANCE: 'Instance',
      RECTANGLE: 'Rectangle',
      ELLIPSE: 'Ellipse',
      VECTOR: 'Vector',
      TEXT: 'Text',
      LINE: 'Line',
      BOOLEAN_OPERATION: 'Boolean'
    };
    return names[type] || 'Layer';
  }

  private getLayerIcon(type: LayerType): string {
    const icons: Record<LayerType, string> = {
      FRAME: '⬜',
      GROUP: '📁',
      COMPONENT: '🔷',
      INSTANCE: '🔶',
      RECTANGLE: '▢',
      ELLIPSE: '○',
      VECTOR: '✏️',
      TEXT: 'T',
      LINE: '/',
      BOOLEAN_OPERATION: '⊕'
    };
    return icons[type] || '?';
  }

  /**
   * Move layer in hierarchy
   */
  moveLayer(
    layers: LayerNode[],
    layerId: string,
    targetId: string,
    position: 'before' | 'after' | 'inside'
  ): LayerNode[] {
    // Implementation for reordering layers
    const newLayers = this.cloneLayers(layers);
    
    const layer = this.findLayer(newLayers, layerId);
    if (!layer) return layers;

    // Remove from current position
    this.removeLayer(newLayers, layerId);

    // Insert at new position
    if (position === 'inside') {
      const target = this.findLayer(newLayers, targetId);
      if (target) {
        layer.parentId = targetId;
        target.children.push(layer);
      }
    } else {
      const parent = this.findParent(newLayers, targetId);
      const siblings = parent ? parent.children : newLayers;
      const targetIndex = siblings.findIndex(l => l.id === targetId);
      
      const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
      siblings.splice(insertIndex, 0, layer);
    }

    return newLayers;
  }

  private cloneLayers(layers: LayerNode[]): LayerNode[] {
    return layers.map(l => ({ ...l, children: this.cloneLayers(l.children) }));
  }

  private findLayer(layers: LayerNode[], id: string): LayerNode | null {
    for (const layer of layers) {
      if (layer.id === id) return layer;
      const found = this.findLayer(layer.children, id);
      if (found) return found;
    }
    return null;
  }

  private findParent(layers: LayerNode[], id: string): LayerNode | null {
    for (const layer of layers) {
      if (layer.children.some(c => c.id === id)) return layer;
      const found = this.findParent(layer.children, id);
      if (found) return found;
    }
    return null;
  }

  private removeLayer(layers: LayerNode[], id: string): void {
    for (const layer of layers) {
      const index = layer.children.findIndex(c => c.id === id);
      if (index !== -1) {
        layer.children.splice(index, 1);
        return;
      }
      this.removeLayer(layer.children, id);
    }
  }

  /**
   * Toggle layer visibility
   */
  toggleVisibility(layers: LayerNode[], id: string): LayerNode[] {
    const layer = this.findLayer(layers, id);
    if (layer) {
      layer.visible = !layer.visible;
    }
    return [...layers];
  }

  /**
   * Toggle layer lock
   */
  toggleLock(layers: LayerNode[], id: string): LayerNode[] {
    const layer = this.findLayer(layers, id);
    if (layer) {
      layer.locked = !layer.locked;
    }
    return [...layers];
  }
}

export const layersEngine = new LayersEngine();
