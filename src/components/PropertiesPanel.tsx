// src/components/PropertiesPanel.tsx

import { useCanvasStore } from '../store/canvasStore';
import { canvasEngine } from '../canvas/CanvasEngine';

export function PropertiesPanel() {
  const { shapes, selectedIds, toolConfig, updateToolConfig, updateShape } = useCanvasStore();
  
  const selectedShape = selectedIds.length === 1 
    ? shapes.find(s => s.id === selectedIds[0])
    : null;

  const handlePropertyChange = (property: string, value: any) => {
    if (selectedShape) {
      updateShape(selectedShape.id, { [property]: value });
    }
  };

  const handleClear = () => {
    canvasEngine.clear();
  };

  const handleExportSVG = () => {
    const svg = canvasEngine.exportSVG();
    downloadFile(svg, 'vortexp-drawing.svg', 'image/svg+xml');
  };

  const handleExportPNG = () => {
    const png = canvasEngine.exportPNG();
    downloadFile(png, 'vortexp-drawing.png', 'image/png');
  };

  return (
    <div className="properties-panel">
      {/* Style Properties */}
      <div className="panel-section">
        <h3>Style</h3>
        
        <div className="property-group">
          <label>Fill</label>
          <div className="color-input">
            <input
              type="color"
              value={selectedShape?.fill || toolConfig.fill}
              onChange={(e) => {
                const value = e.target.value;
                if (selectedShape) {
                  handlePropertyChange('fill', value);
                }
                updateToolConfig({ fill: value });
              }}
            />
            <span>{selectedShape?.fill || toolConfig.fill}</span>
          </div>
        </div>

        <div className="property-group">
          <label>Stroke</label>
          <div className="color-input">
            <input
              type="color"
              value={selectedShape?.stroke || toolConfig.stroke}
              onChange={(e) => {
                const value = e.target.value;
                if (selectedShape) {
                  handlePropertyChange('stroke', value);
                }
                updateToolConfig({ stroke: value });
              }}
            />
            <span>{selectedShape?.stroke || toolConfig.stroke}</span>
          </div>
        </div>

        <div className="property-group">
          <label>Stroke Width</label>
          <div className="range-input">
            <input
              type="range"
              min="1"
              max="20"
              value={selectedShape?.strokeWidth || toolConfig.strokeWidth}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (selectedShape) {
                  handlePropertyChange('strokeWidth', value);
                }
                updateToolConfig({ strokeWidth: value });
              }}
            />
            <span>{selectedShape?.strokeWidth || toolConfig.strokeWidth}px</span>
          </div>
        </div>

        <div className="property-group">
          <label>Opacity</label>
          <div className="range-input">
            <input
              type="range"
              min="0"
              max="100"
              value={(selectedShape?.opacity ?? toolConfig.opacity) * 100}
              onChange={(e) => {
                const value = Number(e.target.value) / 100;
                if (selectedShape) {
                  handlePropertyChange('opacity', value);
                }
                updateToolConfig({ opacity: value });
              }}
            />
            <span>{Math.round((selectedShape?.opacity ?? toolConfig.opacity) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Transform */}
      {selectedShape && (
        <div className="panel-section">
          <h3>Transform</h3>
          
          <div className="property-row">
            <div className="property-group half">
              <label>X</label>
              <input
                type="number"
                value={Math.round(selectedShape.x)}
                onChange={(e) => handlePropertyChange('x', Number(e.target.value))}
              />
            </div>
            <div className="property-group half">
              <label>Y</label>
              <input
                type="number"
                value={Math.round(selectedShape.y)}
                onChange={(e) => handlePropertyChange('y', Number(e.target.value))}
              />
            </div>
          </div>

          {selectedShape.width !== undefined && (
            <div className="property-row">
              <div className="property-group half">
                <label>W</label>
                <input
                  type="number"
                  value={Math.round(selectedShape.width || 0)}
                  onChange={(e) => handlePropertyChange('width', Number(e.target.value))}
                />
              </div>
              <div className="property-group half">
                <label>H</label>
                <input
                  type="number"
                  value={Math.round(selectedShape.height || 0)}
                  onChange={(e) => handlePropertyChange('height', Number(e.target.value))}
                />
              </div>
            </div>
          )}

          <div className="property-group">
            <label>Rotation</label>
            <div className="range-input">
              <input
                type="range"
                min="0"
                max="360"
                value={selectedShape.rotation || 0}
                onChange={(e) => handlePropertyChange('rotation', Number(e.target.value))}
              />
              <span>{selectedShape.rotation || 0}°</span>
            </div>
          </div>
        </div>
      )}

      {/* Corner Radius for Rectangle */}
      {selectedShape?.type === 'rectangle' && (
        <div className="panel-section">
          <h3>Corner Radius</h3>
          <div className="property-group">
            <input
              type="range"
              min="0"
              max="100"
              value={selectedShape.rx || 0}
              onChange={(e) => handlePropertyChange('rx', Number(e.target.value))}
            />
            <span>{selectedShape.rx || 0}px</span>
          </div>
        </div>
      )}

      {/* Polygon/Star Properties */}
      {selectedShape?.type === 'polygon' && selectedShape.sides && (
        <div className="panel-section">
          <h3>Polygon</h3>
          <div className="property-group">
            <label>Sides</label>
            <input
              type="number"
              min="3"
              max="60"
              value={selectedShape.sides}
              onChange={(e) => handlePropertyChange('sides', Number(e.target.value))}
            />
          </div>
        </div>
      )}

      {selectedShape?.type === 'star' && selectedShape.points && (
        <div className="panel-section">
          <h3>Star</h3>
          <div className="property-group">
            <label>Points</label>
            <input
              type="number"
              min="3"
              max="60"
              value={selectedShape.points}
              onChange={(e) => handlePropertyChange('points', Number(e.target.value))}
            />
          </div>
          <div className="property-group">
            <label>Inner Radius %</label>
            <input
              type="range"
              min="10"
              max="90"
              value={(selectedShape.innerRadius || 0.4) * 100}
              onChange={(e) => handlePropertyChange('innerRadius', Number(e.target.value) / 100)}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="panel-section">
        <h3>Actions</h3>
        <div className="action-buttons">
          <button onClick={handleExportSVG} className="action-btn">Export SVG</button>
          <button onClick={handleExportPNG} className="action-btn">Export PNG</button>
          <button onClick={handleClear} className="action-btn danger">Clear All</button>
        </div>
      </div>
    </div>
  );
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
