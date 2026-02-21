// src/components/AutoLayoutPanel.tsx

import { useCanvasStore, type AutoLayoutConfig } from '../store/fullCanvasStore';

export function AutoLayoutPanel() {
  const { shapes, selectedIds, setAutoLayout, updateShape } = useCanvasStore();
  
  const selectedShape = selectedIds.length === 1 
    ? shapes.find(s => s.id === selectedIds[0])
    : null;

  const config = selectedShape?.autoLayout || {
    enabled: false,
    direction: 'vertical' as const,
    primaryAxisAlign: 'min' as const,
    counterAxisAlign: 'min' as const,
    gap: 10,
    padding: { top: 10, right: 10, bottom: 10, left: 10 },
    wrap: false
  };

  const handleToggle = () => {
    if (!selectedShape) return;
    
    const newConfig: AutoLayoutConfig = {
      ...config,
      enabled: !config.enabled
    };
    
    setAutoLayout(selectedShape.id, newConfig);
  };

  const handleChange = (key: keyof AutoLayoutConfig, value: any) => {
    if (!selectedShape) return;
    
    const newConfig: AutoLayoutConfig = {
      ...config,
      [key]: value
    };
    
    setAutoLayout(selectedShape.id, newConfig);
  };

  const handlePaddingChange = (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    if (!selectedShape) return;
    
    const newConfig: AutoLayoutConfig = {
      ...config,
      padding: { ...config.padding, [side]: value }
    };
    
    setAutoLayout(selectedShape.id, newConfig);
  };

  if (!selectedShape || selectedShape.type !== 'frame') {
    return (
      <div className="autolayout-panel">
        <h3>Auto Layout</h3>
        <p className="hint">Select a frame to enable Auto Layout</p>
      </div>
    );
  }

  return (
    <div className="autolayout-panel">
      <div className="panel-header-row">
        <h3>Auto Layout</h3>
        <button 
          className={`toggle-btn ${config.enabled ? 'on' : ''}`}
          onClick={handleToggle}
        >
          {config.enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {config.enabled && (
        <>
          <div className="property-group">
            <label>Direction</label>
            <div className="direction-btns">
              <button 
                className={config.direction === 'horizontal' ? 'active' : ''}
                onClick={() => handleChange('direction', 'horizontal')}
              >
                ↔ Horizontal
              </button>
              <button 
                className={config.direction === 'vertical' ? 'active' : ''}
                onClick={() => handleChange('direction', 'vertical')}
              >
                ↕ Vertical
              </button>
            </div>
          </div>

          <div className="property-group">
            <label>Primary Axis</label>
            <select 
              value={config.primaryAxisAlign}
              onChange={(e) => handleChange('primaryAxisAlign', e.target.value)}
            >
              <option value="min">Start</option>
              <option value="center">Center</option>
              <option value="max">End</option>
              <option value="space-between">Space Between</option>
            </select>
          </div>

          <div className="property-group">
            <label>Counter Axis</label>
            <select 
              value={config.counterAxisAlign}
              onChange={(e) => handleChange('counterAxisAlign', e.target.value)}
            >
              <option value="min">Start</option>
              <option value="center">Center</option>
              <option value="max">End</option>
              <option value="stretch">Stretch</option>
            </select>
          </div>

          <div className="property-group">
            <label>Gap</label>
            <input
              type="number"
              min="0"
              value={config.gap}
              onChange={(e) => handleChange('gap', Number(e.target.value))}
            />
            <span>px</span>
          </div>

          <div className="property-group">
            <label>Padding</label>
            <div className="padding-grid">
              <input
                type="number"
                min="0"
                value={config.padding.top}
                onChange={(e) => handlePaddingChange('top', Number(e.target.value))}
                placeholder="T"
              />
              <div className="padding-row">
                <input
                  type="number"
                  min="0"
                  value={config.padding.left}
                  onChange={(e) => handlePaddingChange('left', Number(e.target.value))}
                  placeholder="L"
                />
                <span className="padding-center">PAD</span>
                <input
                  type="number"
                  min="0"
                  value={config.padding.right}
                  onChange={(e) => handlePaddingChange('right', Number(e.target.value))}
                  placeholder="R"
                />
              </div>
              <input
                type="number"
                min="0"
                value={config.padding.bottom}
                onChange={(e) => handlePaddingChange('bottom', Number(e.target.value))}
                placeholder="B"
              />
            </div>
          </div>

          <div className="property-group">
            <label>
              <input
                type="checkbox"
                checked={config.wrap}
                onChange={(e) => handleChange('wrap', e.target.checked)}
              />
              Wrap
            </label>
          </div>
        </>
      )}
    </div>
  );
}
