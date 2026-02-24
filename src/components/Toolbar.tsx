// src/components/Toolbar.tsx

import { useCanvasStore, type ToolType } from '../store/canvasStore';

const tools: { id: ToolType; label: string; icon: string; shortcut: string }[] = [
  { id: 'select', label: 'Select', icon: '↖', shortcut: 'V' },
  { id: 'hand', label: 'Hand', icon: '✋', shortcut: 'H' },
  { id: 'rectangle', label: 'Rectangle', icon: '▢', shortcut: 'R' },
  { id: 'ellipse', label: 'Ellipse', icon: '○', shortcut: 'O' },
  { id: 'line', label: 'Line', icon: '/', shortcut: 'L' },
  { id: 'arrow', label: 'Arrow', icon: '→', shortcut: 'A' },
  { id: 'polygon', label: 'Polygon', icon: '⬡', shortcut: 'P' },
  { id: 'star', label: 'Star', icon: '★', shortcut: 'S' },
  { id: 'pen', label: 'Pen', icon: '✎', shortcut: 'P' },
  { id: 'text', label: 'Text', icon: 'T', shortcut: 'T' }
];

export function Toolbar() {
  const { tool, setTool } = useCanvasStore();

  return (
    <div className="toolbar">
      <div className="tool-section">
        <h3>Tools</h3>
        <div className="tools-grid">
          {tools.map((t) => (
            <button
              key={t.id}
              className={`tool-btn ${tool === t.id ? 'active' : ''}`}
              onClick={() => setTool(t.id)}
              title={`${t.label} (${t.shortcut})`}
            >
              <span className="tool-icon">{t.icon}</span>
              <span className="tool-label">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
