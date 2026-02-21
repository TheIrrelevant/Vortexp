// src/components/BooleanPanel.tsx

import { useState } from 'react';
import { useCanvasStore } from '../store/fullCanvasStore';
import { booleanOperationsEngine } from '../boolean/BooleanOperationsEngine';

type BooleanOp = 'union' | 'subtract' | 'intersect' | 'exclude';

const booleanOps: { id: BooleanOp; label: string; icon: string; description: string }[] = [
  { id: 'union', label: 'Union', icon: '⋃', description: 'Combine shapes' },
  { id: 'subtract', label: 'Subtract', icon: '−', description: 'Cut from shape' },
  { id: 'intersect', label: 'Intersect', icon: '∩', description: 'Common area' },
  { id: 'exclude', label: 'Exclude', icon: '⊕', description: 'XOR operation' }
];

export function BooleanPanel() {
  const { shapes, selectedIds, addShape, deleteShape } = useCanvasStore();
  const [lastOperation, setLastOperation] = useState<BooleanOp | null>(null);

  const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));

  const handleBooleanOp = (operation: BooleanOp) => {
    if (selectedShapes.length < 2) {
      alert('Select at least 2 shapes for boolean operations');
      return;
    }

    // Get paths from selected shapes
    const paths = selectedShapes.map(shape => ({
      points: [{ x: shape.x, y: shape.y }, { x: shape.x + (shape.width || 100), y: shape.y }, { x: shape.x + (shape.width || 100), y: shape.y + (shape.height || 100) }, { x: shape.x, y: shape.y + (shape.height || 100) }],
      closed: true,
      fillRule: 'nonzero' as const
    }));

    // Perform operation
    let result;
    switch (operation) {
      case 'union':
        result = booleanOperationsEngine.union(paths);
        break;
      case 'subtract':
        result = booleanOperationsEngine.subtract(paths);
        break;
      case 'intersect':
        result = booleanOperationsEngine.intersect(paths);
        break;
      case 'exclude':
        result = booleanOperationsEngine.exclude(paths);
        break;
    }

    // Create new shape from result
    if (result.points.length > 0) {
      const bounds = getBounds(result.points);
      
      addShape({
        id: Date.now().toString(),
        name: `${operation.charAt(0).toUpperCase() + operation.slice(1)} Result`,
        type: 'vector',
        x: bounds.minX,
        y: bounds.minY,
        width: bounds.maxX - bounds.minX,
        height: bounds.maxY - bounds.minY,
        rotation: 0,
        fill: selectedShapes[0].fill,
        stroke: selectedShapes[0].stroke,
        strokeWidth: selectedShapes[0].strokeWidth,
        opacity: selectedShapes[0].opacity,
        parentId: null,
        children: [],
        locked: false,
        visible: true
      });

      // Delete original shapes
      selectedIds.forEach(id => deleteShape(id));
      setLastOperation(operation);
    }
  };

  return (
    <div className="boolean-panel">
      <h3>Boolean Operations</h3>
      
      {selectedShapes.length < 2 && (
        <p className="hint">Select 2+ shapes</p>
      )}
      
      <div className="boolean-grid">
        {booleanOps.map(op => (
          <button
            key={op.id}
            className={`boolean-btn ${lastOperation === op.id ? 'active' : ''}`}
            onClick={() => handleBooleanOp(op.id)}
            disabled={selectedShapes.length < 2}
            title={op.description}
          >
            <span className="boolean-icon">{op.icon}</span>
            <span className="boolean-label">{op.label}</span>
          </button>
        ))}
      </div>
      
      <div className="boolean-preview">
        <p>Selected: {selectedShapes.length} shapes</p>
        {selectedShapes.map(s => (
          <span key={s.id} className="shape-tag">{s.type}</span>
        ))}
      </div>
    </div>
  );
}

function getBounds(points: { x: number; y: number }[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  points.forEach(p => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });
  
  return { minX, minY, maxX, maxY };
}
