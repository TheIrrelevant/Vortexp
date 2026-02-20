// src/App.tsx
import { useEffect, useRef, useState } from 'react';
import { canvasEngine } from './canvas/CanvasEngine';
import { useCanvasStore } from './store/canvasStore';
import type { ToolType } from './types/canvas';
import './App.css';

const tools: { id: ToolType; label: string; icon: string }[] = [
  { id: 'select', label: 'Select', icon: '↖' },
  { id: 'rectangle', label: 'Rectangle', icon: '▭' },
  { id: 'ellipse', label: 'Ellipse', icon: '○' },
  { id: 'line', label: 'Line', icon: '/' },
  { id: 'pen', label: 'Pen', icon: '✎' }
];

function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasInitialized, setCanvasInitialized] = useState(false);
  
  const {
    currentTool,
    setCurrentTool,
    selectedId,
    shapes,
    toolConfig,
    updateToolConfig
  } = useCanvasStore();

  useEffect(() => {
    if (canvasRef.current && !canvasInitialized) {
      // Initialize with responsive dimensions
      canvasEngine.initialize('canvas-container');
      setCanvasInitialized(true);
    }

    return () => {
      canvasEngine.destroy();
    };
  }, []);

  const handleExportSVG = () => {
    const svg = canvasEngine.exportToSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vortexp-drawing.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPNG = () => {
    const png = canvasEngine.exportToPNG();
    const link = document.createElement('a');
    link.href = png;
    link.download = 'vortexp-drawing.png';
    link.click();
  };

  const selectedShape = shapes.find((s) => s.id === selectedId);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <h1>Vortexp</h1>
          <span>Vector Canvas</span>
        </div>
        <div className="actions">
          <button onClick={handleExportSVG} className="btn-secondary">
            Export SVG
          </button>
          <button onClick={handleExportPNG} className="btn-secondary">
            Export PNG
          </button>
          <button onClick={() => canvasEngine.clear()} className="btn-danger">
            Clear
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="main">
        {/* Left Toolbar */}
        <aside className="toolbar">
          <div className="tool-section">
            <h3>Tools</h3>
            <div className="tools-grid">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  className={`tool-btn ${currentTool === tool.id ? 'active' : ''}`}
                  onClick={() => setCurrentTool(tool.id)}
                  title={tool.label}
                >
                  <span className="tool-icon">{tool.icon}</span>
                  <span className="tool-label">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="tool-section">
            <h3>Properties</h3>
            
            <div className="property-group">
              <label>Fill Color</label>
              <div className="color-input">
                <input
                  type="color"
                  value={toolConfig.fill}
                  onChange={(e) => updateToolConfig({ fill: e.target.value })}
                />
                <span>{toolConfig.fill}</span>
              </div>
            </div>

            <div className="property-group">
              <label>Stroke Color</label>
              <div className="color-input">
                <input
                  type="color"
                  value={toolConfig.stroke}
                  onChange={(e) => updateToolConfig({ stroke: e.target.value })}
                />
                <span>{toolConfig.stroke}</span>
              </div>
            </div>

            <div className="property-group">
              <label>Stroke Width</label>
              <div className="range-input">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={toolConfig.strokeWidth}
                  onChange={(e) => updateToolConfig({ strokeWidth: Number(e.target.value) })}
                />
                <span>{toolConfig.strokeWidth}px</span>
              </div>
            </div>

            <div className="property-group">
              <label>Opacity</label>
              <div className="range-input">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={toolConfig.opacity * 100}
                  onChange={(e) => updateToolConfig({ opacity: Number(e.target.value) / 100 })}
                />
                <span>{Math.round(toolConfig.opacity * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Selected Shape Properties */}
          {selectedShape && (
            <div className="tool-section">
              <h3>Selected Shape</h3>
              <div className="property-group">
                <label>Type</label>
                <span className="info-value">{selectedShape.type}</span>
              </div>
              <div className="property-group">
                <label>Position</label>
                <span className="info-value">
                  X: {Math.round(selectedShape.x)}, Y: {Math.round(selectedShape.y)}
                </span>
              </div>
              {selectedShape.type === 'rectangle' && (
                <>
                  <div className="property-group">
                    <label>Size</label>
                    <span className="info-value">
                      {Math.round(selectedShape.width)} × {Math.round(selectedShape.height)}
                    </span>
                  </div>
                </>
              )}
              {selectedShape.type === 'ellipse' && (
                <>
                  <div className="property-group">
                    <label>Radius</label>
                    <span className="info-value">
                      RX: {Math.round(selectedShape.rx)}, RY: {Math.round(selectedShape.ry)}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </aside>

        {/* Canvas Area */}
        <main className="canvas-area">
          <div 
            id="canvas-container" 
            ref={canvasRef}
            className="canvas-container"
          />
          
          {/* Info Bar */}
          <div className="info-bar">
            <span>Tool: {currentTool}</span>
            <span>Shapes: {shapes.length}</span>
            <span>Selected: {selectedId ? 'Yes' : 'No'}</span>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
