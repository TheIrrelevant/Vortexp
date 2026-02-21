// src/variables/VariableEngine.ts

import { nanoid } from 'nanoid';
import type {
  Variable,
  VariableCollection,
  VariableMode,
  VariableType,
  VariableValue,
  VariableScope,
  VariableBinding,
  ColorValue,
  DesignTokens,
  CSSCustomProperties,
  VariableAlias
} from '../types/variables';

/**
 * Figma Variable Engine - 1:1 Implementation
 * 
 * Manages variables, collections, modes, and bindings.
 * Supports design token export and real-time updates.
 */
export class VariableEngine {
  private collections: Map<string, VariableCollection> = new Map();
  private variables: Map<string, Variable> = new Map();
  private bindings: Map<string, VariableBinding[]> = new Map();  // nodeId -> bindings
  private activeModes: Map<string, string> = new Map();  // collectionId -> activeModeId

  // ==================== COLLECTION MANAGEMENT ====================

  /**
   * Create a new variable collection
   */
  createCollection(name: string, modes?: string[]): VariableCollection {
    const defaultModes: VariableMode[] = modes 
      ? modes.map(name => ({ modeId: nanoid(), name }))
      : [{ modeId: nanoid(), name: 'Default' }];

    const collection: VariableCollection = {
      id: nanoid(),
      name,
      modes: defaultModes,
      defaultModeId: defaultModes[0].modeId,
      variableIds: [],
      hiddenFromPublishing: false,
      remote: false
    };

    this.collections.set(collection.id, collection);
    this.activeModes.set(collection.id, collection.defaultModeId);

    return collection;
  }

  /**
   * Get collection by ID
   */
  getCollection(collectionId: string): VariableCollection | undefined {
    return this.collections.get(collectionId);
  }

  /**
   * Get all collections
   */
  getAllCollections(): VariableCollection[] {
    return Array.from(this.collections.values());
  }

  /**
   * Add mode to collection
   */
  addMode(collectionId: string, name: string): VariableMode | null {
    const collection = this.collections.get(collectionId);
    if (!collection) return null;

    const mode: VariableMode = {
      modeId: nanoid(),
      name
    };

    collection.modes.push(mode);

    // Add default value for all variables in collection
    collection.variableIds.forEach(variableId => {
      const variable = this.variables.get(variableId);
      if (variable) {
        const defaultValue = Object.values(variable.values)[0];
        variable.values[mode.modeId] = defaultValue;
      }
    });

    return mode;
  }

  /**
   * Delete mode from collection
   */
  deleteMode(collectionId: string, modeId: string): void {
    const collection = this.collections.get(collectionId);
    if (!collection) return;

    // Cannot delete default mode
    if (collection.defaultModeId === modeId) return;

    collection.modes = collection.modes.filter(m => m.modeId !== modeId);

    // Remove values from all variables
    collection.variableIds.forEach(variableId => {
      const variable = this.variables.get(variableId);
      if (variable) {
        delete variable.values[modeId];
      }
    });
  }

  // ==================== VARIABLE MANAGEMENT ====================

  /**
   * Create a new variable
   */
  createVariable(
    collectionId: string,
    name: string,
    type: VariableType,
    initialValue?: VariableValue
  ): Variable | null {
    const collection = this.collections.get(collectionId);
    if (!collection) return null;

    const variable: Variable = {
      id: nanoid(),
      name,
      type,
      resolvedType: type,
      values: {},
      description: '',
      scopes: this.getDefaultScopes(type),
      hiddenFromPublishing: false,
      remote: false
    };

    // Set initial value for all modes
    const defaultValue = initialValue || this.getDefaultValue(type);
    collection.modes.forEach(mode => {
      variable.values[mode.modeId] = defaultValue;
    });

    collection.variableIds.push(variable.id);
    this.variables.set(variable.id, variable);

    return variable;
  }

  /**
   * Get variable by ID
   */
  getVariable(variableId: string): Variable | undefined {
    return this.variables.get(variableId);
  }

  /**
   * Get variables by collection
   */
  getVariablesByCollection(collectionId: string): Variable[] {
    const collection = this.collections.get(collectionId);
    if (!collection) return [];

    return collection.variableIds
      .map(id => this.variables.get(id))
      .filter((v): v is Variable => v !== undefined);
  }

  /**
   * Update variable value for a mode
   */
  setVariableValue(
    variableId: string,
    modeId: string,
    value: VariableValue
  ): void {
    const variable = this.variables.get(variableId);
    if (!variable) return;

    variable.values[modeId] = value;

    // Propagate to all bound nodes
    this.propagateToBindings(variableId, modeId);
  }

  /**
   * Delete variable
   */
  deleteVariable(variableId: string): void {
    const variable = this.variables.get(variableId);
    if (!variable) return;

    // Remove from collection
    this.collections.forEach(collection => {
      collection.variableIds = collection.variableIds.filter(id => id !== variableId);
    });

    // Remove bindings
    this.bindings.forEach((bindings, nodeId) => {
      this.bindings.set(nodeId, bindings.filter(b => b.variableId !== variableId));
    });

    this.variables.delete(variableId);
  }

  // ==================== BINDINGS ====================

  /**
   * Bind variable to node property
   */
  bindVariable(
    nodeId: string,
    property: string,
    variableId: string,
    collectionId: string
  ): void {
    const variable = this.variables.get(variableId);
    if (!variable) return;

    const modeId = this.activeModes.get(collectionId) || '';

    const binding: VariableBinding = {
      nodeId,
      property,
      variableId,
      modeId
    };

    if (!this.bindings.has(nodeId)) {
      this.bindings.set(nodeId, []);
    }
    this.bindings.get(nodeId)!.push(binding);

    // Apply immediately
    this.applyBinding(binding);
  }

  /**
   * Unbind variable from node property
   */
  unbindVariable(nodeId: string, property: string): void {
    const bindings = this.bindings.get(nodeId);
    if (!bindings) return;

    this.bindings.set(
      nodeId,
      bindings.filter(b => b.property !== property)
    );
  }

  /**
   * Get bindings for a node
   */
  getBindingsForNode(nodeId: string): VariableBinding[] {
    return this.bindings.get(nodeId) || [];
  }

  /**
   * Get all bindings for a variable
   */
  getBindingsForVariable(variableId: string): VariableBinding[] {
    const result: VariableBinding[] = [];
    this.bindings.forEach(bindings => {
      bindings.forEach(binding => {
        if (binding.variableId === variableId) {
          result.push(binding);
        }
      });
    });
    return result;
  }

  // ==================== MODE SWITCHING ====================

  /**
   * Set active mode for a collection
   */
  setActiveMode(collectionId: string, modeId: string): void {
    this.activeModes.set(collectionId, modeId);

    // Update all bindings for this collection
    this.bindings.forEach(bindings => {
      bindings.forEach(binding => {
        const variable = this.variables.get(binding.variableId);
        if (variable) {
          const collection = this.findCollectionForVariable(variable.id);
          if (collection && collection.id === collectionId) {
            binding.modeId = modeId;
            this.applyBinding(binding);
          }
        }
      });
    });
  }

  /**
   * Get active mode for a collection
   */
  getActiveMode(collectionId: string): string | undefined {
    return this.activeModes.get(collectionId);
  }

  // ==================== RESOLVE VALUES ====================

  /**
   * Resolve variable value (follow aliases)
   */
  resolveValue(value: VariableValue): VariableValue {
    if (this.isAlias(value)) {
      const alias = value as VariableAlias;
      const variable = this.variables.get(alias.id);
      if (variable) {
        const activeMode = this.getActiveModeForVariable(variable.id);
        const modeKey = activeMode || Object.keys(variable.values)[0];
        const resolvedValue = variable.values[modeKey];
        return this.resolveValue(resolvedValue);
      }
    }
    return value;
  }

  /**
   * Get resolved value for a binding
   */
  getResolvedValue(binding: VariableBinding): VariableValue {
    const variable = this.variables.get(binding.variableId);
    if (!variable) return this.getDefaultValue('STRING');

    const modeId = binding.modeId || this.getActiveModeForVariable(variable.id);
    const value = variable.values[modeId || ''];

    return this.resolveValue(value);
  }

  // ==================== EXPORT ====================

  /**
   * Export as Design Tokens (JSON)
   */
  exportDesignTokens(): DesignTokens {
    const tokens: DesignTokens = {};

    this.collections.forEach(collection => {
      tokens[collection.name] = {};

      collection.variableIds.forEach(variableId => {
        const variable = this.variables.get(variableId);
        if (!variable || variable.hiddenFromPublishing) return;

        const path = variable.name.split('/');
        let current: any = tokens[collection.name];

        path.forEach((part, index) => {
          if (index === path.length - 1) {
            current[part] = {
              $type: this.mapType(variable.type),
              $value: this.formatValue(variable.values[collection.defaultModeId]),
              $description: variable.description
            };
          } else {
            current[part] = current[part] || {};
            current = current[part];
          }
        });
      });
    });

    return tokens;
  }

  /**
   * Export as CSS Custom Properties
   */
  exportCSSCustomProperties(collectionId?: string): CSSCustomProperties {
    const css: CSSCustomProperties = {};

    const collections = collectionId
      ? [this.collections.get(collectionId)].filter((c): c is VariableCollection => c !== undefined)
      : Array.from(this.collections.values());

    collections.forEach(collection => {
      collection.variableIds.forEach(variableId => {
        const variable = this.variables.get(variableId);
        if (!variable || variable.hiddenFromPublishing) return;

        const cssName = `--${variable.name.replace(/\//g, '-')}`;
        const value = this.resolveValue(variable.values[collection.defaultModeId]);

        css[cssName] = this.formatCSSValue(value, variable.type);
      });
    });

    return css;
  }

  // ==================== PRIVATE HELPERS ====================

  private applyBinding(binding: VariableBinding): void {
    this.getResolvedValue(binding);
    // This would be implemented to update the actual node
    // emit('variableBindingUpdated', { binding, value });
  }

  private propagateToBindings(variableId: string, modeId: string): void {
    const bindings = this.getBindingsForVariable(variableId);
    bindings.forEach(binding => {
      if (binding.modeId === modeId) {
        this.applyBinding(binding);
      }
    });
  }

  private findCollectionForVariable(variableId: string): VariableCollection | null {
    for (const collection of this.collections.values()) {
      if (collection.variableIds.includes(variableId)) {
        return collection;
      }
    }
    return null;
  }

  private getActiveModeForVariable(variableId: string): string | undefined {
    const collection = this.findCollectionForVariable(variableId);
    return collection ? this.activeModes.get(collection.id) : undefined;
  }

  private getDefaultScopes(type: VariableType): VariableScope[] {
    switch (type) {
      case 'COLOR':
        return ['ALL_FILLS', 'STROKE_COLOR', 'EFFECT_COLOR'];
      case 'NUMBER':
        return ['WIDTH', 'HEIGHT', 'GAP', 'PADDING', 'CORNER_RADIUS', 'FONT_SIZE', 'OPACITY'];
      case 'STRING':
        return ['FONT_FAMILY', 'TEXT_CONTENT'];
      case 'BOOLEAN':
        return ['VISIBILITY'];
      default:
        return [];
    }
  }

  private getDefaultValue(type: VariableType): VariableValue {
    switch (type) {
      case 'COLOR':
        return { r: 0, g: 0, b: 0, a: 1 };
      case 'NUMBER':
        return 0;
      case 'STRING':
        return '';
      case 'BOOLEAN':
        return false;
    }
  }

  private isAlias(value: VariableValue): value is VariableAlias {
    return typeof value === 'object' && value !== null && 'type' in value && (value as VariableAlias).type === 'VARIABLE_ALIAS';
  }

  private mapType(type: VariableType): 'color' | 'number' | 'string' | 'boolean' {
    return type.toLowerCase() as 'color' | 'number' | 'string' | 'boolean';
  }

  private formatValue(value: VariableValue): string | number | boolean {
    if (typeof value === 'object' && 'r' in value) {
      // Color
      const c = value as ColorValue;
      return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${c.a})`;
    }
    return value as string | number | boolean;
  }

  private formatCSSValue(value: VariableValue, type: VariableType): string {
    if (type === 'COLOR' && typeof value === 'object' && value !== null && 'r' in value) {
      const c = value as ColorValue;
      return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${c.a})`;
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  }
}

export const variableEngine = new VariableEngine();
