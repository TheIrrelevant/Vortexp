# FIGMA TOOLLARI - DETAYLI ALGORİTMA ve MİMARİ ANALİZİ

## 1. VARIABLE SİSTEMİ MİMARİSİ

### 1.1 Variable Türleri ve Veri Yapısı

```typescript
// Figma Variable Veri Modeli
interface Variable {
  id: string;
  name: string;
  type: 'COLOR' | 'NUMBER' | 'STRING' | 'BOOLEAN';
  values: {
    [modeId: string]: VariableValue;
  };
  resolvedType: 'COLOR' | 'NUMBER' | 'STRING' | 'BOOLEAN';
  description?: string;
  hiddenFromPublishing: boolean;
}

interface VariableCollection {
  id: string;
  name: string;
  modes: VariableMode[];
  variableIds: string[];
  defaultModeId: string;
}

interface VariableMode {
  modeId: string;
  name: string;
}

type VariableValue = 
  | { r: number; g: number; b: number; a: number }  // COLOR (RGB 0-1)
  | number                                          // NUMBER
  | string                                          // STRING  
  | boolean                                         // BOOLEAN
  | { type: 'VARIABLE_ALIAS'; id: string };         // Alias/Reference
```

### 1.2 Variable Koleksiyon Yapısı

```
Variable Collection ("Brand Colors")
├── Mode: "Light" (modeId: "m1")
│   ├── primary: #3B82F6
│   ├── secondary: #8B5CF6
│   └── background: #FFFFFF
├── Mode: "Dark" (modeId: "m2")
│   ├── primary: #60A5FA
│   ├── secondary: #A78BFA
│   └── background: #1F2937
└── Mode: "High Contrast" (modeId: "m3")
    ├── primary: #1D4ED8
    ├── secondary: #7C3AED
    └── background: #000000
```

### 1.3 Variable Ekleme Algoritması

```typescript
// 1. Koleksiyon Oluşturma
function createVariableCollection(name: string): VariableCollection {
  const collection: VariableCollection = {
    id: generateUUID(),
    name: name,
    modes: [
      { modeId: generateUUID(), name: 'Default' }
    ],
    variableIds: [],
    defaultModeId: ''
  };
  collection.defaultModeId = collection.modes[0].modeId;
  return collection;
}

// 2. Variable Oluşturma
function createVariable(
  collection: VariableCollection,
  name: string,
  type: VariableType,
  initialValue: VariableValue
): Variable {
  const variable: Variable = {
    id: generateUUID(),
    name: name,
    type: type,
    values: {},
    resolvedType: type,
    hiddenFromPublishing: false
  };
  
  // Tüm modlar için değer ata
  collection.modes.forEach(mode => {
    variable.values[mode.modeId] = initialValue;
  });
  
  collection.variableIds.push(variable.id);
  return variable;
}

// 3. Variable Uygulama (Binding)
function applyVariableToNode(
  node: SceneNode,
  property: string,  // "fills", "strokes", "width", "height", "opacity"
  variable: Variable,
  modeId: string
): void {
  // Mevcut değeri sakla
  const currentValue = getNodeProperty(node, property);
  
  // Variable binding oluştur
  const binding: VariableBinding = {
    variableId: variable.id,
    property: property,
    modeId: modeId
  };
  
  // Node'a binding'i kaydet
  node.variableBindings = node.variableBindings || [];
  node.variableBindings.push(binding);
  
  // Değeri uygula
  const value = variable.values[modeId];
  setNodeProperty(node, property, value);
  
  // Proxy/Observer ekle (değişiklikleri takip için)
  observeVariableChanges(variable, node, property);
}

// 4. Mode Değiştirme Algoritması
function switchMode(
  frame: FrameNode,
  modeId: string,
  collectionId: string
): void {
  // Frame ve tüm child'ları tara
  const allNodes = getAllNodesInHierarchy(frame);
  
  allNodes.forEach(node => {
    if (node.variableBindings) {
      node.variableBindings.forEach(binding => {
        if (binding.modeCollectionId === collectionId) {
          // Yeni mode'un değerini al
          const variable = getVariable(binding.variableId);
          const newValue = variable.values[modeId];
          
          // Property'yi güncelle
          setNodeProperty(node, binding.property, newValue);
        }
      });
    }
  });
  
  // Re-render tetikle
  triggerRender(frame);
}

// 5. Variable Export (Design Tokens)
function exportToDesignTokens(
  collection: VariableCollection
): DesignTokens {
  const tokens: DesignTokens = {
    [collection.name]: {}
  };
  
  collection.variableIds.forEach(varId => {
    const variable = getVariable(varId);
    const tokenPath = variable.name.split('/');
    
    // Nested obje oluştur (e.g., "color/primary/500")
    let current = tokens[collection.name];
    tokenPath.forEach((part, index) => {
      if (index === tokenPath.length - 1) {
        current[part] = {
          $type: mapVariableTypeToTokenType(variable.type),
          $value: formatValueForTokens(variable.values[collection.defaultModeId])
        };
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    });
  });
  
  return tokens;
}
```

### 1.4 Variable Scope ve Kapsam

```typescript
// Scope Tanımları
enum VariableScope {
  ALL_FILLS = 'ALL_FILLS',           // Tüm fill'lerde kullanılabilir
  FRAME_FILL = 'FRAME_FILL',         // Sadece frame'lerin fill'i
  SHAPE_FILL = 'SHAPE_FILL',         // Shape'lerin fill'i
  TEXT_FILL = 'TEXT_FILL',           // Text fill'i
  STROKE_COLOR = 'STROKE_COLOR',     // Stroke rengi
  OPACITY = 'OPACITY',               // Opacity/alfa
  WIDTH = 'WIDTH',                   // Genişlik
  HEIGHT = 'HEIGHT',                 // Yükseklik
  GAP = 'GAP',                       // Auto layout gap
  PADDING = 'PADDING',               // Padding değerleri
  CORNER_RADIUS = 'CORNER_RADIUS',   // Köşe yuvarlaklığı
  FONT_SIZE = 'FONT_SIZE',           // Font boyutu
  LINE_HEIGHT = 'LINE_HEIGHT',       // Satır yüksekliği
  LETTER_SPACING = 'LETTER_SPACING', // Harf aralığı
  FONT_FAMILY = 'FONT_FAMILY',       // Font ailesi
  FONT_WEIGHT = 'FONT_WEIGHT',       // Font kalınlığı
  TEXT_CONTENT = 'TEXT_CONTENT',     // Metin içeriği
  VISIBILITY = 'VISIBILITY'          // Görünürlük (boolean)
}

// Scope Atama
function setVariableScopes(
  variable: Variable,
  scopes: VariableScope[]
): void {
  variable.scopes = scopes;
  
  // UI'da scope'a göre filtrele
  // Örneğin color variable sadece fill/stroke dropdown'larında göster
}
```

### 1.5 Variable Prototyping ile Kullanım

```typescript
// Prototype Interaction'da Variable Kullanımı
interface PrototypeAction {
  type: 'SET_VARIABLE' | 'CONDITIONAL' | 'EXPRESSION';
  variableId?: string;
  value?: VariableValue;
  expression?: string;  // "{{count}} + 1"
}

// Örnek: Counter Increment
const incrementAction: PrototypeAction = {
  type: 'EXPRESSION',
  variableId: 'counter-var-id',
  expression: '{{counter}} + 1'
};

// Örnek: Conditional Logic
const conditionalAction: PrototypeAction = {
  type: 'CONDITIONAL',
  condition: '{{count}} > 10',
  then: { type: 'SET_VARIABLE', variableId: 'show-warning', value: true },
  else: { type: 'SET_VARIABLE', variableId: 'show-warning', value: false }
};
```

---

## 2. PEN TOOL ve VECTOR NETWORKS ALGORİTMASI

### 2.1 Vector Networks Veri Yapısı

```typescript
// Vector Network Temel Yapı
interface VectorNetwork {
  vertices: Vertex[];
  segments: Segment[];
  regions: Region[];
}

interface Vertex {
  id: string;
  x: number;
  y: number;
  // Bezier control point'leri (varsa)
  controlPoints?: {
    in?: { x: number; y: number };   // Gelen control point
    out?: { x: number; y: number };  // Giden control point
  };
  // Bağlantı tipi
  type: 'STRAIGHT' | 'MIRRORED' | 'ASYMMETRIC' | 'DISCONNECTED';
}

interface Segment {
  id: string;
  start: string;      // Start vertex ID
  end: string;        // End vertex ID
  // Bezier curve parametreleri
  controlPoints?: {
    start?: { x: number; y: number };
    end?: { x: number; y: number };
  };
}

interface Region {
  id: string;
  windingRule: 'NONZERO' | 'EVENODD';
  loops: Loop[];      // Kapalı path'ler
}

interface Loop {
  vertices: string[]; // Vertex ID'ler sırasıyla
}
```

### 2.2 Pen Tool İnteraksiyon Algoritması

```typescript
class PenTool {
  private network: VectorNetwork;
  private activeVertex: Vertex | null = null;
  private isDrawing: boolean = false;

  // 1. Nokta Ekleme
  onClick(point: Point): void {
    const newVertex: Vertex = {
      id: generateUUID(),
      x: point.x,
      y: point.y,
      type: 'STRAIGHT'
    };
    
    this.network.vertices.push(newVertex);
    
    if (this.activeVertex) {
      // Önceki noktaya bağlantı oluştur
      const segment: Segment = {
        id: generateUUID(),
        start: this.activeVertex.id,
        end: newVertex.id
      };
      this.network.segments.push(segment);
    }
    
    this.activeVertex = newVertex;
    this.isDrawing = true;
    
    // Path'i render et
    this.renderNetwork();
  }

  // 2. Bezier Eğrisi Oluşturma (Click + Drag)
  onDrag(start: Point, current: Point): void {
    if (!this.activeVertex) return;
    
    // Control point hesapla
    const controlPoint = this.calculateControlPoint(start, current);
    
    // Vertex'e control point ekle
    this.activeVertex.controlPoints = {
      out: controlPoint
    };
    
    // Eğriyi render et (gerçek zamanlı)
    this.renderNetwork();
  }

  // 3. Bezier Eğrisi Formülü (Cubic Bezier)
  calculateBezierPoint(
    t: number,
    p0: Point,
    p1: Point,
    p2: Point,
    p3: Point
  ): Point {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    
    return {
      x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
      y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
    };
  }

  // 4. Path Render Algoritması
  renderNetwork(): void {
    const paths: Path2D[] = [];
    
    // Her bölgeyi (region) render et
    this.network.regions.forEach(region => {
      const path = new Path2D();
      
      region.loops.forEach(loop => {
        const vertices = loop.vertices.map(id => 
          this.network.vertices.find(v => v.id === id)!
        );
        
        // Path'i başlat
        path.moveTo(vertices[0].x, vertices[0].y);
        
        // Segment'leri çiz
        for (let i = 0; i < vertices.length - 1; i++) {
          const current = vertices[i];
          const next = vertices[i + 1];
          
          // Segment'i bul
          const segment = this.findSegment(current.id, next.id);
          
          if (segment?.controlPoints) {
            // Bezier curve çiz
            path.bezierCurveTo(
              segment.controlPoints.start!.x,
              segment.controlPoints.start!.y,
              segment.controlPoints.end!.x,
              segment.controlPoints.end!.y,
              next.x,
              next.y
            );
          } else {
            // Düz çizgi çiz
            path.lineTo(next.x, next.y);
          }
        }
        
        // Path'i kapat
        path.closePath();
      });
      
      paths.push(path);
    });
    
    // Canvas'a çiz
    this.drawToCanvas(paths);
  }

  // 5. Nokta Silme
  deleteVertex(vertexId: string): void {
    // Vertex'i kaldır
    this.network.vertices = this.network.vertices.filter(v => v.id !== vertexId);
    
    // İlişkili segment'leri kaldır
    this.network.segments = this.network.segments.filter(
      s => s.start !== vertexId && s.end !== vertexId
    );
    
    // Region'ları güncelle
    this.updateRegions();
    
    this.renderNetwork();
  }

  // 6. Vector Network ➔ SVG Path Data
  toSVGPath(): string {
    return this.network.regions.map(region => {
      return region.loops.map(loop => {
        const vertices = loop.vertices.map(id => 
          this.network.vertices.find(v => v.id === id)!
        );
        
        let d = `M ${vertices[0].x} ${vertices[0].y}`;
        
        for (let i = 0; i < vertices.length - 1; i++) {
          const segment = this.findSegment(vertices[i].id, vertices[i + 1].id);
          
          if (segment?.controlPoints) {
            const cp1 = segment.controlPoints.start!;
            const cp2 = segment.controlPoints.end!;
            d += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${vertices[i + 1].x} ${vertices[i + 1].y}`;
          } else {
            d += ` L ${vertices[i + 1].x} ${vertices[i + 1].y}`;
          }
        }
        
        return d + ' Z';
      }).join(' ');
    }).join(' ');
  }
}
```

### 2.3 Bezier Curve Editing Algoritmaları

```typescript
// Control Point Tipi Değiştirme
enum ControlPointType {
  STRAIGHT,      // Düz nokta (control point yok)
  MIRRORED,      // Simetrik (gelen ve giden aynı uzaklık ve açı)
  ASYMMETRIC,    // Asimetrik (gelen ve giden aynı açı ama farklı uzaklık)
  DISCONNECTED   // Bağımsız (gelen ve giden tamamen bağımsız)
}

function updateControlPointType(
  vertex: Vertex,
  type: ControlPointType,
  incomingAngle?: number,
  outgoingAngle?: number
): void {
  vertex.type = type;
  
  switch (type) {
    case ControlPointType.STRAIGHT:
      vertex.controlPoints = undefined;
      break;
      
    case ControlPointType.MIRRORED:
      // Simetri koru: incoming = -outgoing
      if (vertex.controlPoints?.in) {
        const angle = Math.atan2(
          vertex.controlPoints.in.y - vertex.y,
          vertex.controlPoints.in.x - vertex.x
        );
        const distance = Math.sqrt(
          Math.pow(vertex.controlPoints.in.x - vertex.x, 2) +
          Math.pow(vertex.controlPoints.in.y - vertex.y, 2)
        );
        vertex.controlPoints.out = {
          x: vertex.x + Math.cos(angle + Math.PI) * distance,
          y: vertex.y + Math.sin(angle + Math.PI) * distance
        };
      }
      break;
      
    case ControlPointType.ASYMMETRIC:
      // Açıyı koru, uzaklığı serbest bırak
      // ...
      break;
  }
}

// Nokta Ekleme (Path Üzerinde)
function addPointOnPath(
  network: VectorNetwork,
  segmentId: string,
  t: number  // 0-1 arası pozisyon
): Vertex {
  const segment = network.segments.find(s => s.id === segmentId)!;
  const start = network.vertices.find(v => v.id === segment.start)!;
  const end = network.vertices.find(v => v.id === segment.end)!;
  
  // Bezier üzerinde nokta hesapla
  const newPoint = calculateBezierPoint(t, start, start.controlPoints?.out!, end.controlPoints?.in!, end);
  
  // Yeni vertex oluştur
  const newVertex: Vertex = {
    id: generateUUID(),
    x: newPoint.x,
    y: newPoint.y,
    controlPoints: {
      in: calculateControlPointAtT(t, true),
      out: calculateControlPointAtT(t, false)
    }
  };
  
  // Segment'i ikiye böl
  const segment1: Segment = {
    id: generateUUID(),
    start: segment.start,
    end: newVertex.id,
    controlPoints: { start: segment.controlPoints?.start }
  };
  
  const segment2: Segment = {
    id: generateUUID(),
    start: newVertex.id,
    end: segment.end,
    controlPoints: { end: segment.controlPoints?.end }
  };
  
  // Eski segment'i değiştir
  const index = network.segments.indexOf(segment);
  network.segments.splice(index, 1, segment1, segment2);
  
  return newVertex;
}
```

---

## 3. BOOLEAN OPERATIONS ALGORİTMASI

### 3.1 Boolean İşlemleri Temel Algoritma

```typescript
// Boolean Operasyon Tipleri
enum BooleanOperation {
  UNION = 'UNION',           // Birleştirme (A ∪ B)
  SUBTRACT = 'SUBTRACT',     // Çıkarma (A - B)
  INTERSECT = 'INTERSECT',   // Kesişim (A ∩ B)
  EXCLUDE = 'EXCLUDE'        // XOR (A ⊕ B)
}

// Boolean Operation Algoritması
function performBooleanOperation(
  shapeA: PathData,
  shapeB: PathData,
  operation: BooleanOperation
): PathData {
  // 1. Path'leri segment'lere ayır
  const segmentsA = breakIntoSegments(shapeA);
  const segmentsB = breakIntoSegments(shapeB);
  
  // 2. Kesişim noktalarını bul
  const intersections = findIntersections(segmentsA, segmentsB);
  
  // 3. Segment'leri kesişim noktalarında böl
  const splitSegmentsA = splitAtIntersections(segmentsA, intersections);
  const splitSegmentsB = splitAtIntersections(segmentsB, intersections);
  
  // 4. Hangi segment'lerin tutulacağını belirle
  const resultSegments: Segment[] = [];
  
  switch (operation) {
    case BooleanOperation.UNION:
      // Dışarıda kalan tüm segment'leri al
      resultSegments.push(
        ...splitSegmentsA.filter(s => !isInside(s, shapeB)),
        ...splitSegmentsB.filter(s => !isInside(s, shapeA))
      );
      break;
      
    case BooleanOperation.SUBTRACT:
      // A'nın B dışında kalan kısmı
      resultSegments.push(
        ...splitSegmentsA.filter(s => !isInside(s, shapeB))
      );
      resultSegments.push(
        ...splitSegmentsB.filter(s => isInside(s, shapeA))
      );
      break;
      
    case BooleanOperation.INTERSECT:
      // Her ikisinin içinde olan segment'ler
      resultSegments.push(
        ...splitSegmentsA.filter(s => isInside(s, shapeB)),
        ...splitSegmentsB.filter(s => isInside(s, shapeA))
      );
      break;
      
    case BooleanOperation.EXCLUDE:
      // Sadece birinin içinde olan segment'ler
      resultSegments.push(
        ...splitSegmentsA.filter(s => !isInside(s, shapeB)),
        ...splitSegmentsB.filter(s => !isInside(s, shapeA))
      );
      break;
  }
  
  // 5. Segment'leri path'e birleştir
  return combineSegmentsToPath(resultSegments);
}

// Kesişim Noktası Bulma (Line Segment Intersection)
function findIntersection(
  seg1: LineSegment,
  seg2: LineSegment
): Point | null {
  const { x1, y1, x2, y2 } = seg1;
  const { x3, y3, x4, y4 } = seg2;
  
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  
  if (denom === 0) return null; // Paralel
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
  
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    };
  }
  
  return null;
}

// Nokta İçinde/Polygon İçinde Testi (Ray Casting)
function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}
```

---

## 4. AUTO LAYOUT (FLEXBOX) ALGORİTMASI

### 4.1 Auto Layout Veri Modeli

```typescript
interface AutoLayoutConfig {
  // Direction
  layoutMode: 'VERTICAL' | 'HORIZONTAL';
  
  // Sizing
  primaryAxisSizingMode: 'FIXED' | 'AUTO';      // Ana eksen (width/height)
  counterAxisSizingMode: 'FIXED' | 'AUTO';      // Karşıt eksen
  
  // Alignment
  primaryAxisAlignItems: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH';
  
  // Spacing
  itemSpacing: number;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
  
  // Advanced
  layoutWrap: 'NO_WRAP' | 'WRAP';
}

interface AutoLayoutChild {
  node: SceneNode;
  layoutAlign: 'INHERIT' | 'STRETCH';
  layoutGrow: number;  // 0 veya 1 (flex-grow)
  layoutShrink: number;  // 0 veya 1
}
```

### 4.2 Auto Layout Hesaplama Algoritması

```typescript
function calculateAutoLayout(
  container: FrameNode,
  config: AutoLayoutConfig,
  children: AutoLayoutChild[]
): LayoutResult {
  const isVertical = config.layoutMode === 'VERTICAL';
  
  // 1. Çocukların boyutlarını hesapla
  const childSizes = children.map(child => ({
    width: child.node.width,
    height: child.node.height,
    minWidth: child.node.minWidth,
    minHeight: child.node.minHeight,
    maxWidth: child.node.maxWidth,
    maxHeight: child.node.maxHeight
  }));
  
  // 2. Container boyutunu belirle
  let containerWidth: number;
  let containerHeight: number;
  
  if (config.primaryAxisSizingMode === 'AUTO') {
    // AUTO: Çocukların toplam boyutu + spacing + padding
    if (isVertical) {
      containerHeight = children.reduce((sum, _, i) => {
        return sum + childSizes[i].height + (i > 0 ? config.itemSpacing : 0);
      }, config.paddingTop + config.paddingBottom);
    } else {
      containerWidth = children.reduce((sum, _, i) => {
        return sum + childSizes[i].width + (i > 0 ? config.itemSpacing : 0);
      }, config.paddingLeft + config.paddingRight);
    }
  } else {
    // FIXED: Belirtilen boyut
    containerWidth = container.width;
    containerHeight = container.height;
  }
  
  // 3. Karşıt eksen boyutunu belirle
  if (config.counterAxisSizingMode === 'AUTO') {
    if (isVertical) {
      containerWidth = Math.max(...childSizes.map(s => s.width)) 
        + config.paddingLeft + config.paddingRight;
    } else {
      containerHeight = Math.max(...childSizes.map(s => s.height))
        + config.paddingTop + config.paddingBottom;
    }
  }
  
  // 4. Çocuk pozisyonlarını hesapla
  const positions: Point[] = [];
  let currentPos = isVertical ? config.paddingTop : config.paddingLeft;
  
  // Toplam grow değeri
  const totalGrow = children.reduce((sum, c) => sum + c.layoutGrow, 0);
  const availableSpace = isVertical 
    ? containerHeight - config.paddingTop - config.paddingBottom
    : containerWidth - config.paddingLeft - config.paddingRight;
  const usedSpace = children.reduce((sum, _, i) => {
    return sum + (isVertical ? childSizes[i].height : childSizes[i].width)
      + (i > 0 ? config.itemSpacing : 0);
  }, 0);
  const extraSpace = availableSpace - usedSpace;
  
  children.forEach((child, index) => {
    const size = childSizes[index];
    
    // Ana eksen pozisyonu
    let mainPos = currentPos;
    if (child.layoutGrow > 0 && totalGrow > 0) {
      // Flex grow uygula
      const growAmount = (child.layoutGrow / totalGrow) * extraSpace;
      if (isVertical) {
        size.height += growAmount;
      } else {
        size.width += growAmount;
      }
    }
    
    // Karşıt eksen hizalama
    let counterPos: number;
    const counterSize = isVertical ? size.width : size.height;
    const counterMax = isVertical 
      ? containerWidth - config.paddingLeft - config.paddingRight
      : containerHeight - config.paddingTop - config.paddingBottom;
    
    switch (config.counterAxisAlignItems) {
      case 'MIN':
        counterPos = isVertical ? config.paddingLeft : config.paddingTop;
        break;
      case 'CENTER':
        counterPos = ((isVertical ? config.paddingLeft : config.paddingTop) + 
          (isVertical ? containerWidth - config.paddingRight : containerHeight - config.paddingBottom) - counterSize) / 2;
        break;
      case 'MAX':
        counterPos = (isVertical ? containerWidth - config.paddingRight : containerHeight - config.paddingBottom) - counterSize;
        break;
      case 'STRETCH':
        counterPos = isVertical ? config.paddingLeft : config.paddingTop;
        if (isVertical) {
          size.width = counterMax;
        } else {
          size.height = counterMax;
        }
        break;
    }
    
    positions.push({
      x: isVertical ? counterPos : mainPos,
      y: isVertical ? mainPos : counterPos
    });
    
    currentPos += (isVertical ? size.height : size.width) + config.itemSpacing;
  });
  
  return {
    containerWidth,
    containerHeight,
    childPositions: positions,
    childSizes
  };
}

// CSS Flexbox Mapping
function autoLayoutToCSS(config: AutoLayoutConfig): CSSProperties {
  return {
    display: 'flex',
    flexDirection: config.layoutMode === 'VERTICAL' ? 'column' : 'row',
    justifyContent: mapAlignmentToJustifyContent(config.primaryAxisAlignItems),
    alignItems: mapAlignmentToAlignItems(config.counterAxisAlignItems),
    gap: `${config.itemSpacing}px`,
    padding: `${config.paddingTop}px ${config.paddingRight}px ${config.paddingBottom}px ${config.paddingLeft}px`,
    flexWrap: config.layoutWrap === 'WRAP' ? 'wrap' : 'nowrap'
  };
}
```

---

## 5. COMPONENT ve INSTANCE SİSTEMİ

### 5.1 Component Master-Instance Mimari

```typescript
// Component Master
interface ComponentMaster {
  id: string;
  name: string;
  type: 'COMPONENT' | 'COMPONENT_SET';  // COMPONENT_SET = Variants
  children: SceneNode[];
  variantProperties?: {
    [propertyName: string]: string[];  // Örn: { "State": ["Default", "Hover", "Active"] }
  };
}

// Component Instance
interface ComponentInstance {
  id: string;
  componentId: string;      // Master component referansı
  name: string;
  
  // Override'lar
  overrides: {
    [nodeId: string]: {      // Override edilen node'ın ID'si
      property: string;      // "fills", "text", "visibility"
      value: any;
    }
  };
  
  // Variant properties (eğer variant ise)
  variantProperties?: {
    [propertyName: string]: string;
  };
}

// Instance Oluşturma
function createInstance(master: ComponentMaster): ComponentInstance {
  const instance: ComponentInstance = {
    id: generateUUID(),
    componentId: master.id,
    name: master.name,
    overrides: {},
    variantProperties: master.variantProperties ? {} : undefined
  };
  
  // Master'dan kopya oluştur (deep clone)
  const clonedChildren = deepCloneNodes(master.children);
  
  // Instance'a bağla (referansı koru)
  clonedChildren.forEach(child => {
    child.masterComponent = master.id;
    child.instanceId = instance.id;
  });
  
  return instance;
}

// Master Güncelleme ➔ Instance'ları Güncelle
function updateMasterComponent(master: ComponentMaster): void {
  // Tüm instance'ları bul
  const instances = findAllInstances(master.id);
  
  instances.forEach(instance => {
    // Override edilmemiş property'leri güncelle
    const updatedChildren = deepCloneNodes(master.children);
    
    updatedChildren.forEach((child, index) => {
      const oldChild = instance.children[index];
      
      // Override kontrolü
      const overrideKey = `${instance.id}/${child.id}`;
      if (!instance.overrides[overrideKey]) {
        // Override yok, master'dan gelen değeri kullan
        Object.assign(oldChild, child);
      }
    });
    
    // Re-render
    triggerRender(instance);
  });
}

// Property Override
function overrideInstanceProperty(
  instance: ComponentInstance,
  nodeId: string,
  property: string,
  value: any
): void {
  const overrideKey = `${instance.id}/${nodeId}`;
  instance.overrides[overrideKey] = { property, value };
  
  // Node'u güncelle
  const node = findNodeInInstance(instance, nodeId);
  if (node) {
    setNodeProperty(node, property, value);
  }
  
  // Master'dan bağımsız olduğunu işaretle (visual indicator)
  node.isOverridden = true;
}

// Reset Override
function resetOverride(
  instance: ComponentInstance,
  nodeId: string,
  property: string
): void {
  const overrideKey = `${instance.id}/${nodeId}`;
  delete instance.overrides[overrideKey];
  
  // Master'dan değeri geri al
  const master = getMasterComponent(instance.componentId);
  const masterNode = findNodeInMaster(master, nodeId);
  const value = getNodeProperty(masterNode, property);
  
  const node = findNodeInInstance(instance, nodeId);
  setNodeProperty(node, property, value);
  node.isOverridden = false;
}
```

---

## 6. RENDER ve OPTİMİZASYON SİSTEMİ

### 6.1 Rendering Pipeline

```typescript
// Figma Rendering Pipeline
class RenderingEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: OffscreenCanvas;
  
  // 1. Scene Graph İşleme
  processSceneGraph(root: SceneNode): RenderNode[] {
    const renderList: RenderNode[] = [];
    
    function traverse(node: SceneNode, parentTransform: Matrix) {
      // Transform matrisini hesapla
      const transform = multiplyMatrices(parentTransform, getNodeTransform(node));
      
      // Render node oluştur
      const renderNode: RenderNode = {
        id: node.id,
        type: node.type,
        bounds: calculateBounds(node, transform),
        transform,
        style: extractStyle(node),
        children: []
      };
      
      // Çocukları işle
      if (node.children) {
        node.children.forEach(child => {
          renderNode.children.push(traverse(child, transform));
        });
      }
      
      renderList.push(renderNode);
      return renderNode;
    }
    
    traverse(root, identityMatrix());
    return renderList;
  }
  
  // 2. Culling (Görünmeyenleri ele)
  cullInvisibleNodes(nodes: RenderNode[], viewport: Rect): RenderNode[] {
    return nodes.filter(node => {
      // Viewport ile kesişiyor mu?
      return rectsIntersect(node.bounds, viewport);
    });
  }
  
  // 3. Z-Sıralaması
  sortByZIndex(nodes: RenderNode[]): RenderNode[] {
    return nodes.sort((a, b) => a.zIndex - b.zIndex);
  }
  
  // 4. Render
  render(nodes: RenderNode[]): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    nodes.forEach(node => {
      this.ctx.save();
      
      // Transform uygula
      this.ctx.setTransform(
        node.transform.a, node.transform.b,
        node.transform.c, node.transform.d,
        node.transform.tx, node.transform.ty
      );
      
      // Node tipine göre çiz
      switch (node.type) {
        case 'RECTANGLE':
          this.renderRectangle(node);
          break;
        case 'ELLIPSE':
          this.renderEllipse(node);
          break;
        case 'VECTOR':
          this.renderVector(node);
          break;
        case 'TEXT':
          this.renderText(node);
          break;
      }
      
      this.ctx.restore();
    });
  }
  
  // 5. Rectangle Render
  private renderRectangle(node: RenderNode): void {
    const { width, height, topLeftRadius, topRightRadius, bottomRightRadius, bottomLeftRadius } = node.style;
    
    this.ctx.beginPath();
    
    // Yuvarlatılmış köşeler
    if (topLeftRadius || topRightRadius || bottomRightRadius || bottomLeftRadius) {
      roundRect(this.ctx, 0, 0, width, height, {
        topLeft: topLeftRadius,
        topRight: topRightRadius,
        bottomRight: bottomRightRadius,
        bottomLeft: bottomLeftRadius
      });
    } else {
      this.ctx.rect(0, 0, width, height);
    }
    
    // Fill uygula
    if (node.style.fills) {
      node.style.fills.forEach(fill => {
        this.ctx.fillStyle = this.resolveFill(fill);
        this.ctx.fill();
      });
    }
    
    // Stroke uygula
    if (node.style.strokes) {
      node.style.strokes.forEach(stroke => {
        this.ctx.strokeStyle = this.resolveFill(stroke);
        this.ctx.lineWidth = node.style.strokeWeight;
        this.ctx.stroke();
      });
    }
    
    // Effects
    if (node.style.effects) {
      this.applyEffects(node.style.effects);
    }
  }
}
```

### 6.2 Optimizasyon Teknikleri

```typescript
// 1. Spatial Hashing (Hızlı collision detection)
class SpatialHash {
  private cellSize: number;
  private grid: Map<string, SceneNode[]>;
  
  insert(node: SceneNode): void {
    const cells = this.getCellsForNode(node);
    cells.forEach(cell => {
      if (!this.grid.has(cell)) {
        this.grid.set(cell, []);
      }
      this.grid.get(cell)!.push(node);
    });
  }
  
  query(bounds: Rect): SceneNode[] {
    const cells = this.getCellsForBounds(bounds);
    const results = new Set<SceneNode>();
    
    cells.forEach(cell => {
      const nodes = this.grid.get(cell) || [];
      nodes.forEach(node => results.add(node));
    });
    
    return Array.from(results);
  }
}

// 2. Dirty Region Tracking
class DirtyRegionManager {
  private dirtyRegions: Rect[] = [];
  
  markDirty(region: Rect): void {
    this.dirtyRegions.push(region);
  }
  
  getDirtyRect(): Rect | null {
    if (this.dirtyRegions.length === 0) return null;
    
    // Tüm dirty region'ları birleştir
    return this.dirtyRegions.reduce((acc, rect) => ({
      x: Math.min(acc.x, rect.x),
      y: Math.min(acc.y, rect.y),
      width: Math.max(acc.x + acc.width, rect.x + rect.width) - Math.min(acc.x, rect.x),
      height: Math.max(acc.y + acc.height, rect.y + rect.height) - Math.min(acc.y, rect.y)
    }));
  }
  
  clear(): void {
    this.dirtyRegions = [];
  }
}

// 3. Virtualization (Büyük canvas'lar için)
class VirtualCanvas {
  private visibleNodes: Map<string, RenderNode> = new Map();
  private nodePool: RenderNode[] = [];
  
  updateVisibleNodes(viewport: Rect, allNodes: SceneNode[]): void {
    // Viewport içinde olan node'ları bul
    const visible = allNodes.filter(node => 
      rectsIntersect(node.bounds, viewport)
    );
    
    // Yeni görünen node'ları ekle
    visible.forEach(node => {
      if (!this.visibleNodes.has(node.id)) {
        const renderNode = this.getFromPool() || this.createRenderNode();
        this.visibleNodes.set(node.id, renderNode);
      }
    });
    
    // Görünmeyen node'ları havuza geri koy
    this.visibleNodes.forEach((renderNode, id) => {
      if (!visible.find(n => n.id === id)) {
        this.returnToPool(renderNode);
        this.visibleNodes.delete(id);
      }
    });
  }
}
```

---

## 7. ÇOKLU KULLANICI (MULTIPLAYER) SENKRONİZASYONU

### 7.1 Operational Transform Algoritması

```typescript
// Operational Transform (OT) - Çakışan edit'leri çözümleme
interface Operation {
  type: 'INSERT' | 'DELETE' | 'UPDATE';
  nodeId: string;
  property: string;
  value: any;
  timestamp: number;
  userId: string;
}

class OperationalTransform {
  private history: Operation[] = [];
  private pending: Operation[] = [];
  
  // İki operasyonu transform et (çakışmayı çöz)
  transform(op1: Operation, op2: Operation): [Operation, Operation] {
    // Aynı node, aynı property güncelleniyor mu?
    if (op1.nodeId === op2.nodeId && op1.property === op2.property) {
      // Timestamp'a göre kazanan belirle (Last-Write-Wins)
      if (op1.timestamp > op2.timestamp) {
        return [op1, null as any]; // op2 discard
      } else {
        return [null as any, op2]; // op1 discard
      }
    }
    
    // Farklı property'ler ➔ her ikisi de uygulanabilir
    return [op1, op2];
  }
  
  // Operasyonu uygula ve history'ye ekle
  apply(operation: Operation): void {
    // Pending operasyonlarla çakışma kontrolü
    this.pending.forEach((pendingOp, index) => {
      const [transformedOp, transformedPending] = this.transform(operation, pendingOp);
      
      if (!transformedPending) {
        // Çakışma çözüldü, pending'i kaldır
        this.pending.splice(index, 1);
      } else {
        this.pending[index] = transformedPending;
      }
      
      operation = transformedOp;
    });
    
    if (operation) {
      // Node'u güncelle
      const node = getNode(operation.nodeId);
      setNodeProperty(node, operation.property, operation.value);
      
      // History'ye ekle
      this.history.push(operation);
    }
  }
  
  // Remote operasyon al
  receiveRemote(operation: Operation): void {
    // Kendi pending operasyonlarımla transform et
    let transformedOp = operation;
    
    for (let i = 0; i < this.pending.length; i++) {
      const [t1, t2] = this.transform(transformedOp, this.pending[i]);
      transformedOp = t1;
      if (t2) this.pending[i] = t2;
    }
    
    if (transformedOp) {
      this.apply(transformedOp);
    }
  }
}

// WebSocket Senkronizasyonu
class MultiplayerSync {
  private ws: WebSocket;
  private ot: OperationalTransform;
  
  connect(fileId: string): void {
    this.ws = new WebSocket(`wss://api.figma.com/v1/files/${fileId}/sync`);
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'OPERATION':
          this.ot.receiveRemote(message.operation);
          break;
        case 'USER_JOINED':
          this.showUserCursor(message.userId, message.color);
          break;
        case 'CURSOR_MOVE':
          this.updateUserCursor(message.userId, message.position);
          break;
      }
    };
  }
  
  sendOperation(operation: Operation): void {
    this.ot.apply(operation);
    this.ws.send(JSON.stringify({
      type: 'OPERATION',
      operation
    }));
  }
}
```

---

## 8. SONUÇ ve VORTEXP İÇİN ÖNERİLER

### 8.1 Implementasyon Önceliği Matrisi

| Özellik | Zorluk | Etki | Öncelik |
|---------|--------|------|---------|
| **Variable Sistemi** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **P1** |
| **Vector Networks** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | P2 |
| **Boolean Operations** | ⭐⭐⭐⭐ | ⭐⭐⭐ | P3 |
| **Auto Layout** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **P1** |
| **Component System** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **P1** |
| **Multiplayer** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | P4 |

### 8.2 Vortexp Gelişim Yol Haritası

```
Faz 1: Temel Vektör (Şu anki durum)
├── Rectangle, Circle, Line, Pen
├── Fill & Stroke
└── SVG Export

Faz 2: Gelişmiş Vektör (1-2 ay)
├── Vector Networks
├── Boolean Operations (Union, Subtract, Intersect, Exclude)
├── Advanced Pen Tool (Bezier editing)
└── Layers Panel

Faz 3: Layout & Components (2-3 ay)
├── Auto Layout (Flexbox-like)
├── Component Master-Instance
├── Variants
└── Constraints

Faz 4: Design Tokens (3-4 ay)
├── Variable System
├── Design Token Export
├── Mode Management (Light/Dark themes)
└── Plugin API

Faz 5: Collaboration (4-6 ay)
├── Multiplayer Sync
├── Comments
├── Version History
└── Real-time cursors
```

### 8.3 Başlangıç İçin Teknik Öneriler

1. **State Management**: Redux veya Zustand kullan
2. **Canvas Rendering**: HTML5 Canvas API + Fabric.js veya Pixi.js
3. **Vector Engine**: SVG-based başla, sonra Canvas'a geç
4. **Undo/Redo**: Command pattern + state snapshot'lar
5. **Export**: SVG (native), PNG/JPG (html2canvas veya canvas.toDataURL)

---

**Rapor Tarihi:** 18 Şubat 2026
**Analiz Eden:** Claude (OpenCode)
**Kaynaklar:** Figma API Docs, Alex Harri's Vector Networks Article, Figma Engineering Blog
