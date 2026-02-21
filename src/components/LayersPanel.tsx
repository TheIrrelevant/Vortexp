// src/components/LayersPanel.tsx

import { useCanvasStore, type Shape } from '../store/fullCanvasStore';
import { fullCanvasEngine } from '../canvas/FullCanvasEngine';

const typeIcons: Record<string, string> = {
  rectangle: '▢',
  ellipse: '○',
  line: '/',
  arrow: '→',
  polygon: '⬡',
  star: '★',
  vector: '✏️',
  text: 'T',
  frame: '⬜',
  group: '📁',
  component: '🔷',
  instance: '🔶'
};

export function LayersPanel() {
  const { shapes, selectedIds, selectShape } = useCanvasStore();

  const handleVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Toggle visibility
  };

  const handleLock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Toggle lock
  };

  const handleSelect = (id: string) => {
    selectShape(id);
  };

  const handleBringToFront = () => {
    if (selectedIds.length > 0) {
      fullCanvasEngine.bringToFront();
    }
  };

  const handleSendToBack = () => {
    if (selectedIds.length > 0) {
      fullCanvasEngine.sendToBack();
    }
  };

  const handleGroup = () => {
    fullCanvasEngine.group();
  };

  const handleUngroup = () => {
    fullCanvasEngine.ungroup();
  };

  const handleDelete = () => {
    fullCanvasEngine.deleteSelected();
  };

  return (
    <div className="layers-panel">
      <div className="panel-header">
        <h3>Layers</h3>
        <div className="layer-actions">
          <button onClick={handleBringToFront} title="Bring to Front">↑</button>
          <button onClick={handleSendToBack} title="Send to Back">↓</button>
          <button onClick={handleGroup} title="Group (Ctrl+G)">⊡</button>
          <button onClick={handleUngroup} title="Ungroup">⊢</button>
          <button onClick={handleDelete} className="delete-btn" title="Delete (Del)">×</button>
        </div>
      </div>
      
      <div className="layers-list">
        {[...shapes].reverse().map((shape) => (
          <LayerItem
            key={shape.id}
            shape={shape}
            isSelected={selectedIds.includes(shape.id)}
            onSelect={handleSelect}
            onVisibility={handleVisibility}
            onLock={handleLock}
          />
        ))}
      </div>
      
      {shapes.length === 0 && (
        <div className="layers-empty">
          No layers yet.<br />Draw something!
        </div>
      )}
    </div>
  );
}

function LayerItem({
  shape,
  isSelected,
  onSelect,
  onVisibility,
  onLock
}: {
  shape: Shape;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onVisibility: (id: string, e: React.MouseEvent) => void;
  onLock: (id: string, e: React.MouseEvent) => void;
}) {
  const icon = typeIcons[shape.type] || '?';

  return (
    <div
      className={`layer-item ${isSelected ? 'selected' : ''} ${!shape.visible ? 'hidden' : ''} ${shape.locked ? 'locked' : ''}`}
      onClick={() => onSelect(shape.id)}
    >
      <span className="layer-icon">{icon}</span>
      <span className="layer-name">{shape.name}</span>
      <div className="layer-controls">
        <button
          className={`visibility-btn ${!shape.visible ? 'off' : ''}`}
          onClick={(e) => onVisibility(shape.id, e)}
          title={shape.visible ? 'Hide' : 'Show'}
        >
          {shape.visible ? '👁' : '👁‍🗨'}
        </button>
        <button
          className={`lock-btn ${shape.locked ? 'on' : ''}`}
          onClick={(e) => onLock(shape.id, e)}
          title={shape.locked ? 'Unlock' : 'Lock'}
        >
          {shape.locked ? '🔒' : '🔓'}
        </button>
      </div>
    </div>
  );
}
