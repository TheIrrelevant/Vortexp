# Vortexp — Feature Gap Fix Plan

> **Date:** 2026-02-24
> **Status:** Draft
> **Scope:** Features that exist in Vortexp's codebase but do NOT work like Figma

---

## Overview

After comparing Vortexp's current implementation against Figma's feature set, we identified **14 features** that have code present but are broken, incomplete, or disconnected from the UI. This document categorizes each gap, explains what's wrong, and provides a prioritized fix sequence.

---

## Severity Levels

| Level | Meaning |
|-------|---------|
| **CRITICAL** | Engine exists but produces wrong results or is completely disconnected |
| **MEDIUM** | Feature partially works but missing key Figma capabilities |
| **LOW** | Code scaffolding exists but not wired to UI |

---

## CRITICAL — Engine Exists, Does Not Work

### 1. Boolean Operations — Fake Algorithms

**Current State:** `BooleanOperationsEngine.ts` exists with Union, Subtract, Intersect, Exclude. UI panel (`BooleanPanel.tsx`) is present.

**What's Broken:** All four operations use simplified convex hull / point filtering instead of real polygon clipping. Results are geometrically incorrect for any non-trivial shape combination.

```
// Current: convex hull (WRONG)
case 'UNION': return this.unionPolygons(polygons);  // just convex hull

// Needed: proper polygon clipping (Weiler-Atherton or Clipper)
```

**Fix Required:**
- Install `polygon-clipping` npm package (lightweight, TypeScript-friendly)
- Replace all four operation methods with real polygon clipping calls
- Handle curved paths by flattening to polylines first, then clipping

**Affected Files:**
- `src/boolean/BooleanOperationsEngine.ts` — rewrite core algorithms
- `src/components/BooleanPanel.tsx` — may need result rendering updates
- `package.json` — add `polygon-clipping` dependency

**Effort:** Medium (1-2 days)

---

### 2. Vector Path Editing — Stubs Only

**Current State:** PenTool creates vector paths with full Bezier support. `FabricVectorNetwork.ts` has `setEditingMode()`. `CanvasEngine.ts` has `enterEditMode()` / `exitEditMode()` stubs.

**What's Broken:** After drawing a path, you cannot edit it. No double-click to enter edit mode, no vertex dragging, no control point manipulation, no point addition/deletion on segments. This is Figma's most fundamental vector interaction.

**Fix Required:**
- Implement double-click on path object to enter edit mode
- Render vertex handles (squares) and control point handles (circles) as overlay
- Enable drag on vertices to move them
- Enable drag on control point handles to adjust curves
- Alt+click to toggle point type (Mirrored/Asymmetric/Disconnected)
- Click on segment to add new point
- Delete key to remove selected point
- Escape or click outside to exit edit mode

**Affected Files:**
- `src/canvas/CanvasEngine.ts` — implement `enterEditMode()` / `exitEditMode()` fully
- `src/canvas/FabricVectorNetwork.ts` — render edit handles, handle interactions
- `src/tools/PenTool.ts` — may need shared logic extraction
- `src/vector/VectorNetworkEngine.ts` — point manipulation methods (some already exist)

**Effort:** High (3-5 days)

---

### 3. Layer Visibility & Lock — Empty Handlers

**Current State:** `LayersPanel.tsx` renders visibility (eye) and lock icons per layer. Click handlers exist but contain only comments.

**What's Broken:**
```typescript
const handleVisibility = (id: string, e: React.MouseEvent) => {
  e.stopPropagation();
  // Toggle visibility  <-- does nothing
};

const handleLock = (id: string, e: React.MouseEvent) => {
  e.stopPropagation();
  // Toggle lock  <-- does nothing
};
```

**Fix Required:**
- Add `toggleVisibility(id)` and `toggleLock(id)` actions to canvasStore
- In `CanvasEngine.ts`, sync Fabric object `visible` and `selectable`/`evented` properties
- Update LayersPanel handlers to call store actions

**Affected Files:**
- `src/components/LayersPanel.tsx` — wire handlers
- `src/store/canvasStore.ts` — add toggle actions
- `src/canvas/CanvasEngine.ts` — sync Fabric object state

**Effort:** Low (2-3 hours)

---

### 4. Variable-to-Node Binding — No UI

**Current State:** `VariableEngine.ts` has full binding support (`bindVariable`, `unbindVariable`, `applyBindings`). `VariablesPanel.tsx` can create/edit variables and modes.

**What's Broken:** No UI to bind a variable to a canvas object's property. Variables exist in isolation — they cannot be applied to anything.

**Fix Required:**
- Add "Apply Variable" dropdown in PropertiesPanel for fill, stroke, opacity, dimensions
- When a variable is bound, show variable name instead of raw value
- On mode switch, propagate variable values to all bound objects
- Visual indicator (purple dot like Figma) on properties with variable bindings

**Affected Files:**
- `src/components/PropertiesPanel.tsx` — add variable binding dropdowns
- `src/variables/VariableEngine.ts` — already has the logic, needs canvas integration
- `src/canvas/CanvasEngine.ts` — apply variable values to Fabric objects
- `src/store/canvasStore.ts` — track active mode, trigger re-application

**Effort:** Medium (1-2 days)

---

### 5. Component Panel — No UI

**Current State:** `ComponentEngine.ts` is fully implemented: create master, create instance, override system, propagation, detach, property definitions.

**What's Broken:** No panel or menu to access any of this. User cannot create components, instantiate them, view overrides, or detach instances.

**Fix Required:**
- Create `ComponentsPanel.tsx` with:
  - List of component masters
  - "Create Component" button (from selected objects)
  - Drag to instantiate
  - Instance override list with reset buttons
  - Detach button
- Add panel to App.tsx layout
- Wire to ComponentEngine methods via store

**Affected Files:**
- `src/components/ComponentsPanel.tsx` — NEW FILE
- `src/App.tsx` — add panel to layout
- `src/store/canvasStore.ts` — add component actions
- `src/components/ComponentEngine.ts` — already complete, just needs store bridge

**Effort:** Medium (1-2 days)

---

## MEDIUM — Partially Works, Missing Figma Capabilities

### 6. Gradient Fills

**Current State:** PropertiesPanel only supports solid color fills via a color input.

**Missing:** Linear, Radial, Angular, Diamond gradients. Figma supports all four with multi-stop gradient editors.

**Fix Required:**
- Add fill type selector (Solid / Linear / Radial)
- Gradient editor with color stops (position + color)
- Map to Fabric.js `Gradient` object
- Store gradient data in shape state

**Affected Files:**
- `src/components/PropertiesPanel.tsx` — gradient UI
- `src/canvas/CanvasEngine.ts` — apply gradients to Fabric objects
- `src/store/canvasStore.ts` — gradient state in tool config
- `src/types/store.ts` — gradient type definitions

**Effort:** Medium (2-3 days)

---

### 7. Effects (Shadow & Blur)

**Current State:** No shadow or blur support anywhere in the codebase.

**Missing:** Drop Shadow, Inner Shadow, Layer Blur, Background Blur.

**Fix Required:**
- Add effects section to PropertiesPanel
- Map to Fabric.js `shadow` property (supports offset, blur, color)
- Inner shadow requires custom rendering or filter
- Layer/Background blur via Fabric.js filters

**Affected Files:**
- `src/components/PropertiesPanel.tsx` — effects UI
- `src/canvas/CanvasEngine.ts` — apply effects
- `src/types/store.ts` — effect type definitions

**Effort:** Medium (2-3 days)

---

### 8. Advanced Stroke Properties

**Current State:** Only basic stroke color and width.

**Missing:** Cap styles (Round, Square, Arrow), Join styles (Miter, Bevel, Round), Dash patterns, Miter limit.

**Fix Required:**
- Add stroke section expander in PropertiesPanel
- Map to Fabric.js `strokeLineCap`, `strokeLineJoin`, `strokeDashArray`
- Store in shape state

**Affected Files:**
- `src/components/PropertiesPanel.tsx` — stroke controls
- `src/canvas/CanvasEngine.ts` — apply stroke properties
- `src/types/store.ts` — stroke config types

**Effort:** Low (4-6 hours)

---

### 9. Per-Vertex Corner Radius

**Current State:** Single corner radius value for rectangles.

**Missing:** Figma allows independent radius per corner (top-left, top-right, bottom-right, bottom-left).

**Fix Required:**
- Replace single radius input with 4 individual inputs (with link toggle)
- Map to Fabric.js `Rect` properties: `rx`/`ry` per corner (or custom path)
- Note: Fabric.js `Rect` only supports uniform radius — may need custom shape class

**Affected Files:**
- `src/components/PropertiesPanel.tsx` — 4-corner radius UI
- `src/canvas/CanvasEngine.ts` — apply per-corner radius
- Possibly a custom Fabric.js shape class for mixed-radius rectangles

**Effort:** Medium (1-2 days)

---

### 10. Advanced Text Properties

**Current State:** Basic text creation with font family, size, color.

**Missing:** Line height, letter spacing, paragraph spacing, text decoration (underline, strikethrough), text case (upper, lower, title), text alignment beyond basic, auto-width/height modes.

**Fix Required:**
- Expand text section in PropertiesPanel
- Map to Fabric.js `IText` / `Textbox` properties
- Add line height, char spacing, text decoration inputs

**Affected Files:**
- `src/components/PropertiesPanel.tsx` — text controls
- `src/canvas/CanvasEngine.ts` — text property application

**Effort:** Medium (1-2 days)

---

## LOW — Code Scaffolding Exists, Not Connected

### 11. Undo / Redo

**Current State:** No undo/redo system at all.

**Fix Required:**
- Implement Command Pattern with history stack
- Capture state snapshots or operation deltas
- Ctrl+Z / Ctrl+Shift+Z keyboard shortcuts
- Zustand middleware or separate history engine

**Affected Files:**
- `src/store/canvasStore.ts` — history middleware
- `src/canvas/CanvasEngine.ts` — keyboard shortcuts

**Effort:** Medium (2-3 days)

---

### 12. Constraints (Responsive)

**Current State:** No constraints system.

**Missing:** Pin to edges, scale with parent, fixed size — Figma's responsive design foundation.

**Fix Required:**
- Add constraint type definitions
- Constraint calculation engine
- UI in PropertiesPanel (horizontal/vertical constraint dropdowns)

**Effort:** High (3-4 days)

---

### 13. Frame Tool (F)

**Current State:** Only shapes exist (Rectangle, Ellipse, etc.). No Frame/Artboard concept.

**Missing:** Frames are Figma's container primitive — they clip children, have auto-layout, constraints, and act as artboards.

**Fix Required:**
- Add Frame as a distinct type (container with clip, background, padding)
- Frame tool (F shortcut) to draw frames
- Frame acts as parent for child objects
- Clip overflow support

**Effort:** High (3-5 days)

---

### 14. Eyedropper Tool (I)

**Current State:** No color picker from canvas.

**Fix Required:**
- Read pixel color at cursor position from canvas
- Apply picked color to selected object's fill or stroke
- I keyboard shortcut

**Effort:** Low (4-6 hours)

---

## Fix Priority Sequence

The recommended order considers dependencies and impact:

```
Phase 1 — Quick Wins (1-2 days)
  [3] Layer Visibility/Lock     ← 2-3 hours, instant usability gain
  [8] Advanced Stroke            ← 4-6 hours, easy Fabric.js mapping
  [14] Eyedropper Tool           ← 4-6 hours, standalone

Phase 2 — Core Functionality (1 week)
  [1] Boolean Operations         ← 1-2 days, install polygon-clipping + rewrite
  [2] Vector Path Editing        ← 3-5 days, most complex but most important
  [5] Component Panel UI         ← 1-2 days, engine already done

Phase 3 — Design Features (1 week)
  [4] Variable Binding UI        ← 1-2 days, engine ready
  [6] Gradient Fills             ← 2-3 days
  [7] Effects (Shadow/Blur)      ← 2-3 days
  [10] Advanced Text             ← 1-2 days

Phase 4 — Architecture (1-2 weeks)
  [11] Undo/Redo                 ← 2-3 days, affects entire app
  [13] Frame Tool                ← 3-5 days, foundational container type
  [9] Per-Vertex Corner Radius   ← 1-2 days, may need custom Fabric shape
  [12] Constraints               ← 3-4 days, depends on Frame Tool
```

---

## Dependency Graph

```
[13] Frame Tool
  └── [12] Constraints (requires Frame as container)

[2] Vector Path Editing
  └── uses shared logic from PenTool + VectorNetworkEngine

[4] Variable Binding UI
  └── [3] Layer Visibility/Lock (needs proper object state management first)

[11] Undo/Redo
  └── should be implemented before Phase 3 ideally, but can be deferred

All other items are independent and can be parallelized.
```

---

## Total Effort Estimate

| Phase | Items | Estimate |
|-------|-------|----------|
| Phase 1 — Quick Wins | 3, 8, 14 | 1-2 days |
| Phase 2 — Core | 1, 2, 5 | 5-9 days |
| Phase 3 — Design | 4, 6, 7, 10 | 5-9 days |
| Phase 4 — Architecture | 11, 13, 9, 12 | 9-14 days |
| **Total** | **14 items** | **~20-34 days** |

---

## Tech Stack Notes

- **polygon-clipping** — preferred over ClipperLib (smaller, TypeScript native, no WASM)
- **Fabric.js v7** — already in use, supports shadows, gradients, filters natively
- **Zustand + Immer** — extend existing store pattern for new features
- All new UI follows existing panel pattern (see `PropertiesPanel.tsx`, `LayersPanel.tsx`)
