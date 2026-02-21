// src/autolayout/AutoLayoutEngine.ts

import type {
  AutoLayoutConfig,
  AutoLayoutFrame,
  LayoutCalculationResult
} from '../types/autolayout';

/**
 * Figma Auto Layout Engine - 1:1 Implementation
 * 
 * Calculates positions and sizes for Auto Layout frames.
 * Equivalent to CSS Flexbox behavior.
 */
export class AutoLayoutEngine {
  /**
   * Calculate layout for an Auto Layout frame
   */
  calculate(frame: AutoLayoutFrame): LayoutCalculationResult {
    const config = frame.autoLayout;
    
    const isVertical = config.layoutMode === 'VERTICAL';
    
    // 1. Calculate children sizes
    const childSizes = this.calculateChildrenSizes(frame, isVertical);
    
    // 2. Calculate frame size (if AUTO sizing)
    let frameWidth = frame.width;
    let frameHeight = frame.height;
    
    if (config.primaryAxisSizingMode === 'AUTO') {
      if (isVertical) {
        frameHeight = this.calculatePrimaryAxisSize(childSizes, config, true);
      } else {
        frameWidth = this.calculatePrimaryAxisSize(childSizes, config, false);
      }
    }
    
    if (config.counterAxisSizingMode === 'AUTO') {
      if (isVertical) {
        frameWidth = this.calculateCounterAxisSize(childSizes, config, false);
      } else {
        frameHeight = this.calculateCounterAxisSize(childSizes, config, true);
      }
    }
    
    // 3. Calculate children positions
    const childrenPositions = this.calculateChildrenPositions(
      childSizes,
      config,
      frameWidth,
      frameHeight,
      isVertical
    );
    
    return {
      frameWidth,
      frameHeight,
      children: childrenPositions
    };
  }

  /**
   * Calculate sizes for all children
   */
  private calculateChildrenSizes(
    frame: AutoLayoutFrame,
    isVertical: boolean
  ): Map<string, { width: number; height: number }> {
    const sizes = new Map<string, { width: number; height: number }>();
    const config = frame.autoLayout;
    
    // Calculate total grow value
    const totalGrow = frame.children.reduce((sum, child) => sum + child.constraints.layoutGrow, 0);
    
    // Calculate available space for grow children
    const availableSpace = isVertical 
      ? frame.height - config.paddingTop - config.paddingBottom
      : frame.width - config.paddingLeft - config.paddingRight;
    
    const fixedSpace = frame.children.reduce((sum, child, index) => {
      const size = isVertical ? child.height : child.width;
      return sum + size + (index > 0 ? config.itemSpacing : 0);
    }, 0);
    
    const freeSpace = availableSpace - fixedSpace;
    
    frame.children.forEach(child => {
      let width = child.width;
      let height = child.height;
      
      // STRETCH on counter axis
      if (child.constraints.layoutAlign === 'STRETCH') {
        if (isVertical) {
          width = frame.width - config.paddingLeft - config.paddingRight;
        } else {
          height = frame.height - config.paddingTop - config.paddingBottom;
        }
      }
      
      // GROW on primary axis
      if (child.constraints.layoutGrow > 0 && totalGrow > 0 && freeSpace > 0) {
        const growAmount = (child.constraints.layoutGrow / totalGrow) * freeSpace;
        if (isVertical) {
          height += growAmount;
        } else {
          width += growAmount;
        }
      }
      
      sizes.set(child.id, { width, height });
    });
    
    return sizes;
  }

  /**
   * Calculate frame size along primary axis (AUTO mode)
   */
  private calculatePrimaryAxisSize(
    childSizes: Map<string, { width: number; height: number }>,
    config: AutoLayoutConfig,
    isVertical: boolean
  ): number {
    const children = Array.from(childSizes.values());
    const totalChildrenSize = children.reduce((sum, size, index) => {
      const childSize = isVertical ? size.height : size.width;
      return sum + childSize + (index > 0 ? config.itemSpacing : 0);
    }, 0);
    
    const padding = isVertical 
      ? config.paddingTop + config.paddingBottom
      : config.paddingLeft + config.paddingRight;
    
    return totalChildrenSize + padding;
  }

  /**
   * Calculate frame size along counter axis (AUTO mode)
   */
  private calculateCounterAxisSize(
    childSizes: Map<string, { width: number; height: number }>,
    config: AutoLayoutConfig,
    isVertical: boolean
  ): number {
    const children = Array.from(childSizes.values());
    const maxChildSize = Math.max(
      ...children.map(size => isVertical ? size.width : size.height)
    );
    
    const padding = isVertical 
      ? config.paddingLeft + config.paddingRight
      : config.paddingTop + config.paddingBottom;
    
    return maxChildSize + padding;
  }

  /**
   * Calculate positions for all children
   */
  private calculateChildrenPositions(
    childSizes: Map<string, { width: number; height: number }>,
    config: AutoLayoutConfig,
    frameWidth: number,
    frameHeight: number,
    isVertical: boolean
  ): LayoutCalculationResult['children'] {
    const results: LayoutCalculationResult['children'] = [];
    const children = Array.from(childSizes.entries());
    
    // Calculate total size along primary axis
    const totalPrimarySize = children.reduce((sum, [_, size], index) => {
      const childSize = isVertical ? size.height : size.width;
      return sum + childSize + (index > 0 ? config.itemSpacing : 0);
    }, 0);
    
    // Calculate starting position
    let currentPrimary = isVertical ? config.paddingTop : config.paddingLeft;
    
    // Adjust starting position based on alignment
    const availablePrimary = isVertical 
      ? frameHeight - config.paddingTop - config.paddingBottom
      : frameWidth - config.paddingLeft - config.paddingRight;
    
    if (config.primaryAxisAlignItems === 'CENTER') {
      currentPrimary += (availablePrimary - totalPrimarySize) / 2;
    } else if (config.primaryAxisAlignItems === 'MAX') {
      currentPrimary = (isVertical ? frameHeight - config.paddingBottom : frameWidth - config.paddingRight) - totalPrimarySize;
    }
    
    // Calculate gap for SPACE_BETWEEN
    let gap = config.itemSpacing;
    if (config.primaryAxisAlignItems === 'SPACE_BETWEEN' && children.length > 1) {
      gap = (availablePrimary - totalPrimarySize + config.itemSpacing * (children.length - 1)) / (children.length - 1);
    }
    
    children.forEach(([childId, size]) => {
      // Primary axis position
      let primary = currentPrimary;
      
      // Counter axis position
      let counter: number;
      const counterAvailable = isVertical 
        ? frameWidth - config.paddingLeft - config.paddingRight
        : frameHeight - config.paddingTop - config.paddingBottom;
      const counterSize = isVertical ? size.width : size.height;
      
      switch (config.counterAxisAlignItems) {
        case 'MIN':
          counter = isVertical ? config.paddingLeft : config.paddingTop;
          break;
        case 'CENTER':
          counter = (isVertical ? config.paddingLeft : config.paddingTop) + (counterAvailable - counterSize) / 2;
          break;
        case 'MAX':
          counter = (isVertical ? frameWidth - config.paddingRight : frameHeight - config.paddingBottom) - counterSize;
          break;
        case 'STRETCH':
          counter = isVertical ? config.paddingLeft : config.paddingTop;
          break;
        default:
          counter = isVertical ? config.paddingLeft : config.paddingTop;
      }
      
      results.push({
        id: childId,
        x: isVertical ? counter : primary,
        y: isVertical ? primary : counter,
        width: size.width,
        height: size.height
      });
      
      // Move to next position
      currentPrimary += (isVertical ? size.height : size.width) + gap;
    });
    
    return results;
  }

  /**
   * Convert Auto Layout config to CSS Flexbox
   */
  toCSS(config: AutoLayoutConfig): string {
    const css: string[] = [
      'display: flex;',
      `flex-direction: ${config.layoutMode === 'VERTICAL' ? 'column' : 'row'};`,
      `justify-content: ${this.alignToCSS(config.primaryAxisAlignItems)};`,
      `align-items: ${this.alignToCSS(config.counterAxisAlignItems)};`,
      `gap: ${config.itemSpacing}px;`,
      `padding: ${config.paddingTop}px ${config.paddingRight}px ${config.paddingBottom}px ${config.paddingLeft}px;`,
      `flex-wrap: ${config.layoutWrap === 'WRAP' ? 'wrap' : 'nowrap'};`
    ];
    
    return css.join('\n  ');
  }

  private alignToCSS(align: string): string {
    const map: Record<string, string> = {
      'MIN': 'flex-start',
      'CENTER': 'center',
      'MAX': 'flex-end',
      'SPACE_BETWEEN': 'space-between',
      'STRETCH': 'stretch',
      'BASELINE': 'baseline'
    };
    return map[align] || 'flex-start';
  }

  /**
   * Create default Auto Layout config
   */
  static createDefaultConfig(): AutoLayoutConfig {
    return {
      layoutMode: 'VERTICAL',
      primaryAxisSizingMode: 'AUTO',
      primaryAxisAlignItems: 'MIN',
      counterAxisSizingMode: 'AUTO',
      counterAxisAlignItems: 'MIN',
      itemSpacing: 10,
      paddingTop: 10,
      paddingBottom: 10,
      paddingLeft: 10,
      paddingRight: 10,
      layoutWrap: 'NO_WRAP'
    };
  }
}

export const autoLayoutEngine = new AutoLayoutEngine();
