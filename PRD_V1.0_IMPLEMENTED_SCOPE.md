# Flow Builder for Figma - PRD (Implemented Scope)

Version: 1.0 (Implemented)  
Last updated: 2026-07-13

---

## 1. Project Overview

### 1.1 Project Name
Flow Builder for Figma

### 1.2 Product Summary
Flow Builder is a connector-focused Figma plugin that helps UI/UX teams quickly draw stable orthogonal connectors between two screens/frames without repetitive manual arrow work.

### 1.3 Problem Statement
When building User Flow / UI Flow in Figma, teams repeatedly spend time on:
- Manual connector drawing
- Manual arrow direction correction
- Rework when frames move or resize
- Path cleanup for orthogonal flow readability

### 1.4 Solution (Implemented)
In v1.0 implemented scope, users:
1. Select 2 frames (or image-filled layers)
2. Click **Generate Connector**
3. Get a stable orthogonal connector with arrow direction based on selection order

The connector stays attached when connected frames move/resize.

---

## 2. Target Users

- UI Designers creating screen-to-screen flow
- UX Designers maintaining user journey maps
- Product Managers reviewing key interaction transitions
- Business Analysts documenting process flow paths

---

## 3. Product Goals (Implemented Scope)

1. Reduce connector drawing effort to one primary action
2. Ensure stable connector geometry under frame movement
3. Keep interaction simple and predictable for daily design use

---

## 4. User Flow (Implemented)

Open Plugin  
-> Select 2 Frames / Image-filled layers  
-> Click **Generate Connector**  
-> Connector is generated (orthogonal path + arrow)  
-> Move/resize frames  
-> Connector updates and remains attached

---

## 5. Functional Requirements (Implemented)

### FR-001 Selection Detection
- Plugin must require exactly 2 selected nodes
- Supported node types:
  - Frame
  - Any node with image fill

### FR-002 Connector Generation
- Plugin must generate one connector per action
- Connector must use orthogonal (right-angle) route style
- Connector must include an arrow terminal

### FR-003 Direction by Selection Order
- First selected node = source
- Second selected node = target
- Arrow direction follows source -> target

### FR-004 Endpoint Anchoring
- Connector must anchor to source/target frame edges
- Endpoint calculations use absolute page coordinates to avoid hierarchy offset issues

### FR-005 Incremental Sync on Move/Resize
- Connector must update when connected nodes move/resize
- Update strategy:
  - Throttled incremental sync
  - Geometry epsilon guards to reduce jitter/noise updates

### FR-006 Stable Container Model
- Connector output is exposed as a **Group** object
- Internal geometry is managed in a deterministic internal container for stability

### FR-007 Debug Mode (Optional)
- UI includes a debug toggle
- When enabled, show endpoint/path markers (start/mid/end)
- Debug state persists via local plugin storage

---

## 6. UI/Interaction Requirements (Implemented)

- Primary CTA: **Generate Connector**
- Inline status feedback below button:
  - Success
  - Error
- Debug toggle available in plugin panel
- No forced viewport zoom/scroll side effects during generation

---

## 7. Non-Goals / Deferred Scope (Not in implemented v1.0)

The following were intentionally deferred to future versions:
- Node generation (None / Process / Decision)
- Node text editing flow
- Forced frame auto-spacing (e.g., 120px)
- Forced frame auto-alignment behavior
- Advanced connector styling presets (dash, color profiles, terminals library)

---

## 8. Acceptance Criteria

1. Selecting 2 supported nodes and clicking Generate Connector creates one connector successfully
2. Left-to-right and right-to-left selection order both produce correct arrow direction
3. Connector remains attached after moving/resizing either connected frame
4. Connector path remains orthogonal and readable in common flow layouts
5. Plugin does not auto-reposition selected frames
6. Plugin does not auto-zoom viewport on generate
7. Debug mode can be toggled and persisted

---

## 9. Known Operational Notes

- In some Figma environments, document incremental mode requires `loadAllPagesAsync` before documentchange sync registration; this is handled in implementation.
- For local dev imports, build artifacts in `dist/` must exist before importing manifest.
