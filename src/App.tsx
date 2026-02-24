import { useEffect, useRef, useState } from 'react';
import { canvasEngine } from './canvas/CanvasEngine';
import { useCanvasStore } from './store/canvasStore';
import { Toolbar } from './components/Toolbar';
import { LayersPanel } from './components/LayersPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { BooleanPanel } from './components/BooleanPanel';
import { AutoLayoutPanel } from './components/AutoLayoutPanel';
import { VariablesPanel } from './components/VariablesPanel';
import './App.css';

function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasInitialized, setCanvasInitialized] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'properties' | 'boolean' | 'autolayout' | 'variables'>('properties');
  
  const { zoom, tool, shapes, selectedIds } = useCanvasStore();

  useEffect(() => {
    if (canvasRef.current && !canvasInitialized) {
      canvasEngine.initialize('canvas-container');
      setCanvasInitialized(true);
    }

    return () => {
      canvasEngine.destroy();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case 'v': useCanvasStore.getState().setTool('select'); break;
        case 'h': useCanvasStore.getState().setTool('hand'); break;
        case 'r': useCanvasStore.getState().setTool('rectangle'); break;
        case 'o': useCanvasStore.getState().setTool('ellipse'); break;
        case 'l': useCanvasStore.getState().setTool('line'); break;
        case 'a': useCanvasStore.getState().setTool('arrow'); break;
        case 'p': useCanvasStore.getState().setTool('pen'); break;
        case 't': useCanvasStore.getState().setTool('text'); break;
        case 'enter':
          canvasEngine.closePenPath();
          break;
        case 'escape':
          canvasEngine.finishPenPath();
          break;
        case 'delete':
        case 'backspace':
          canvasEngine.deleteSelected();
          break;
        case 'g':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) {
              canvasEngine.ungroup();
            } else {
              canvasEngine.group();
            }
          }
          break;
        case '=':
        case '+':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            canvasEngine.zoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            canvasEngine.zoomOut();
          }
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            canvasEngine.resetZoom();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <h1>Vortexp</h1>
          <span>Vector Canvas</span>
        </div>
        <div className="header-center">
          <span className="tool-indicator">Tool: {tool}</span>
          <span className="zoom-indicator">{Math.round(zoom * 100)}%</span>
        </div>
        <div className="header-actions">
          <button onClick={() => canvasEngine.zoomIn()} className="btn-icon" title="Zoom In">+</button>
          <button onClick={() => canvasEngine.zoomOut()} className="btn-icon" title="Zoom Out">−</button>
          <button onClick={() => canvasEngine.resetZoom()} className="btn-icon" title="Reset Zoom">⟲</button>
        </div>
      </header>

      <div className="main">
        <aside className="left-sidebar">
          <Toolbar />
          <LayersPanel />
        </aside>

        <main className="canvas-area">
          <div id="canvas-container" ref={canvasRef} className="canvas-container" />
          
          <div className="info-bar">
            <span>Shapes: {shapes.length}</span>
            <span>Selected: {selectedIds.length}</span>
            <span>Shortcuts: V R O L A P T | Ctrl+G Group | Del Delete</span>
          </div>
        </main>

        <aside className="right-sidebar">
          <div className="panel-tabs">
            <button 
              className={rightPanelTab === 'properties' ? 'active' : ''} 
              onClick={() => setRightPanelTab('properties')}
            >
              Props
            </button>
            <button 
              className={rightPanelTab === 'boolean' ? 'active' : ''} 
              onClick={() => setRightPanelTab('boolean')}
            >
              Bool
            </button>
            <button 
              className={rightPanelTab === 'autolayout' ? 'active' : ''} 
              onClick={() => setRightPanelTab('autolayout')}
            >
              Layout
            </button>
            <button 
              className={rightPanelTab === 'variables' ? 'active' : ''} 
              onClick={() => setRightPanelTab('variables')}
            >
              Vars
            </button>
          </div>
          
          <div className="panel-content">
            {rightPanelTab === 'properties' && <PropertiesPanel />}
            {rightPanelTab === 'boolean' && <BooleanPanel />}
            {rightPanelTab === 'autolayout' && <AutoLayoutPanel />}
            {rightPanelTab === 'variables' && <VariablesPanel />}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
