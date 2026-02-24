// src/canvas/fabricSetup.ts
// Load Fabric.js module in optimized form

import * as fabricModule from 'fabric';

// Export fabric namespace - fabricModule is the fabric object directly
export const fabric = fabricModule as any;

// Calculate canvas dimensions based on container
export function getCanvasDimensions(containerId: string): { width: number; height: number } {
  const container = document.getElementById(containerId);
  if (!container) {
    return { width: 800, height: 600 };
  }

  const rect = container.getBoundingClientRect();
  const padding = 80; // 40px on each side

  return {
    width: Math.max(800, rect.width - padding),
    height: Math.max(600, rect.height - padding)
  };
}

// Create grid
export function createGridPattern(
  canvas: any,
  gridSize: number = 20
): any {
  const lines: any[] = [];
  const width = canvas.width || 800;
  const height = canvas.height || 600;

  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    const line = new fabric.Line([x, 0, x, height], {
      stroke: '#E2E7E9',
      strokeWidth: 0.5,
      opacity: 0.1,
      selectable: false,
      evented: false,
    });
    lines.push(line);
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    const line = new fabric.Line([0, y, width, y], {
      stroke: '#E2E7E9',
      strokeWidth: 0.5,
      opacity: 0.1,
      selectable: false,
      evented: false,
    });
    lines.push(line);
  }

  return new fabric.Group(lines, {
    selectable: false,
    evented: false,
  });
}
