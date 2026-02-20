# VORTEXP - FIGMA BENZERİ SİSTEM TEKNİK GEREKSİNİMLERİ

## 🎯 SİSTEM ÖZETİ

**AI Yok, Geri Kalan Her Şey Var:**
- ✅ Vector Networks (Pen Tool)
- ✅ Boolean Operations (Union, Subtract, Intersect, Exclude)
- ✅ Auto Layout (Flexbox-like)
- ✅ Component Master-Instance System
- ✅ Variables & Design Tokens
- ✅ Multiplayer Collaboration
- ✅ Advanced Shape Tools
- ✅ Prototyping
- ✅ Plugin API

---

## 📋 TEKNİK STACK GEREKSİNİMLERİ

### 1. Frontend Framework

| Bileşen | Teknoloji | Neden? |
|---------|-----------|---------|
| **Framework** | React 19 | Component-based, performant |
| **State Management** | Zustand + Immer | Lightweight, TypeScript-first |
| **Canvas Rendering** | Fabric.js + HTML5 Canvas | Vector manipulation, event handling |
| **Vector Engine** | Paper.js | Advanced path operations |
| **Math Library** | Victor.js | 2D vector math |
| **Undo/Redo** | Zundo (Zustand plugin) | Time-travel state |

### 2. Backend & Real-time

| Bileşen | Teknoloji | Neden? |
|---------|-----------|---------|
| **Backend** | Node.js + Express | JavaScript ecosystem |
| **Real-time** | Socket.io | WebSocket fallback support |
| **Database** | PostgreSQL + Redis | Relational + Caching |
| **File Storage** | AWS S3 / MinIO | Asset storage |
| **CDN** | CloudFlare / AWS CloudFront | Static asset delivery |

### 3. Vector & Graphics Libraries

```typescript
// Gerekli npm packages
{
  "dependencies": {
    "fabric": "^5.3.0",           // Canvas rendering & manipulation
    "paper": "^0.12.17",          // Vector path operations
    "victor": "^1.1.0",           // 2D vector math
    "bezier-js": "^6.1.4",        // Bezier curve calculations
    "clipper-lib": "^6.4.2",      // Boolean operations (Clipper)
    "poly-decomp": "^0.3.0",      // Polygon decomposition
    "simplify-js": "^1.2.4",      // Path simplification
    "rbush": "^3.0.1",            // Spatial indexing (R-tree)
    "zustand": "^4.5.0",          // State management
    "immer": "^10.0.0",           // Immutable state updates
    "uuid": "^9.0.0",             // ID generation
    "lodash": "^4.17.21",         // Utilities
    "nanoid": "^5.0.0"            // Short unique IDs
  }
}
```

---

## 🏗️ MİMARİ YAPISI

### 1. Katmanlı Mimari (Layered Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Toolbar    │  │   Canvas     │  │   Panels     │      │
│  │   (React)    │  │   (Fabric)   │  │   (React)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Tool Manager│  │  Canvas     │  │  Command     │      │
│  │              │  │  Controller │  │  Pattern     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Vector      │  │  Component  │  │  Variable    │      │
│  │  Networks    │  │  System     │  │  System      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Boolean     │  │  Auto       │  │  Export      │      │
│  │  Operations  │  │  Layout     │  │  Engine      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  WebSocket   │  │  Database   │  │  File        │      │
│  │  Manager     │  │  Repository │  │  Storage     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 2. Veri Modelleri (Domain Models)

```typescript
// ==================== CORE TYPES ====================

// Unique identifier
 type UUID = string;

// 2D Point
interface Point {
  x: number;
  y: number;
}

// Transform matrix
interface Transform {
  a: number;  // scaleX
  b: number;  // skewY
  c: number;  // skewX
  d: number;  // scaleY
  tx: number; // translateX
  ty: number; // translateY
}

// ==================== VECTOR NETWORKS ====================

interface VectorNetwork {
  id: UUID;
  vertices: Vertex[];
  segments: Segment[];
  regions: Region[];
}

interface Vertex {
  id: UUID;
  x: number;
  y: number;
  controlPoints?: {
    in?: Point;
    out?: Point;
  };
  type: 'STRAIGHT' | 'MIRRORED' | 'ASYMMETRIC' | 'DISCONNECTED';
}

interface Segment {
  id: UUID;
  start: UUID;  // Vertex ID
  end: UUID;    // Vertex ID
  controlPoints?: {
    start?: Point;
    end?: Point;
  };
}

interface Region {
  id: UUID;
  windingRule: 'NONZERO' | 'EVENODD';
  loops: Loop[];
}

interface Loop {
  vertices: UUID[];  // Vertex IDs in order
}

// ==================== SHAPES ====================

interface BaseNode {
  id: UUID;
  name: string;
  type: NodeType;
  parent?: UUID;
  children?: UUID[];
  transform: Transform;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  
  // Styling
  fills: Fill[];
  strokes: Stroke[];
  effects: Effect[];
  
  // Layout
  width: number;
  height: number;
  x: number;
  y: number;
  rotation: number;
  
  // Constraints
  constraints: Constraints;
}

type NodeType = 
  | 'RECTANGLE' 
  | 'ELLIPSE' 
  | 'POLYGON' 
  | 'STAR'
  | 'VECTOR' 
  | 'TEXT' 
  | 'FRAME' 
  | 'GROUP'
  | 'COMPONENT'
  | 'INSTANCE'
  | 'BOOLEAN_OPERATION';

interface RectangleNode extends BaseNode {
  type: 'RECTANGLE';
  topLeftRadius: number;
  topRightRadius: number;
  bottomLeftRadius: number;
  bottomRightRadius: number;
}

interface EllipseNode extends BaseNode {
  type: 'ELLIPSE';
  arcData?: {
    startingAngle: number;
    endingAngle: number;
    innerRadius: number;
  };
}

interface PolygonNode extends BaseNode {
  type: 'POLYGON';
  pointCount: number;
  starInnerRatio?: number;  // For star
}

interface VectorNode extends BaseNode {
  type: 'VECTOR';
  vectorNetwork: VectorNetwork;
}

interface TextNode extends BaseNode {
  type: 'TEXT';
  characters: string;
  fontName: FontName;
  fontSize: number;
  fontWeight: number;
  letterSpacing: number;
  lineHeight: LineHeight;
  textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textAlignVertical: 'TOP' | 'CENTER' | 'BOTTOM';
  textCase: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE';
  textDecoration: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
}

// ==================== COMPONENTS ====================

interface ComponentMaster {
  id: UUID;
  name: string;
  type: 'COMPONENT' | 'COMPONENT_SET';
  children: UUID[];
  variantProperties?: {
    [propertyName: string]: string[];
  };
  documentationLinks?: DocumentationLink[];
}

interface ComponentInstance {
  id: UUID;
  componentId: UUID;
  name: string;
  overrides: {
    [nodeId: string]: PropertyOverride;
  };
  variantProperties?: {
    [propertyName: string]: string;
  };
  masterComponent?: ComponentMaster;
}

interface PropertyOverride {
  property: string;
  value: any;
  isOverridden: boolean;
}

// ==================== BOOLEAN OPERATIONS ====================

interface BooleanOperationNode extends BaseNode {
  type: 'BOOLEAN_OPERATION';
  booleanOperation: 'UNION' | 'SUBTRACT' | 'INTERSECT' | 'EXCLUDE';
  children: UUID[];  // Input shapes
}

// ==================== AUTO LAYOUT ====================

interface AutoLayoutConfig {
  layoutMode: 'VERTICAL' | 'HORIZONTAL';
  primaryAxisSizingMode: 'FIXED' | 'AUTO';
  counterAxisSizingMode: 'FIXED' | 'AUTO';
  primaryAxisAlignItems: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH';
  itemSpacing: number;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
  layoutWrap: 'NO_WRAP' | 'WRAP';
}

interface FrameNode extends BaseNode {
  type: 'FRAME';
  autoLayout?: AutoLayoutConfig;
  clipsContent: boolean;
  layoutGrids?: LayoutGrid[];
}

// ==================== VARIABLES ====================

interface VariableCollection {
  id: UUID;
  name: string;
  modes: VariableMode[];
  variableIds: UUID[];
  defaultModeId: UUID;
  hiddenFromPublishing: boolean;
}

interface VariableMode {
  modeId: UUID;
  name: string;
}

interface Variable {
  id: UUID;
  name: string;
  type: 'COLOR' | 'NUMBER' | 'STRING' | 'BOOLEAN';
  values: {
    [modeId: string]: VariableValue;
  };
  resolvedType: 'COLOR' | 'NUMBER' | 'STRING' | 'BOOLEAN';
  description?: string;
  hiddenFromPublishing: boolean;
  scopes: VariableScope[];
}

type VariableValue = 
  | ColorValue
  | number
  | string
  | boolean
  | VariableAlias;

interface ColorValue {
  r: number;  // 0-1
  g: number;  // 0-1
  b: number;  // 0-1
  a: number;  // 0-1
}

interface VariableAlias {
  type: 'VARIABLE_ALIAS';
  id: UUID;
}

type VariableScope =
  | 'ALL_FILLS'
  | 'FRAME_FILL'
  | 'SHAPE_FILL'
  | 'TEXT_FILL'
  | 'STROKE_COLOR'
  | 'OPACITY'
  | 'WIDTH'
  | 'HEIGHT'
  | 'GAP'
  | 'PADDING'
  | 'CORNER_RADIUS'
  | 'FONT_SIZE'
  | 'LINE_HEIGHT'
  | 'LETTER_SPACING'
  | 'FONT_FAMILY'
  | 'FONT_WEIGHT'
  | 'TEXT_CONTENT'
  | 'VISIBILITY';

// ==================== STYLING ====================

interface Fill {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE';
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
  color?: ColorValue;  // For SOLID
  gradientStops?: ColorStop[];  // For gradients
  imageRef?: UUID;  // For IMAGE
  scaleMode?: 'FILL' | 'FIT' | 'TILE' | 'STRETCH';
}

interface ColorStop {
  position: number;  // 0-1
  color: ColorValue;
}

interface Stroke {
  type: 'SOLID' | 'GRADIENT';
  color: ColorValue;
  opacity: number;
  weight: number;
  cap: 'NONE' | 'ROUND' | 'SQUARE' | 'ARROW_LINES' | 'ARROW_EQUILATERAL';
  join: 'MITER' | 'BEVEL' | 'ROUND';
  miterLimit: number;
  dashPattern: number[];
}

interface Effect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  visible: boolean;
  radius: number;
  color?: ColorValue;
  offset?: { x: number; y: number };
  spread?: number;
}

// ==================== FILE STRUCTURE ====================

interface VortexpFile {
  id: UUID;
  name: string;
  version: string;
  lastModified: string;
  thumbnail?: string;
  
  // Document tree
  document: DocumentNode;
  
  // Collections
  variableCollections: VariableCollection[];
  variables: Variable[];
  
  // Components
  componentMasters: ComponentMaster[];
  
  // Styles
  styles: {
    fills: PaintStyle[];
    texts: TextStyle[];
    effects: EffectStyle[];
    grids: GridStyle[];
  };
}

interface DocumentNode {
  id: UUID;
  type: 'DOCUMENT';
  name: string;
  children: PageNode[];
}

interface PageNode {
  id: UUID;
  type: 'PAGE';
  name: string;
  children: FrameNode[];
  backgrounds: Paint[];
}
```

---

## 🔧 GELİŞTİRME PLANI (6 Aylık)

### AY 1: TEMEL VECTÖR MOTORU

**Hafta 1-2: Canvas Setup**
```typescript
// src/canvas/
├── CanvasEngine.ts          // Fabric.js wrapper
├── EventManager.ts          // Mouse/touch events
├── ZoomPanController.ts     // Viewport control
└── GridRenderer.ts          // Grid & guides
```

**Hafta 3-4: Basic Shapes**
```typescript
// src/shapes/
├── Rectangle.ts
├── Ellipse.ts
├── Line.ts
├── Polygon.ts
└── Star.ts
```

**Dependencies:**
```bash
npm install fabric paper victor bezier-js
npm install @types/fabric --save-dev
```

### AY 2: VECTOR NETWORKS & PEN TOOL

**Hafta 1-2: Vector Network Engine**
```typescript
// src/vector/
├── VectorNetwork.ts         // Data model
├── Vertex.ts
├── Segment.ts
├── Region.ts
├── PenTool.ts              // Tool logic
├── BezierMath.ts           // Curve calculations
└── SVGConverter.ts         // Export to SVG
```

**Hafta 3-4: Bezier Editing**
```typescript
// src/vector/editing/
├── BezierControlPoint.ts
├── PointInsertion.ts       // Add point on path
├── PointDeletion.ts
├── SmoothPoint.ts          // Mirrored control points
└── CornerPoint.ts          // Disconnected control points
```

### AY 3: BOOLEAN OPERATIONS & LAYERS

**Hafta 1-2: Boolean Engine**
```typescript
// src/boolean/
├── BooleanOperation.ts
├── ClipperAdapter.ts       // Clipper.js wrapper
├── IntersectionFinder.ts
├── PathSplitter.ts
└── RegionBuilder.ts
```

**Hafta 3-4: Layers Panel**
```typescript
// src/layers/
├── LayerTree.tsx           // React component
├── LayerItem.tsx
├── DragDropProvider.ts
├── LayerVisibility.ts
└── LayerLocking.ts
```

### AY 4: COMPONENT SİSTEMİ

**Hafta 1-2: Master-Instance**
```typescript
// src/components/
├── ComponentMaster.ts
├── ComponentInstance.ts
├── OverrideManager.ts
├── ComponentSync.ts        // Master update propagation
└── VariantSystem.ts
```

**Hafta 3-4: Component Library**
```typescript
// src/components/library/
├── ComponentLibrary.tsx    // UI Panel
├── ComponentCard.tsx
├── SearchFilter.ts
└── DragDropInsert.ts
```

### AY 5: AUTO LAYOUT & VARIABLES

**Hafta 1-2: Auto Layout Engine**
```typescript
// src/autolayout/
├── AutoLayoutCalculator.ts
├── FlexboxMapper.ts        // Figma → CSS flex
├── LayoutConstraints.ts
├── ResizingLogic.ts
└── WrapCalculator.ts
```

**Hafta 3-4: Variable System**
```typescript
// src/variables/
├── VariableCollection.ts
├── Variable.ts
├── VariableBinding.ts      // Node ↔ Variable link
├── ModeManager.ts          // Light/Dark switch
├── DesignTokenExport.ts    // JSON export
└── VariablePanel.tsx       // UI
```

### AY 6: MULTIPLAYER & EXPORT

**Hafta 1-2: Real-time Collaboration**
```typescript
// src/collaboration/
├── WebSocketManager.ts
├── OperationalTransform.ts
├── CursorTracker.ts        // Multiplayer cursors
├── SelectionSync.ts
└── ConflictResolver.ts
```

**Hafta 3-4: Export Engine**
```typescript
// src/export/
├── SVGExporter.ts
├── PNGExporter.ts          // Canvas to Image
├── PDFExporter.ts
├── DesignTokenExporter.ts  // CSS/JSON/SCSS
└── CodeGenerator.ts        // React/Vue/Angular
```

---

## 💻 KOD ÖRNEKLERİ

### 1. Canvas Initialization

```typescript
// src/canvas/CanvasEngine.ts
import { fabric } from 'fabric';

export class CanvasEngine {
  private canvas: fabric.Canvas;
  private state: CanvasState;
  
  constructor(containerId: string, width: number, height: number) {
    this.canvas = new fabric.Canvas(containerId, {
      width,
      height,
      backgroundColor: '#222121',
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true
    });
    
    this.setupEventListeners();
    this.setupGrid();
  }
  
  private setupEventListeners(): void {
    this.canvas.on('mouse:down', this.handleMouseDown.bind(this));
    this.canvas.on('mouse:move', this.handleMouseMove.bind(this));
    this.canvas.on('mouse:up', this.handleMouseUp.bind(this));
    this.canvas.on('selection:created', this.handleSelection.bind(this));
    this.canvas.on('object:modified', this.handleModification.bind(this));
  }
  
  addShape(shape: fabric.Object): void {
    this.canvas.add(shape);
    this.canvas.renderAll();
  }
  
  exportToSVG(): string {
    return this.canvas.toSVG();
  }
  
  exportToPNG(): string {
    return this.canvas.toDataURL({
      format: 'png',
      quality: 1
    });
  }
}
```

### 2. Boolean Operations Implementation

```typescript
// src/boolean/BooleanOperation.ts
import ClipperLib from 'clipper-lib';

export class BooleanOperationEngine {
  private clipper: ClipperLib.Clipper;
  
  constructor() {
    this.clipper = new ClipperLib.Clipper();
  }
  
  execute(
    subjectPaths: PathData[],
    clipPaths: PathData[],
    operation: 'UNION' | 'SUBTRACT' | 'INTERSECT' | 'EXCLUDE'
  ): PathData[] {
    // Convert to Clipper format
    const subject = this.toClipperPaths(subjectPaths);
    const clip = this.toClipperPaths(clipPaths);
    
    // Set operation type
    let clipType: ClipperLib.ClipType;
    switch (operation) {
      case 'UNION':
        clipType = ClipperLib.ClipType.ctUnion;
        break;
      case 'SUBTRACT':
        clipType = ClipperLib.ClipType.ctDifference;
        break;
      case 'INTERSECT':
        clipType = ClipperLib.ClipType.ctIntersection;
        break;
      case 'EXCLUDE':
        clipType = ClipperLib.ClipType.ctXor;
        break;
    }
    
    // Execute
    const solution: ClipperLib.Paths = [];
    this.clipper.AddPaths(subject, ClipperLib.PolyType.ptSubject, true);
    this.clipper.AddPaths(clip, ClipperLib.PolyType.ptClip, true);
    this.clipper.Execute(clipType, solution);
    
    // Convert back
    return this.fromClipperPaths(solution);
  }
  
  private toClipperPaths(paths: PathData[]): ClipperLib.Paths {
    return paths.map(path => 
      path.map(point => ({
        X: point.x * 1000,  // Scale for precision
        Y: point.y * 1000
      }))
    );
  }
}
```

### 3. Variable System

```typescript
// src/variables/VariableStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface VariableState {
  collections: VariableCollection[];
  variables: Map<UUID, Variable>;
  bindings: Map<UUID, VariableBinding[]>;  // nodeId → bindings
  
  // Actions
  createCollection: (name: string) => VariableCollection;
  createVariable: (collectionId: UUID, name: string, type: VariableType) => Variable;
  applyVariable: (nodeId: UUID, property: string, variableId: UUID) => void;
  switchMode: (collectionId: UUID, modeId: UUID) => void;
  exportTokens: () => DesignTokens;
}

export const useVariableStore = create<VariableState>()(
  immer((set, get) => ({
    collections: [],
    variables: new Map(),
    bindings: new Map(),
    
    createCollection: (name) => {
      const collection: VariableCollection = {
        id: generateUUID(),
        name,
        modes: [{ modeId: generateUUID(), name: 'Default' }],
        variableIds: [],
        defaultModeId: '',
        hiddenFromPublishing: false
      };
      collection.defaultModeId = collection.modes[0].modeId;
      
      set(state => {
        state.collections.push(collection);
      });
      
      return collection;
    },
    
    applyVariable: (nodeId, property, variableId) => {
      const variable = get().variables.get(variableId);
      if (!variable) return;
      
      const binding: VariableBinding = {
        nodeId,
        property,
        variableId,
        modeId: variable.values[get().collections[0].defaultModeId]
      };
      
      set(state => {
        if (!state.bindings.has(nodeId)) {
          state.bindings.set(nodeId, []);
        }
        state.bindings.get(nodeId)!.push(binding);
      });
      
      // Apply value immediately
      const value = variable.values[get().collections[0].defaultModeId];
      applyValueToNode(nodeId, property, value);
    },
    
    switchMode: (collectionId, modeId) => {
      // Update all bindings that use this collection
      set(state => {
        state.bindings.forEach((bindings, nodeId) => {
          bindings.forEach(binding => {
            if (binding.collectionId === collectionId) {
              binding.modeId = modeId;
              const variable = state.variables.get(binding.variableId);
              if (variable) {
                const value = variable.values[modeId];
                applyValueToNode(nodeId, binding.property, value);
              }
            }
          });
        });
      });
    },
    
    exportTokens: () => {
      const tokens: DesignTokens = {};
      
      get().collections.forEach(collection => {
        tokens[collection.name] = {};
        
        collection.variableIds.forEach(varId => {
          const variable = get().variables.get(varId);
          if (!variable) return;
          
          const path = variable.name.split('/');
          let current: any = tokens[collection.name];
          
          path.forEach((part, index) => {
            if (index === path.length - 1) {
              current[part] = {
                $type: mapVariableType(variable.type),
                $value: formatTokenValue(variable.values[collection.defaultModeId])
              };
            } else {
              current[part] = current[part] || {};
              current = current[part];
            }
          });
        });
      });
      
      return tokens;
    }
  }))
);
```

---

## 📦 GEREKLİ PAKETLER (Toplu Kurulum)

```bash
# Core Dependencies
npm install fabric paper victor bezier-js clipper-lib
npm install zustand immer uuid nanoid lodash
npm install socket.io-client

# Development Dependencies
npm install -D @types/fabric @types/uuid @types/lodash

# Optional (Advanced Features)
npm install pdf-lib jspdf html2canvas  # Export
npm install rbush poly-decomp simplify-js  # Math/Geometry
npm install colorjs.io  # Color manipulation
```

---

## 🎯 BAŞLANGIÇ ADIMLARI

### 1. Proje Kurulumu (5 dk)
```bash
cd /Users/yamacozkan/Desktop/Kraftreich/Tools/Vortexp
npm install fabric paper victor bezier-js clipper-lib zustand immer uuid nanoid lodash
```

### 2. Temel Canvas Setup (30 dk)
```typescript
// Implement CanvasEngine.ts
// Test basic shapes
// Verify export works
```

### 3. İlk Tool: Rectangle (1 saat)
```typescript
// Add Rectangle tool
// Implement property panel
// Test CRUD operations
```

### 4. Vector Networks Başlangıcı (1 hafta)
```typescript
// Data models
// Pen tool interactions
// Bezier rendering
```

---

**Hangi aşamadan başlamak istersin?** 🤔
1. Canvas setup + basic shapes (Hemen başla)
2. Vector networks (Pen tool)
3. Boolean operations
4. Component system
5. Auto layout
6. Variables