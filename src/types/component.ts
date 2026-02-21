// src/types/component.ts

/**
 * Figma Component System - 1:1 Implementation
 * 
 * Components are reusable elements. When you edit a component,
 * all instances update automatically. Instances can override
 * properties without breaking the link to the master.
 */

export type ComponentPropertyType = 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT';

/**
 * Component Property Definition
 */
export interface ComponentProperty {
  name: string;
  type: ComponentPropertyType;
  defaultValue: string | boolean;
  preferredValues?: string[];  // For INSTANCE_SWAP
}

/**
 * Component Set (Variants container)
 */
export interface ComponentSetNode {
  id: string;
  type: 'COMPONENT_SET';
  name: string;
  
  // Variant properties
  variantProperties: {
    [propertyName: string]: string[];  // e.g., { "State": ["Default", "Hover", "Active"] }
  };
  
  // Children (variants)
  children: ComponentNode[];
  
  // Style
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Component Master (Main component)
 */
export interface ComponentNode {
  id: string;
  type: 'COMPONENT';
  name: string;
  
  // Parent component set (if part of variants)
  parentComponentSetId?: string;
  
  // Properties exposed for override
  componentPropertyDefinitions?: {
    [propertyName: string]: ComponentProperty;
  };
  
  // Variant property values (if this is a variant)
  variantProperties?: {
    [propertyName: string]: string;
  };
  
  // Children (layers)
  children: ComponentChild[];
  
  // Style
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Documentation
  description?: string;
  documentationLinks?: {
    uri: string;
    name?: string;
  }[];
}

/**
 * Component Instance
 */
export interface ComponentInstanceNode {
  id: string;
  type: 'INSTANCE';
  name: string;
  
  // Reference to master component
  componentId: string;
  
  // Overrides
  overrides: ComponentOverride[];
  
  // Current variant properties
  variantProperties?: {
    [propertyName: string]: string;
  };
  
  // Children (mirrored from master, with overrides applied)
  children: ComponentChild[];
  
  // Position & Size
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

/**
 * Component Override
 */
export interface ComponentOverride {
  // Path to overridden node
  path: string;  // e.g., "rectangle-1" or "group-2/text-3"
  
  // Property that was overridden
  property: OverrideProperty;
  
  // New value
  value: OverrideValue;
  
  // Is this override active?
  isOverride: boolean;
}

export type OverrideProperty = 
  | 'fills'
  | 'strokes'
  | 'strokeWeight'
  | 'opacity'
  | 'cornerRadius'
  | 'width'
  | 'height'
  | 'characters'
  | 'fontSize'
  | 'fontName'
  | 'fontWeight'
  | 'letterSpacing'
  | 'lineHeight'
  | 'textAlignHorizontal'
  | 'visible'
  | 'componentProperty';  // For property-linked overrides

export type OverrideValue = 
  | string
  | number
  | boolean
  | OverrideFill[]
  | OverrideStroke[];

export interface OverrideFill {
  type: 'SOLID' | 'GRADIENT';
  color?: string;
  gradientStops?: { position: number; color: string }[];
}

export interface OverrideStroke {
  color: string;
  weight: number;
}

/**
 * Component Child (layer inside component)
 */
export interface ComponentChild {
  id: string;
  type: 'RECTANGLE' | 'ELLIPSE' | 'FRAME' | 'GROUP' | 'TEXT' | 'VECTOR' | 'INSTANCE';
  name: string;
  
  // Hierarchy
  parentId?: string;
  children?: ComponentChild[];
  
  // Position & Size
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  
  // Style
  fills: OverrideFill[];
  strokes: OverrideStroke[];
  opacity: number;
  
  // Component property bindings
  componentPropertyReferences?: {
    [property: string]: string;  // property name -> property reference
  };
}

/**
 * Component Library
 */
export interface ComponentLibrary {
  teamId: string;
  name: string;
  components: Map<string, ComponentNode>;
  componentSets: Map<string, ComponentSetNode>;
}

/**
 * Component Property Binding
 */
export interface PropertyBinding {
  nodeId: string;
  property: string;
  componentPropertyName: string;
}

/**
 * Instance Swap Property
 */
export interface InstanceSwapValue {
  componentId: string;
  variantProperties?: {
    [propertyName: string]: string;
  };
}
