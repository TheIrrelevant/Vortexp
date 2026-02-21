// src/types/variables.ts

/**
 * Figma Variables & Design Tokens - 1:1 Implementation
 * 
 * Variables are reusable values that can be applied to design properties.
 * They support multiple modes (e.g., light/dark themes) and can be
 * organized into collections.
 */

export type VariableType = 'COLOR' | 'NUMBER' | 'STRING' | 'BOOLEAN';

export type VariableScope =
  | 'ALL_FILLS'
  | 'FRAME_FILL'
  | 'SHAPE_FILL'
  | 'TEXT_FILL'
  | 'STROKE_COLOR'
  | 'OPACITY'
  | 'WIDTH'
  | 'HEIGHT'
  | 'GAP'
  | 'PADDING'
  | 'CORNER_RADIUS'
  | 'FONT_SIZE'
  | 'LINE_HEIGHT'
  | 'LETTER_SPACING'
  | 'FONT_FAMILY'
  | 'FONT_WEIGHT'
  | 'TEXT_CONTENT'
  | 'VISIBILITY'
  | 'EFFECT_COLOR'
  | 'EFFECT_RADIUS';

/**
 * Variable Mode (e.g., Light, Dark, High Contrast)
 */
export interface VariableMode {
  modeId: string;
  name: string;
}

/**
 * Variable Collection
 */
export interface VariableCollection {
  id: string;
  name: string;
  
  // Modes
  modes: VariableMode[];
  defaultModeId: string;
  
  // Variable IDs in this collection
  variableIds: string[];
  
  // Publishing
  hiddenFromPublishing: boolean;
  remote: boolean;
}

/**
 * Variable
 */
export interface Variable {
  id: string;
  name: string;
  
  // Type
  type: VariableType;
  resolvedType: VariableType;
  
  // Values per mode
  values: {
    [modeId: string]: VariableValue;
  };
  
  // Description
  description?: string;
  
  // Scopes (where this variable can be used)
  scopes: VariableScope[];
  
  // Publishing
  hiddenFromPublishing: boolean;
  remote: boolean;
}

/**
 * Variable Value
 */
export type VariableValue = 
  | ColorValue
  | number
  | string
  | boolean
  | VariableAlias;

/**
 * Color Value (RGB 0-1)
 */
export interface ColorValue {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Variable Alias (reference to another variable)
 */
export interface VariableAlias {
  type: 'VARIABLE_ALIAS';
  id: string;
}

/**
 * Variable Binding (node -> variable)
 */
export interface VariableBinding {
  nodeId: string;
  property: string;
  variableId: string;
  modeId: string;
}

/**
 * Variable Mode Change
 */
export interface ModeChange {
  collectionId: string;
  modeId: string;
}

/**
 * Design Token Export Format
 */
export interface DesignTokens {
  [collectionName: string]: {
    [variablePath: string]: {
      $type: 'color' | 'number' | 'string' | 'boolean';
      $value: string | number | boolean;
      $description?: string;
    };
  };
}

/**
 * CSS Custom Properties Export
 */
export interface CSSCustomProperties {
  [propertyName: string]: string;
}

/**
 * JSON Token Export (Style Dictionary format)
 */
export interface JSONTokens {
  color?: {
    [key: string]: {
      value: string;
      type: string;
    } | JSONTokens;
  };
  spacing?: {
    [key: string]: {
      value: string;
      type: string;
    } | JSONTokens;
  };
  typography?: {
    [key: string]: {
      value: string;
      type: string;
    } | JSONTokens;
  };
  [key: string]: any;
}
