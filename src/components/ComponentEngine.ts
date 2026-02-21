// src/components/ComponentEngine.ts

import { nanoid } from 'nanoid';
import type {
  ComponentNode,
  ComponentInstanceNode,
  ComponentChild,
  ComponentProperty,
  OverrideProperty,
  OverrideValue
} from '../types/component';

/**
 * Figma Component Engine - 1:1 Implementation
 * 
 * Manages component master-instance relationships,
 * overrides, and property bindings.
 */
export class ComponentEngine {
  private componentRegistry: Map<string, ComponentNode> = new Map();
  private instanceRegistry: Map<string, ComponentInstanceNode> = new Map();

  // ==================== COMPONENT MANAGEMENT ====================

  /**
   * Create a new component master
   */
  createComponent(
    name: string,
    children: ComponentChild[],
    properties?: { [name: string]: ComponentProperty }
  ): ComponentNode {
    const component: ComponentNode = {
      id: nanoid(),
      type: 'COMPONENT',
      name,
      children,
      x: 0,
      y: 0,
      width: this.calculateBounds(children).width,
      height: this.calculateBounds(children).height,
      componentPropertyDefinitions: properties
    };

    this.componentRegistry.set(component.id, component);
    return component;
  }

  /**
   * Get component by ID
   */
  getComponent(componentId: string): ComponentNode | undefined {
    return this.componentRegistry.get(componentId);
  }

  /**
   * Update component master
   */
  updateComponent(componentId: string, updates: Partial<ComponentNode>): void {
    const component = this.componentRegistry.get(componentId);
    if (!component) return;

    Object.assign(component, updates);

    // Propagate changes to all instances
    this.propagateToInstances(componentId);
  }

  /**
   * Delete component and all its instances
   */
  deleteComponent(componentId: string): void {
    // Delete all instances
    this.instanceRegistry.forEach((instance, id) => {
      if (instance.componentId === componentId) {
        this.instanceRegistry.delete(id);
      }
    });

    this.componentRegistry.delete(componentId);
  }

  // ==================== INSTANCE MANAGEMENT ====================

  /**
   * Create instance from component
   */
  createInstance(componentId: string): ComponentInstanceNode | null {
    const component = this.componentRegistry.get(componentId);
    if (!component) return null;

    const instance: ComponentInstanceNode = {
      id: nanoid(),
      type: 'INSTANCE',
      name: component.name,
      componentId,
      overrides: [],
      children: this.cloneChildren(component.children),
      x: 0,
      y: 0,
      width: component.width,
      height: component.height,
      rotation: 0
    };

    this.instanceRegistry.set(instance.id, instance);
    return instance;
  }

  /**
   * Get instance by ID
   */
  getInstance(instanceId: string): ComponentInstanceNode | undefined {
    return this.instanceRegistry.get(instanceId);
  }

  /**
   * Apply override to instance
   */
  applyOverride(
    instanceId: string,
    path: string,
    property: OverrideProperty,
    value: OverrideValue
  ): void {
    const instance = this.instanceRegistry.get(instanceId);
    if (!instance) return;

    // Find or create override
    const existingOverride = instance.overrides.find(
      o => o.path === path && o.property === property
    );

    if (existingOverride) {
      existingOverride.value = value;
      existingOverride.isOverride = true;
    } else {
      instance.overrides.push({
        path,
        property,
        value,
        isOverride: true
      });
    }

    // Apply override to children
    this.applyOverrideToChildren(instance, path, property, value);
  }

  /**
   * Reset override (revert to master value)
   */
  resetOverride(
    instanceId: string,
    path: string,
    property: OverrideProperty
  ): void {
    const instance = this.instanceRegistry.get(instanceId);
    if (!instance) return;

    const component = this.componentRegistry.get(instance.componentId);
    if (!component) return;

    // Remove override
    instance.overrides = instance.overrides.filter(
      o => !(o.path === path && o.property === property)
    );

    // Restore original value from master
    const masterChild = this.findChildByPath(component.children, path);
    const instanceChild = this.findChildByPath(instance.children, path);

    if (masterChild && instanceChild) {
      this.applyProperty(instanceChild, property, this.getProperty(masterChild, property));
    }
  }

  /**
   * Reset all overrides
   */
  resetAllOverrides(instanceId: string): void {
    const instance = this.instanceRegistry.get(instanceId);
    if (!instance) return;

    instance.overrides = [];
    const component = this.componentRegistry.get(instance.componentId);
    if (component) {
      instance.children = this.cloneChildren(component.children);
    }
  }

  // ==================== PROPERTY BINDINGS ====================

  /**
   * Bind component property to node property
   */
  bindProperty(
    componentId: string,
    nodeId: string,
    property: string,
    componentPropertyName: string
  ): void {
    const component = this.componentRegistry.get(componentId);
    if (!component) return;

    const child = this.findChildById(component.children, nodeId);
    if (!child) return;

    child.componentPropertyReferences = child.componentPropertyReferences || {};
    child.componentPropertyReferences[property] = componentPropertyName;
  }

  /**
   * Set component property value on instance
   */
  setComponentProperty(
    instanceId: string,
    propertyName: string,
    value: OverrideValue
  ): void {
    const instance = this.instanceRegistry.get(instanceId);
    if (!instance) return;

    const component = this.componentRegistry.get(instance.componentId);
    if (!component) return;

    // Find all nodes bound to this property
    this.applyPropertyToBoundNodes(instance.children, component.children, propertyName, value);
  }

  // ==================== PROPAGATION ====================

  /**
   * Propagate master changes to all instances
   */
  private propagateToInstances(componentId: string): void {
    this.instanceRegistry.forEach(instance => {
      if (instance.componentId === componentId) {
        this.syncInstanceFromMaster(instance);
      }
    });
  }

  /**
   * Sync instance with master, preserving overrides
   */
  private syncInstanceFromMaster(instance: ComponentInstanceNode): void {
    const component = this.componentRegistry.get(instance.componentId);
    if (!component) return;

    // Clone master children
    const newChildren = this.cloneChildren(component.children);

    // Re-apply overrides
    instance.overrides.forEach(override => {
      if (override.isOverride) {
        const child = this.findChildByPath(newChildren, override.path);
        if (child) {
          this.applyProperty(child, override.property, override.value);
        }
      }
    });

    instance.children = newChildren;
    instance.width = component.width;
    instance.height = component.height;
  }

  // ==================== HELPERS ====================

  private cloneChildren(children: ComponentChild[]): ComponentChild[] {
    return children.map(child => ({
      ...child,
      id: nanoid(),  // New ID for instance
      children: child.children ? this.cloneChildren(child.children) : undefined
    }));
  }

  private findChildByPath(children: ComponentChild[], path: string): ComponentChild | null {
    const parts = path.split('/');
    
    let current = children;
    let found: ComponentChild | null = null;

    for (const part of parts) {
      found = current.find(c => c.name === part || c.id === part) || null;
      if (!found) return null;
      if (found.children) {
        current = found.children;
      }
    }

    return found;
  }

  private findChildById(children: ComponentChild[], id: string): ComponentChild | null {
    for (const child of children) {
      if (child.id === id) return child;
      if (child.children) {
        const found = this.findChildById(child.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  private applyProperty(
    child: ComponentChild,
    property: OverrideProperty,
    value: OverrideValue
  ): void {
    switch (property) {
      case 'fills':
        child.fills = value as any[];
        break;
      case 'opacity':
        child.opacity = value as number;
        break;
      case 'visible':
        // child.visible = value as boolean;
        break;
      // ... other properties
    }
  }

  private getProperty(child: ComponentChild, property: OverrideProperty): OverrideValue {
    switch (property) {
      case 'fills':
        return child.fills;
      case 'opacity':
        return child.opacity;
      default:
        return null as any;
    }
  }

  private applyOverrideToChildren(
    instance: ComponentInstanceNode,
    path: string,
    property: OverrideProperty,
    value: OverrideValue
  ): void {
    const child = this.findChildByPath(instance.children, path);
    if (child) {
      this.applyProperty(child, property, value);
    }
  }

  private applyPropertyToBoundNodes(
    instanceChildren: ComponentChild[],
    masterChildren: ComponentChild[],
    propertyName: string,
    value: OverrideValue
  ): void {
    masterChildren.forEach((masterChild, index) => {
      const instanceChild = instanceChildren[index];
      
      if (masterChild.componentPropertyReferences) {
        const boundProperty = Object.entries(masterChild.componentPropertyReferences)
          .find(([_, ref]) => ref === propertyName);
        
        if (boundProperty && instanceChild) {
          this.applyProperty(instanceChild, boundProperty[0] as OverrideProperty, value);
        }
      }

      if (masterChild.children && instanceChild.children) {
        this.applyPropertyToBoundNodes(
          instanceChild.children,
          masterChild.children,
          propertyName,
          value
        );
      }
    });
  }

  private calculateBounds(children: ComponentChild[]): { width: number; height: number } {
    let maxX = 0;
    let maxY = 0;

    children.forEach(child => {
      maxX = Math.max(maxX, child.x + child.width);
      maxY = Math.max(maxY, child.y + child.height);
    });

    return { width: maxX, height: maxY };
  }

  // ==================== DETACH ====================

  /**
   * Detach instance from master (convert to regular frame)
   */
  detachInstance(instanceId: string): ComponentChild | null {
    const instance = this.instanceRegistry.get(instanceId);
    if (!instance) return null;

    // Create detached copy
    const detached: ComponentChild = {
      id: nanoid(),
      type: 'FRAME',
      name: instance.name,
      x: instance.x,
      y: instance.y,
      width: instance.width,
      height: instance.height,
      rotation: instance.rotation,
      children: instance.children,
      fills: [],
      strokes: [],
      opacity: 1
    };

    this.instanceRegistry.delete(instanceId);
    return detached;
  }
}

export const componentEngine = new ComponentEngine();
