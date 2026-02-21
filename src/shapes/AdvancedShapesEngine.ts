// src/shapes/AdvancedShapesEngine.ts

import type { PolygonShape, StarShape } from '../types/advancedShapes';
import { fabric } from '../canvas/fabricSetup';

/**
 * Advanced Shapes Engine
 * 
 * Creates polygons, stars, arrows, and other complex shapes.
 */
export class AdvancedShapesEngine {
  /**
   * Create polygon points
   */
  createPolygonPoints(
    centerX: number,
    centerY: number,
    radius: number,
    sides: number,
    rotation: number = 0
  ): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const angleStep = (2 * Math.PI) / sides;
    const startAngle = rotation * Math.PI / 180 - Math.PI / 2;

    for (let i = 0; i < sides; i++) {
      const angle = startAngle + i * angleStep;
      points.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      });
    }

    return points;
  }

  /**
   * Create star points
   */
  createStarPoints(
    centerX: number,
    centerY: number,
    outerRadius: number,
    innerRadius: number,
    points: number,
    rotation: number = 0
  ): { x: number; y: number }[] {
    const starPoints: { x: number; y: number }[] = [];
    const angleStep = Math.PI / points;
    const startAngle = rotation * Math.PI / 180 - Math.PI / 2;

    for (let i = 0; i < points * 2; i++) {
      const angle = startAngle + i * angleStep;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      starPoints.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      });
    }

    return starPoints;
  }

  /**
   * Create polygon as fabric.Polygon
   */
  createPolygon(
    x: number,
    y: number,
    radius: number,
    sides: number,
    options: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
      rotation?: number;
    } = {}
  ): any {
    const points = this.createPolygonPoints(0, 0, radius, sides, options.rotation || 0);

    return new (fabric as any).Polygon(points, {
      left: x - radius,
      top: y - radius,
      fill: options.fill || '#3B82F6',
      stroke: options.stroke || '#F9FEFF',
      strokeWidth: options.strokeWidth || 2,
      opacity: options.opacity || 1,
      selectable: true
    });
  }

  /**
   * Create star as fabric.Polygon
   */
  createStar(
    x: number,
    y: number,
    outerRadius: number,
    innerRadius: number,
    points: number,
    options: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
      rotation?: number;
    } = {}
  ): any {
    const starPoints = this.createStarPoints(
      0, 0,
      outerRadius,
      innerRadius,
      points,
      options.rotation || 0
    );

    return new (fabric as any).Polygon(starPoints, {
      left: x - outerRadius,
      top: y - outerRadius,
      fill: options.fill || '#3B82F6',
      stroke: options.stroke || '#F9FEFF',
      strokeWidth: options.strokeWidth || 2,
      opacity: options.opacity || 1,
      selectable: true
    });
  }

  /**
   * Create arrow as fabric.Group
   */
  createArrow(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options: {
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
      headType?: 'arrow' | 'triangle';
      headSize?: number;
    } = {}
  ): any {
    const stroke = options.stroke || '#F9FEFF';
    const strokeWidth = options.strokeWidth || 2;
    const headSize = options.headSize || 10;
    const headType = options.headType || 'arrow';

    const objects: any[] = [];

    // Main line
    const line = new (fabric as any).Line([x1, y1, x2, y2], {
      stroke,
      strokeWidth,
      selectable: false
    });
    objects.push(line);

    // Arrow head
    const angle = Math.atan2(y2 - y1, x2 - x1);

    if (headType === 'arrow' || headType === 'triangle') {
      const headPoints = this.createArrowHead(x2, y2, angle, headSize, headType);
      const head = new (fabric as any).Polygon(headPoints, {
        fill: stroke,
        stroke,
        strokeWidth: 1,
        selectable: false
      });
      objects.push(head);
    }

    return new (fabric as any).Group(objects, {
      selectable: true
    });
  }

  /**
   * Create arrow head points
   */
  private createArrowHead(
    x: number,
    y: number,
    angle: number,
    size: number,
    type: 'arrow' | 'triangle'
  ): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];

    if (type === 'arrow') {
      // V-shaped arrow head
      points.push(
        { x: x, y: y },
        { 
          x: x - size * Math.cos(angle - Math.PI / 6),
          y: y - size * Math.sin(angle - Math.PI / 6)
        },
        {
          x: x - size * 0.3 * Math.cos(angle),
          y: y - size * 0.3 * Math.sin(angle)
        },
        {
          x: x - size * Math.cos(angle + Math.PI / 6),
          y: y - size * Math.sin(angle + Math.PI / 6)
        }
      );
    } else {
      // Triangle arrow head
      points.push(
        { x: x, y: y },
        {
          x: x - size * Math.cos(angle - Math.PI / 6),
          y: y - size * Math.sin(angle - Math.PI / 6)
        },
        {
          x: x - size * Math.cos(angle + Math.PI / 6),
          y: y - size * Math.sin(angle + Math.PI / 6)
        }
      );
    }

    return points;
  }

  /**
   * Get SVG path for polygon
   */
  polygonToSVGPath(shape: PolygonShape): string {
    const points = this.createPolygonPoints(
      shape.x,
      shape.y,
      shape.radius,
      shape.sides,
      shape.rotation
    );

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    d += ' Z';

    return d;
  }

  /**
   * Get SVG path for star
   */
  starToSVGPath(shape: StarShape): string {
    const points = this.createStarPoints(
      shape.x,
      shape.y,
      shape.outerRadius,
      shape.innerRadius,
      shape.points,
      shape.rotation
    );

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    d += ' Z';

    return d;
  }
}

export const advancedShapesEngine = new AdvancedShapesEngine();
