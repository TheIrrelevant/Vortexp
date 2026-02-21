// src/components/VariablesPanel.tsx

import { useState } from 'react';
import { useCanvasStore } from '../store/fullCanvasStore';
import type { VariableCollection } from '../store/fullCanvasStore';

export function VariablesPanel() {
  const { 
    variableCollections, 
    variables, 
    createVariable, 
    setVariableValue, 
    switchMode 
  } = useCanvasStore();
  
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newVarName, setNewVarName] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [newModeName, setNewModeName] = useState('');

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;
    
    const collection: VariableCollection = {
      id: Date.now().toString(),
      name: newCollectionName,
      modes: [{ id: 'default', name: 'Default' }],
      activeModeId: 'default',
      variables: []
    };
    
    // Would need to add to store
    setNewCollectionName('');
  };

  const handleCreateVariable = (collectionId: string, type: 'color' | 'number' | 'string') => {
    if (!newVarName.trim()) return;
    
    const defaultValues: Record<string, any> = {
      color: '#000000',
      number: 0,
      string: ''
    };
    
    createVariable(collectionId, newVarName, type, defaultValues[type]);
    setNewVarName('');
  };

  const handleAddMode = (collectionId: string) => {
    if (!newModeName.trim()) return;
    // Would need to add mode to collection
    setNewModeName('');
  };

  return (
    <div className="variables-panel">
      <h3>Variables</h3>
      
      {/* Create Collection */}
      <div className="create-collection">
        <input
          type="text"
          value={newCollectionName}
          onChange={(e) => setNewCollectionName(e.target.value)}
          placeholder="New collection name"
        />
        <button onClick={handleCreateCollection}>+</button>
      </div>

      {/* Collections */}
      {variableCollections.map(collection => (
        <div key={collection.id} className="collection">
          <div 
            className="collection-header"
            onClick={() => setSelectedCollection(
              selectedCollection === collection.id ? null : collection.id
            )}
          >
            <span className="collection-icon">📁</span>
            <span className="collection-name">{collection.name}</span>
            <span className="collection-count">{collection.variables.length}</span>
          </div>
          
          {selectedCollection === collection.id && (
            <div className="collection-content">
              {/* Modes */}
              <div className="modes">
                <label>Modes</label>
                <div className="mode-list">
                  {collection.modes.map(mode => (
                    <button
                      key={mode.id}
                      className={`mode-btn ${collection.activeModeId === mode.id ? 'active' : ''}`}
                      onClick={() => switchMode(collection.id, mode.id)}
                    >
                      {mode.name}
                    </button>
                  ))}
                </div>
                <div className="add-mode">
                  <input
                    type="text"
                    value={newModeName}
                    onChange={(e) => setNewModeName(e.target.value)}
                    placeholder="New mode"
                  />
                  <button onClick={() => handleAddMode(collection.id)}>+</button>
                </div>
              </div>
              
              {/* Variables */}
              <div className="variables-list">
                {collection.variables.map(varId => {
                  const variable = variables[varId];
                  if (!variable) return null;
                  
                  return (
                    <div key={varId} className="variable-item">
                      <span className="var-type">{variable.type}</span>
                      <span className="var-name">{variable.name}</span>
                      {variable.type === 'color' && (
                        <input
                          type="color"
                          value={variable.values[collection.activeModeId] || '#000'}
                          onChange={(e) => setVariableValue(varId, collection.activeModeId, e.target.value)}
                        />
                      )}
                      {variable.type === 'number' && (
                        <input
                          type="number"
                          value={variable.values[collection.activeModeId] || 0}
                          onChange={(e) => setVariableValue(varId, collection.activeModeId, Number(e.target.value))}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Add Variable */}
              <div className="add-variable">
                <input
                  type="text"
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  placeholder="New variable"
                />
                <button onClick={() => handleCreateVariable(collection.id, 'color')}>🎨</button>
                <button onClick={() => handleCreateVariable(collection.id, 'number')}>#️⃣</button>
                <button onClick={() => handleCreateVariable(collection.id, 'string')}>Aa</button>
              </div>
            </div>
          )}
        </div>
      ))}
      
      {variableCollections.length === 0 && (
        <p className="hint">Create a collection to manage design tokens</p>
      )}
    </div>
  );
}
