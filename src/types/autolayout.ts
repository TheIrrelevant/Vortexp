// src/types/autolayout.ts

/**
 * Figma Auto Layout - 1:1 Implementation
 * 
 * Auto Layout is Figma's implementation of CSS Flexbox.
 * It allows frames to automatically resize based on their children.
 */

export type LayoutDirection = 'HORIZONTAL' | 'VERTICAL';
export type LayoutAlignment = 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
export type LayoutSizing = 'FIXED' | 'AUTO' | 'FILL';
export type LayoutWrap = 'NO_WRAP' | 'WRAP';

/**
 * Auto Layout Configuration
 */
export interface AutoLayoutConfig {
  // Direction
  layoutMode: LayoutDirection;
  
  // Primary Axis (main axis along direction)
  primaryAxisSizingMode: LayoutSizing;
  primaryAxisAlignItems: LayoutAlignment;
  
  // Counter Axis (perpendicular to direction)
  counterAxisSizingMode: LayoutSizing;
  counterAxisAlignItems: LayoutAlignment | 'STRETCH';
  
  // Spacing
  itemSpacing: number;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
  
  // Advanced
  layoutWrap: LayoutWrap;
  
  // Constraints for children
  constraints?: LayoutConstraints;
}

/**
 * Layout Constraints for Auto Layout children
 */
export interface LayoutConstraints {
  // Resizing behavior
  layoutAlign: 'INHERIT' | 'STRETCH' | 'MIN' | 'CENTER' | 'MAX';
  layoutGrow: number;  // 0 = don't grow, 1 = grow to fill
  layoutShrink: number;  // 0 = don't shrink, 1 = shrink if needed
  
  // Absolute positioning (bypasses auto layout)
  position: 'AUTO' | 'ABSOLUTE';
  
  // Absolute position values (if position is ABSOLUTE)
  absoluteX?: number;
  absoluteY?: number;
}

/**
 * Auto Layout Frame
 */
export interface AutoLayoutFrame {
  id: string;
  type: 'FRAME';
  name: string;
  
  // Auto Layout config
  autoLayout: AutoLayoutConfig;
  
  // Children
  children: AutoLayoutChild[];
  
  // Frame properties
  width: number;
  height: number;
  x: number;
  y: number;
  
  // Style
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
  opacity: number;
  
  // Clipping
  clipsContent: boolean;
}

/**
 * Auto Layout Child
 */
export interface AutoLayoutChild {
  id: string;
  
  // Layout properties
  constraints: LayoutConstraints;
  
  // Size
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  
  // Computed position (after auto layout calculation)
  computedX?: number;
  computedY?: number;
  computedWidth?: number;
  computedHeight?: number;
}

/**
 * Layout Calculation Result
 */
export interface LayoutCalculationResult {
  frameWidth: number;
  frameHeight: number;
  children: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
}

/**
 * Auto Layout to CSS Flexbox mapping
 */
export const AUTO_LAYOUT_TO_CSS: Record<string, string> = {
  'HORIZONTAL': 'row',
  'VERTICAL': 'column',
  'MIN': 'flex-start',
  'CENTER': 'center',
  'MAX': 'flex-end',
  'SPACE_BETWEEN': 'space-between',
  'STRETCH': 'stretch',
  'NO_WRAP': 'nowrap',
  'WRAP': 'wrap'
};
